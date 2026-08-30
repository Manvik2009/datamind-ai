import pandas as pd
import numpy as np
from typing import Dict, List, Any


def detect_column_types(df: pd.DataFrame) -> Dict[str, str]:
    types: Dict[str, str] = {}
    for col in df.columns:
        series = df[col]
        if pd.api.types.is_bool_dtype(series):
            types[col] = 'boolean'
        elif pd.api.types.is_integer_dtype(series) or pd.api.types.is_float_dtype(series):
            types[col] = 'numeric'
        elif pd.api.types.is_datetime64_any_dtype(series):
            types[col] = 'datetime'
        elif pd.api.types.is_categorical_dtype(series) or series.nunique() <= 20:
            types[col] = 'categorical'
        else:
            types[col] = 'text'
    return types


def compute_numeric_stats(series: pd.Series) -> Dict[str, Any]:
    clean = series.dropna()
    count = int(clean.count())
    if count == 0:
        return {
            'count': 0,
            'mean': None,
            'median': None,
            'std': None,
            'min': None,
            'max': None,
            'q1': None,
            'q3': None,
        }
    return {
        'count': count,
        'mean': float(clean.mean()),
        'median': float(clean.median()),
        'std': float(clean.std()),
        'min': float(clean.min()),
        'max': float(clean.max()),
        'q1': float(clean.quantile(0.25)),
        'q3': float(clean.quantile(0.75)),
    }


def compute_categorical_stats(series: pd.Series) -> Dict[str, Any]:
    clean = series.dropna()
    count = int(clean.count())
    if count == 0:
        return {
            'count': 0,
            'unique_count': 0,
            'most_frequent': None,
            'most_frequent_count': 0,
        }
    value_counts = clean.value_counts()
    most_frequent = str(value_counts.index[0])
    most_frequent_count = int(value_counts.iloc[0])
    return {
        'count': count,
        'unique_count': int(clean.nunique()),
        'most_frequent': most_frequent,
        'most_frequent_count': most_frequent_count,
    }


def compute_statistics(df: pd.DataFrame, detected_types: Dict[str, str]) -> Dict[str, Any]:
    stats = {}
    for col in df.columns:
        series = df[col]
        col_type = detected_types.get(col, 'unknown')
        if col_type == 'numeric':
            stats[col] = {
                'type': 'numeric',
                **compute_numeric_stats(series),
            }
        elif col_type in ('categorical', 'boolean'):
            stats[col] = {
                'type': col_type,
                **compute_categorical_stats(series),
            }
        else:
            stats[col] = {
                'type': col_type,
                'count': int(series.count()),
            }
    return stats
