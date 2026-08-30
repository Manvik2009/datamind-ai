import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class ColumnProfile:
    column: str
    dtype: str
    missing: int
    missing_percentage: float
    unique_values: int
    sample_values: List[Any]


@dataclass
class DatasetProfile:
    rows: int
    columns: int
    memory_bytes: int
    duplicate_rows: int
    duplicate_percentage: float
    missing_values: int
    missing_percentage: float
    columns_detail: List[Dict[str, Any]]
    quality_score: int
    quality_breakdown: Dict[str, Any]


def detect_column_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return 'boolean'
    if pd.api.types.is_integer_dtype(series):
        return 'numeric'
    if pd.api.types.is_float_dtype(series):
        return 'numeric'
    if pd.api.types.is_datetime64_any_dtype(series):
        return 'datetime'
    if pd.api.types.is_categorical_dtype(series) or series.nunique() <= 20:
        return 'categorical'
    if series.nunique() > 1000:
        return 'text'
    return 'categorical'


def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        raise ValueError('Cannot profile an empty dataset');

    rows, columns = df.shape
    memory_bytes = int(df.memory_usage(deep=True).sum())
    duplicate_rows = int(df.duplicated().sum())
    duplicate_percentage = round((duplicate_rows / rows) * 100, 2) if rows > 0 else 0.0
    missing_values = int(df.isna().sum().sum())
    missing_percentage = round((missing_values / (rows * columns)) * 100, 2) if (rows * columns) > 0 else 0.0

    columns_detail = []
    for col in df.columns:
        series = df[col]
        col_type = detect_column_type(series)
        missing = int(series.isna().sum())
        missing_pct = round((missing / rows) * 100, 2) if rows > 0 else 0.0
        unique = int(series.nunique())
        sample = series.dropna().head(5).tolist()
        sample = [str(v) if not pd.isna(v) else None for v in sample]
        columns_detail.append({
            'column': str(col),
            'dtype': str(series.dtype),
            'detected_type': col_type,
            'missing': missing,
            'missing_percentage': missing_pct,
            'unique_values': unique,
            'sample_values': sample,
        })

    return {
        'rows': rows,
        'columns': columns,
        'memory_bytes': memory_bytes,
        'duplicate_rows': duplicate_rows,
        'duplicate_percentage': duplicate_percentage,
        'missing_values': missing_values,
        'missing_percentage': missing_percentage,
        'columns_detail': columns_detail,
    }


def calculate_quality_score(profile: Dict[str, Any]) -> Dict[str, Any]:
    rows = profile['rows']
    columns = profile['columns']
    if rows == 0 or columns == 0:
        return {'score': 0, 'breakdown': {'empty_dataset': 0}}

    missing_score = max(0, 100 - profile['missing_percentage'] * 10)
    duplicate_score = max(0, 100 - profile['duplicate_percentage'] * 5)

    type_penalty = 0
    for col in profile['columns_detail']:
        if col['detected_type'] == 'unknown':
            type_penalty += 5

    type_score = max(0, 100 - type_penalty)

    missing_penalty = profile['missing_percentage']
    duplicate_penalty = profile['duplicate_percentage'] * 0.5
    type_penalty_total = type_penalty

    overall = max(0, round((missing_score + duplicate_score + type_score) / 3))
    breakdown = {
        'missing_values': round(missing_score),
        'duplicates': round(duplicate_score),
        'data_types': round(type_score),
        'overall': overall,
    }
    return {'score': overall, 'breakdown': breakdown}
