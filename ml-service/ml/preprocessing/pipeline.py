import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

from statistics.summarizer import detect_column_types


@dataclass
class MLConfig:
    target_column: str
    problem_type: Optional[str] = None
    test_size: float = 0.2
    random_seed: int = 42
    selected_features: Optional[List[str]] = None


@dataclass
class FeatureAnalysis:
    numerical_features: List[str]
    categorical_features: List[str]
    boolean_features: List[str]
    datetime_features: List[str]
    text_features: List[str]
    identifier_features: List[str]
    excluded_features: List[str]
    all_features: List[str]


@dataclass
class PreprocessedData:
    X_train: Any
    X_test: Any
    y_train: Any
    y_test: Any
    feature_names: List[str]
    target_column: str
    problem_type: str
    class_distribution: Optional[Dict[str, int]] = None


def analyze_features(df: pd.DataFrame, target_column: str, detected_types: Dict[str, str]) -> FeatureAnalysis:
    numerical = []
    categorical = []
    boolean_features = []
    datetime_features = []
    text_features = []
    identifier_features = []
    excluded = []

    id_patterns = ['id', 'uuid', 'guid', 'key', 'index', 'rowid']

    for col in df.columns:
        if col == target_column:
            continue

        col_lower = col.lower()
        is_likely_id = any(pattern in col_lower for pattern in id_patterns)
        if is_likely_id and df[col].nunique() > len(df) * 0.8:
            identifier_features.append(col)
            excluded.append((col, 'Likely identifier column'))
            continue

        dtype = detected_types.get(col, 'text')
        if dtype == 'numeric':
            numerical.append(col)
        elif dtype == 'categorical':
            categorical.append(col)
        elif dtype == 'boolean':
            boolean_features.append(col)
        elif dtype == 'datetime':
            datetime_features.append(col)
        else:
            text_features.append(col)
            excluded.append((col, 'Text column - requires NLP phase'))

    all_features = numerical + categorical + boolean_features + datetime_features
    return FeatureAnalysis(
        numerical_features=numerical,
        categorical_features=categorical,
        boolean_features=boolean_features,
        datetime_features=datetime_features,
        text_features=text_features,
        identifier_features=identifier_features,
        excluded_features=[ex[0] for ex in excluded],
        all_features=all_features,
    )


def detect_problem_type(df: pd.DataFrame, target_column: str, detected_types: Dict[str, str]) -> Tuple[str, bool]:
    target_dtype = detected_types.get(target_column, 'text')
    unique_count = df[target_column].nunique()
    total_count = len(df)

    if target_dtype == 'boolean':
        return 'binary_classification', True

    if target_dtype == 'categorical':
        if unique_count == 2:
            return 'binary_classification', True
        elif unique_count <= 20:
            return 'multiclass_classification', True
        else:
            return 'classification_uncertain', False

    if target_dtype == 'numeric':
        unique_ratio = unique_count / total_count if total_count > 0 else 0
        if unique_ratio < 0.1 and unique_count <= 20:
            return 'regression', True
        elif unique_ratio >= 0.1:
            return 'regression', True
        else:
            return 'regression_uncertain', False

    return 'unknown', False


def build_preprocessor(features: FeatureAnalysis) -> ColumnTransformer:
    transformers = []

    if features.numerical_features:
        numerical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        transformers.append(('num', numerical_transformer, features.numerical_features))

    if features.categorical_features:
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        transformers.append(('cat', categorical_transformer, features.categorical_features))

    if features.boolean_features:
        boolean_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent'))
        ])
        transformers.append(('bool', boolean_transformer, features.boolean_features))

    if features.datetime_features:
        def extract_datetime_features(df_subset):
            result = pd.DataFrame()
            for col in df_subset.columns:
                dt_col = pd.to_datetime(df_subset[col], errors='coerce')
                result[f'{col}_year'] = dt_col.dt.year
                result[f'{col}_month'] = dt_col.dt.month
                result[f'{col}_day'] = dt_col.dt.day
                result[f'{col}_dayofweek'] = dt_col.dt.dayofweek
            return result.fillna(0).values

        datetime_transformer = Pipeline(steps=[
            ('extract', ('datetime', extract_datetime_features, features.datetime_features))
        ])
        transformers.append(('dt', datetime_transformer, features.datetime_features))

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder='drop'
    )

    return preprocessor


def preprocess_data(df: pd.DataFrame, config: MLConfig, detected_types: Dict[str, str]) -> PreprocessedData:
    target_col = config.target_column
    problem_type, is_certain = detect_problem_type(df, target_col, detected_types)

    if problem_type in ('unknown', 'classification_uncertain', 'regression_uncertain'):
        raise ValueError(f'Cannot determine problem type for target: {target_col}')

    features = analyze_features(df, target_col, detected_types)

    if len(features.all_features) == 0:
        raise ValueError('No usable features found for training')

    X = df[features.all_features]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=config.test_size,
        random_state=config.random_seed,
        stratify=y if problem_type in ('binary_classification', 'multiclass_classification') else None
    )

    class_dist = None
    if problem_type in ('binary_classification', 'multiclass_classification'):
        class_dist = {str(k): int(v) for k, v in y_train.value_counts().items()}

    return PreprocessedData(
        X_train=X_train,
        X_test=X_test,
        y_train=y_train,
        y_test=y_test,
        feature_names=features.all_features,
        target_column=target_col,
        problem_type=problem_type,
        class_distribution=class_dist,
    )
