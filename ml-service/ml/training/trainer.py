import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, mean_squared_error, r2_score,
    confusion_matrix
)
import warnings
warnings.filterwarnings('ignore')

from .pipeline import PreprocessedData


@dataclass
class ModelResult:
    model_type: str
    model_id: str
    metrics: Dict[str, Any]
    feature_importance: Optional[Dict[str, float]]
    training_time_ms: int
    status: str


@dataclass
class ExperimentResult:
    problem_type: str
    models: List[ModelResult]
    best_model: ModelResult
    primary_metric: str
    comparison: List[Dict[str, Any]]


def get_models_for_problem(problem_type: str) -> List[tuple]:
    if problem_type == 'binary_classification':
        return [
            ('logistic_regression', LogisticRegression(max_iter=1000, random_state=42)),
            ('decision_tree', DecisionTreeClassifier(random_state=42)),
            ('random_forest', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('gradient_boosting', GradientBoostingClassifier(n_estimators=100, random_state=42)),
        ]
    elif problem_type == 'multiclass_classification':
        return [
            ('logistic_regression', LogisticRegression(max_iter=1000, random_state=42)),
            ('decision_tree', DecisionTreeClassifier(random_state=42)),
            ('random_forest', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('gradient_boosting', GradientBoostingClassifier(n_estimators=100, random_state=42)),
        ]
    elif problem_type == 'regression':
        return [
            ('linear_regression', LinearRegression()),
            ('decision_tree', DecisionTreeRegressor(random_state=42)),
            ('random_forest', RandomForestRegressor(n_estimators=100, random_state=42)),
            ('gradient_boosting', GradientBoostingRegressor(n_estimators=100, random_state=42)),
        ]
    return []


def train_model(model_name: str, model, X_train, y_train, X_test, y_test, problem_type: str) -> ModelResult:
    import time
    import uuid

    start_time = time.time()
    try:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        training_time = int((time.time() - start_time) * 1000)

        metrics = {}
        feature_importance = None

        if problem_type in ('binary_classification', 'multiclass_classification'):
            metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
            metrics['precision'] = float(precision_score(y_test, y_pred, average='macro', zero_division=0))
            metrics['recall'] = float(recall_score(y_test, y_pred, average='macro', zero_division=0))
            metrics['f1'] = float(f1_score(y_test, y_pred, average='macro', zero_division=0))

            if problem_type == 'binary_classification':
                try:
                    from sklearn.metrics import roc_auc_score
                    y_prob = model.predict_proba(X_test)[:, 1]
                    metrics['roc_auc'] = float(roc_auc_score(y_test, y_prob))
                except Exception:
                    pass

            cm = confusion_matrix(y_test, y_pred).tolist()
            metrics['confusion_matrix'] = cm

            if hasattr(model, 'feature_importances_'):
                feature_importance = {f'feature_{i}': float(imp) for i, imp in enumerate(model.feature_importances_)}

        elif problem_type == 'regression':
            metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
            metrics['mse'] = float(mean_squared_error(y_test, y_pred))
            metrics['rmse'] = float(np.sqrt(metrics['mse']))
            metrics['r2'] = float(r2_score(y_test, y_pred))

            if hasattr(model, 'feature_importances_'):
                feature_importance = {f'feature_{i}': float(imp) for i, imp in enumerate(model.feature_importances_)}

        return ModelResult(
            model_type=model_name,
            model_id=str(uuid.uuid4()),
            metrics=metrics,
            feature_importance=feature_importance,
            training_time_ms=training_time,
            status='TRAINED'
        )
    except Exception as e:
        training_time = int((time.time() - start_time) * 1000)
        return ModelResult(
            model_type=model_name,
            model_id=str(uuid.uuid4()),
            metrics={'error': str(e)},
            feature_importance=None,
            training_time_ms=training_time,
            status='FAILED'
        )


def run_experiment(data: PreprocessedData, selected_models: Optional[List[str]] = None) -> ExperimentResult:
    models = get_models_for_problem(data.problem_type)
    if selected_models:
        models = [(name, model) for name, model in models if name in selected_models]

    primary_metric = 'f1' if 'classification' in data.problem_type else 'rmse'
    results = []

    for model_name, model in models:
        result = train_model(model_name, model, data.X_train, data.y_train, data.X_test, data.y_test, data.problem_type)
        results.append(result)

    successful = [r for r in results if r.status == 'TRAINED']
    if not successful:
        raise ValueError('All models failed to train')

    if primary_metric == 'rmse':
        best_model = min(successful, key=lambda r: r.metrics.get('rmse', float('inf')))
    else:
        best_model = max(successful, key=lambda r: r.metrics.get(primary_metric, 0))

    comparison = []
    for r in results:
        comparison.append({
            'model_type': r.model_type,
            'model_id': r.model_id,
            'status': r.status,
            'metrics': r.metrics,
            'training_time_ms': r.training_time_ms,
        })

    return ExperimentResult(
        problem_type=data.problem_type,
        models=results,
        best_model=best_model,
        primary_metric=primary_metric,
        comparison=comparison
    )


def predict(model, X, problem_type: str) -> Dict[str, Any]:
    predictions = model.predict(X)
    result = {'predictions': predictions.tolist()}

    if problem_type in ('binary_classification', 'multiclass_classification'):
        try:
            probabilities = model.predict_proba(X)
            result['probabilities'] = probabilities.tolist()
        except Exception:
            pass

    return result
