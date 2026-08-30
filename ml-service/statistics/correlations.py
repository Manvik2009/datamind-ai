import pandas as pd
import numpy as np
from typing import Dict, List, Any


def detect_outliers_iqr(series: pd.Series) -> Dict[str, Any]:
    clean = series.dropna()
    if len(clean) < 4:
        return {
            'outlier_count': 0,
            'outlier_percentage': 0.0,
            'lower_bound': None,
            'upper_bound': None,
            'method': 'iqr',
        }
    q1 = float(clean.quantile(0.25))
    q3 = float(clean.quantile(0.75))
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers = clean[(clean < lower_bound) | (clean > upper_bound)]
    count = int(len(outliers))
    pct = round((count / len(clean)) * 100, 2)
    return {
        'outlier_count': count,
        'outlier_percentage': pct,
        'lower_bound': lower_bound,
        'upper_bound': upper_bound,
        'method': 'iqr',
    }


def detect_outliers(df: pd.DataFrame, detected_types: Dict[str, str]) -> Dict[str, Any]:
    results = {}
    for col in df.columns:
        if detected_types.get(col) == 'numeric':
            results[col] = detect_outliers_iqr(df[col])
        else:
            results[col] = {
                'outlier_count': 0,
                'outlier_percentage': 0.0,
                'lower_bound': None,
                'upper_bound': None,
                'method': 'iqr',
                'note': 'Non-numeric column',
            }
    return results


def compute_correlations(df: pd.DataFrame, detected_types: Dict[str, str]) -> Dict[str, Any]:
    numeric_cols = [col for col, t in detected_types.items() if t == 'numeric']
    if len(numeric_cols) < 2:
        return {'matrix': {}, 'relationships': []}

    numeric_df = df[numeric_cols].select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return {'matrix': {}, 'relationships': []}

    corr_matrix = numeric_df.corr(method='pearson', min_periods=1).round(4).to_dict()
    relationships = []
    seen = set()
    for i, col_a in enumerate(numeric_df.columns):
        for j, col_b in enumerate(numeric_df.columns):
            if i >= j:
                continue
            val = corr_matrix.get(col_a, {}).get(col_b)
            if val is None or pd.isna(val):
                continue
            pair = tuple(sorted((col_a, col_b)))
            if pair in seen:
                continue
            seen.add(pair)
            relationship = 'no_relationship'
            abs_val = abs(float(val))
            if abs_val >= 0.7:
                relationship = 'strong_positive' if float(val) > 0 else 'strong_negative'
            elif abs_val >= 0.4:
                relationship = 'moderate_positive' if float(val) > 0 else 'moderate_negative'
            elif abs_val >= 0.2:
                relationship = 'weak_positive' if float(val) > 0 else 'weak_negative'
            relationships.append({
                'column_a': str(col_a),
                'column_b': str(col_b),
                'correlation': float(val),
                'relationship': relationship,
            })
    return {'matrix': corr_matrix, 'relationships': relationships}
