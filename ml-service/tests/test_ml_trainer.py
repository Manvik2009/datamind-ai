"""Tests for the ML trainer module."""

import pytest
import pandas as pd
import numpy as np
import os
import tempfile
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ml.trainer import (
    train_model,
    run_prediction,
    _detect_problem_type,
    _compute_metrics,
    _compute_feature_importance,
    TrainingError,
)


@pytest.fixture
def sample_classification_df():
    """Create a sample classification dataset."""
    np.random.seed(42)
    n = 200
    return pd.DataFrame({
        'contract_length': np.random.choice([1, 6, 12, 24], n),
        'monthly_charges': np.random.uniform(20, 200, n).round(2),
        'support_calls': np.random.randint(0, 10, n),
        'churn': np.random.choice([0, 1], n, p=[0.7, 0.3]),
    })


@pytest.fixture
def sample_regression_df():
    """Create a sample regression dataset."""
    np.random.seed(42)
    n = 200
    return pd.DataFrame({
        'square_feet': np.random.uniform(500, 5000, n).round(0),
        'bedrooms': np.random.randint(1, 6, n),
        'age': np.random.randint(0, 100, n),
        'price': np.random.uniform(100000, 1000000, n).round(0),
    })


@pytest.fixture
def classification_csv(sample_classification_df, tmp_path):
    """Create a temporary CSV file with classification data."""
    filepath = tmp_path / "classification_data.csv"
    sample_classification_df.to_csv(filepath, index=False)
    return str(filepath)


@pytest.fixture
def regression_csv(sample_regression_df, tmp_path):
    """Create a temporary CSV file with regression data."""
    filepath = tmp_path / "regression_data.csv"
    sample_regression_df.to_csv(filepath, index=False)
    return str(filepath)


class TestDetectProblemType:
    def test_detect_classification_with_binary_target(self, sample_classification_df):
        result = _detect_problem_type(sample_classification_df, 'churn')
        assert result == 'classification'

    def test_detect_classification_with_string_target(self):
        df = pd.DataFrame({
            'feature1': [1, 2, 3],
            'target': ['yes', 'no', 'yes'],
        })
        result = _detect_problem_type(df, 'target')
        assert result == 'classification'

    def test_detect_regression_with_continuous_target(self, sample_regression_df):
        result = _detect_problem_type(sample_regression_df, 'price')
        assert result == 'regression'


class TestComputeMetrics:
    def test_classification_metrics(self):
        y_true = np.array([0, 0, 1, 1, 1])
        y_pred = np.array([0, 1, 1, 1, 0])
        metrics = _compute_metrics(y_true, y_pred, 'classification')

        assert 'accuracy' in metrics
        assert 'precision' in metrics
        assert 'recall' in metrics
        assert 'f1' in metrics
        assert 0 <= metrics['accuracy'] <= 1

    def test_regression_metrics(self):
        y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        y_pred = np.array([1.1, 2.2, 2.9, 4.1, 4.8])
        metrics = _compute_metrics(y_true, y_pred, 'regression')

        assert 'mse' in metrics
        assert 'rmse' in metrics
        assert 'mae' in metrics
        assert 'r2' in metrics
        assert metrics['mse'] >= 0


class TestComputeFeatureImportance:
    def test_returns_dict_of_feature_importances(self):
        from sklearn.ensemble import RandomForestClassifier
        np.random.seed(42)
        X = np.random.rand(100, 3)
        y = np.random.randint(0, 2, 100)
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X, y)

        importance = _compute_feature_importance(model, ['f1', 'f2', 'f3'])
        assert len(importance) == 3
        assert abs(sum(importance.values()) - 1.0) < 0.01


class TestTrainModel:
    def test_train_classification_model(self, classification_csv):
        result = train_model(
            dataset_path=classification_csv,
            target_column='churn',
            problem_type='classification',
            test_size=0.2,
            random_seed=42,
            model_types=['random_forest'],
        )

        assert result['problem_type'] == 'classification'
        assert 'best_model' in result
        assert 'comparison' in result
        assert len(result['comparison']) == 1
        assert result['comparison'][0]['status'] == 'completed'
        assert 'metrics' in result['comparison'][0]

    def test_train_regression_model(self, regression_csv):
        result = train_model(
            dataset_path=regression_csv,
            target_column='price',
            problem_type='regression',
            test_size=0.2,
            random_seed=42,
            model_types=['random_forest'],
        )

        assert result['problem_type'] == 'regression'
        assert 'best_model' in result
        assert 'r2' in result['comparison'][0]['metrics']

    def test_train_multiple_models(self, classification_csv):
        result = train_model(
            dataset_path=classification_csv,
            target_column='churn',
            problem_type='classification',
            test_size=0.2,
            random_seed=42,
            model_types=['random_forest', 'gradient_boosting'],
        )

        assert len(result['comparison']) == 2
        assert result['best_model']['model_type'] in ['random_forest', 'gradient_boosting']

    def test_raises_error_for_missing_file(self):
        with pytest.raises(TrainingError, match="Dataset file not found"):
            train_model(
                dataset_path="/nonexistent/path.csv",
                target_column='target',
            )

    def test_raises_error_for_missing_target(self, classification_csv):
        with pytest.raises(TrainingError, match="Target column"):
            train_model(
                dataset_path=classification_csv,
                target_column='nonexistent_column',
            )

    def test_detects_problem_type_automatically(self, classification_csv):
        result = train_model(
            dataset_path=classification_csv,
            target_column='churn',
            problem_type=None,
            random_seed=42,
        )

        assert result['problem_type'] == 'classification'


class TestRunPrediction:
    def test_single_prediction(self, classification_csv):
        train_result = train_model(
            dataset_path=classification_csv,
            target_column='churn',
            problem_type='classification',
            random_seed=42,
            model_types=['random_forest'],
        )

        model_id = train_result['best_model']['model_id']

        prediction = run_prediction(
            model_id=model_id,
            features={'contract_length': 6, 'monthly_charges': 180.0, 'support_calls': 4},
        )

        assert 'prediction' in prediction
        assert 'probability' in prediction
        assert 'feature_contributions' in prediction

    def test_prediction_with_unknown_feature(self, classification_csv):
        train_result = train_model(
            dataset_path=classification_csv,
            target_column='churn',
            problem_type='classification',
            random_seed=42,
            model_types=['random_forest'],
        )

        model_id = train_result['best_model']['model_id']

        with pytest.raises(ValueError, match="Missing required features"):
            run_prediction(
                model_id=model_id,
                features={'unknown_feature': 123},
            )

    def test_raises_for_nonexistent_model(self):
        with pytest.raises(FileNotFoundError):
            run_prediction(
                model_id='nonexistent-model-id',
                features={'feature1': 1},
            )


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
