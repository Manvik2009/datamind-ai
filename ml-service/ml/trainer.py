"""ML Model Training Module for DataMind AI.

Handles training classification and regression models using scikit-learn.
"""

import pandas as pd
import numpy as np
import json
import os
import pickle
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, r2_score, mean_absolute_error,
    confusion_matrix, classification_report
)

MODEL_DIR = os.environ.get('MODEL_DIR', '/tmp/datamind-models')
os.makedirs(MODEL_DIR, exist_ok=True)

SUPPORTED_CLASSIFIERS = {
    'random_forest': RandomForestClassifier,
    'gradient_boosting': GradientBoostingClassifier,
    'logistic_regression': LogisticRegression,
}

SUPPORTED_REGRESSORS = {
    'random_forest': RandomForestRegressor,
    'gradient_boosting': GradientBoostingRegressor,
    'linear_regression': LinearRegression,
}

MAX_TRAINING_TIME_SECONDS = 300
MAX_SAMPLES = 100000


class TrainingError(Exception):
    """Custom exception for training failures."""
    pass


def _detect_problem_type(df: pd.DataFrame, target_column: str) -> str:
    """Detect whether the problem is classification or regression."""
    target = df[target_column]
    unique_count = target.nunique()
    total_count = len(target)

    if target.dtype == 'object' or target.dtype.name == 'category':
        return 'classification'
    if unique_count <= 10 and unique_count / total_count < 0.05:
        return 'classification'
    if unique_count <= 2:
        return 'classification'
    return 'regression'


def _preprocess_features(
    df: pd.DataFrame,
    feature_columns: List[str],
    target_column: str,
    scaler: Optional[StandardScaler] = None,
    fit_scaler: bool = False,
    label_encoders: Optional[Dict[str, LabelEncoder]] = None,
    target_encoder: Optional[LabelEncoder] = None,
    fit_encoders: bool = False,
) -> Tuple[np.ndarray, np.ndarray, StandardScaler, Dict[str, LabelEncoder], Optional[LabelEncoder]]:
    """Preprocess features and target for model training/prediction."""
    X = df[feature_columns].copy()
    y = df[target_column].copy()

    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()

    if label_encoders is None:
        label_encoders = {}

    for col in categorical_cols:
        if fit_encoders:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
        else:
            le = label_encoders.get(col)
            if le:
                X[col] = X[col].astype(str).map(
                    lambda x: le.transform([x])[0] if x in le.classes_ else -1
                )

    if scaler is None:
        scaler = StandardScaler()

    if fit_scaler and numeric_cols:
        X[numeric_cols] = scaler.fit_transform(X[numeric_cols])
    elif numeric_cols:
        X[numeric_cols] = scaler.transform(X[numeric_cols])

    if y.dtype == 'object' or y.dtype.name == 'category':
        if fit_encoders:
            target_encoder = LabelEncoder()
            y = target_encoder.fit_transform(y.astype(str))
        elif target_encoder:
            y = y.astype(str).map(
                lambda x: target_encoder.transform([x])[0] if x in target_encoder.classes_ else -1
            )
    else:
        y = y.values

    return X.values, y, scaler, label_encoders, target_encoder


def _get_model_class(model_type: str, problem_type: str):
    """Get the sklearn model class for a given type and problem."""
    if problem_type == 'classification':
        return SUPPORTED_CLASSIFIERS.get(model_type, RandomForestClassifier)
    return SUPPORTED_REGRESSORS.get(model_type, RandomForestRegressor)


def _compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, problem_type: str) -> Dict[str, Any]:
    """Compute evaluation metrics based on problem type."""
    if problem_type == 'classification':
        metrics = {
            'accuracy': round(float(accuracy_score(y_true, y_pred)), 4),
            'precision': round(float(precision_score(y_true, y_pred, average='weighted', zero_division=0)), 4),
            'recall': round(float(recall_score(y_true, y_pred, average='weighted', zero_division=0)), 4),
            'f1': round(float(f1_score(y_true, y_pred, average='weighted', zero_division=0)), 4),
        }
    else:
        metrics = {
            'mse': round(float(mean_squared_error(y_true, y_pred)), 4),
            'rmse': round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
            'mae': round(float(mean_absolute_error(y_true, y_pred)), 4),
            'r2': round(float(r2_score(y_true, y_pred)), 4),
        }
    return metrics


def _compute_feature_importance(model, feature_names: List[str]) -> Dict[str, float]:
    """Extract feature importance from a trained model."""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_).flatten()
    else:
        return {}

    total = sum(importances)
    if total == 0:
        return {name: 0.0 for name in feature_names}

    return {name: round(float(imp / total), 6) for name, imp in zip(feature_names, importances)}


def train_model(
    dataset_path: str,
    target_column: str,
    problem_type: Optional[str] = None,
    test_size: float = 0.2,
    random_seed: int = 42,
    selected_features: Optional[List[str]] = None,
    model_types: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Train ML models and return results."""
    if not os.path.exists(dataset_path):
        raise TrainingError(f"Dataset file not found: {dataset_path}")

    ext = os.path.splitext(dataset_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(dataset_path)
    elif ext in ('.xlsx', '.xls'):
        df = pd.read_excel(dataset_path)
    else:
        raise TrainingError(f"Unsupported file format: {ext}")

    if target_column not in df.columns:
        raise TrainingError(f"Target column '{target_column}' not found in dataset")

    if len(df) > MAX_SAMPLES:
        df = df.sample(n=MAX_SAMPLES, random_state=random_seed)

    if problem_type is None:
        problem_type = _detect_problem_type(df, target_column)

    all_columns = [c for c in df.columns if c != target_column]
    if selected_features:
        feature_columns = [c for c in selected_features if c in all_columns and c != target_column]
    else:
        feature_columns = all_columns

    if not feature_columns:
        raise TrainingError("No valid feature columns available for training")

    df_clean = df[feature_columns + [target_column]].dropna(subset=[target_column])
    if len(df_clean) < 10:
        raise TrainingError("Insufficient data after removing rows with missing target values")

    X, y, scaler, label_encoders, target_encoder = _preprocess_features(
        df_clean, feature_columns, target_column,
        fit_scaler=True, fit_encoders=True
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_seed, stratify=y if problem_type == 'classification' and len(np.unique(y)) > 1 else None
    )

    if model_types is None:
        if problem_type == 'classification':
            model_types = ['random_forest', 'gradient_boosting']
        else:
            model_types = ['random_forest', 'gradient_boosting']

    comparison = []
    best_model_info = None
    best_metric_value = -float('inf')

    primary_metric = 'f1' if problem_type == 'classification' else 'r2'

    for model_type in model_types:
        try:
            model_class = _get_model_class(model_type, problem_type)
            model = model_class(random_state=random_seed, **(
                {'n_estimators': 100, 'max_depth': 10} if 'n_estimators' in model_class().get_params() else {}
            ))

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            metrics = _compute_metrics(y_test, y_pred, problem_type)
            feature_importance = _compute_feature_importance(model, feature_columns)

            model_id = str(uuid.uuid4())
            model_artifact = {
                'model': model,
                'scaler': scaler,
                'label_encoders': label_encoders,
                'target_encoder': target_encoder,
                'feature_columns': feature_columns,
                'target_column': target_column,
                'problem_type': problem_type,
                'model_type': model_type,
                'classes': target_encoder.classes_.tolist() if target_encoder else None,
            }

            artifact_path = os.path.join(MODEL_DIR, f"{model_id}.pkl")
            with open(artifact_path, 'wb') as f:
                pickle.dump(model_artifact, f)

            model_result = {
                'model_id': model_id,
                'model_type': model_type,
                'status': 'completed',
                'metrics': metrics,
                'feature_importance': feature_importance,
                'training_time_ms': 0,
                'artifact_path': artifact_path,
            }
            comparison.append(model_result)

            current_metric = metrics.get(primary_metric, -float('inf'))
            if current_metric > best_metric_value:
                best_metric_value = current_metric
                best_model_info = model_result

        except Exception as e:
            comparison.append({
                'model_id': None,
                'model_type': model_type,
                'status': 'failed',
                'error': str(e),
                'metrics': {},
                'feature_importance': {},
                'training_time_ms': 0,
            })

    if best_model_info is None:
        raise TrainingError("All models failed to train")

    return {
        'problem_type': problem_type,
        'primary_metric': primary_metric,
        'best_model': best_model_info,
        'comparison': comparison,
        'class_distribution': {
            str(cls): int(cnt) for cls, cnt in zip(*np.unique(y, return_counts=True))
        },
    }


def run_prediction(
    model_id: str,
    features: Dict[str, Any],
) -> Dict[str, Any]:
    """Run prediction using a trained model."""
    artifact_path = os.path.join(MODEL_DIR, f"{model_id}.pkl")

    if not os.path.exists(artifact_path):
        raise FileNotFoundError(f"Model artifact not found: {model_id}")

    with open(artifact_path, 'rb') as f:
        artifact = pickle.load(f)

    model = artifact['model']
    scaler = artifact['scaler']
    label_encoders = artifact['label_encoders']
    target_encoder = artifact['target_encoder']
    feature_columns = artifact['feature_columns']
    target_column = artifact['target_column']
    problem_type = artifact['problem_type']
    classes = artifact['classes']

    missing_features = [col for col in feature_columns if col not in features]
    if missing_features:
        raise ValueError(f"Missing required features: {missing_features}")

    input_df = pd.DataFrame([{col: features[col] for col in feature_columns}])

    numeric_cols = input_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = input_df.select_dtypes(include=['object', 'category']).columns.tolist()

    for col in categorical_cols:
        le = label_encoders.get(col)
        if le:
            val = input_df[col].astype(str).iloc[0]
            input_df[col] = le.transform([val])[0] if val in le.classes_ else -1

    if numeric_cols and scaler:
        input_df[numeric_cols] = scaler.transform(input_df[numeric_cols])

    X_input = input_df.values

    prediction = model.predict(X_input)[0]

    if problem_type == 'classification':
        probability = {}
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(X_input)[0]
            if classes:
                probability = {str(cls): round(float(p), 4) for cls, p in zip(classes, proba)}
            else:
                probability = {str(i): round(float(p), 4) for i, p in enumerate(proba)}
            predicted_class = classes[int(prediction)] if classes else str(prediction)
        else:
            predicted_class = classes[int(prediction)] if classes else str(prediction)
            probability = {}
    else:
        predicted_class = float(prediction)
        probability = {}

    feature_contributions = {}
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        total = sum(importances)
        if total > 0:
            feature_contributions = {
                col: round(float(imp / total), 4)
                for col, imp in zip(feature_columns, importances)
            }

    return {
        'prediction': {
            'value': predicted_class,
            'target_column': target_column,
        },
        'probability': probability if probability else None,
        'feature_contributions': feature_contributions,
        'model_type': problem_type,
    }
