import pandas as pd
import numpy as np
from typing import Dict, List, Any


def detect_missing_values(df: pd.DataFrame) -> Dict[str, Any]:
    rows, _ = df.shape
    report = []
    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum())
        pct = round((missing / rows) * 100, 2) if rows > 0 else 0.0
        if missing == 0:
            category = 'complete'
        elif pct < 5:
            category = 'low_missingness'
        elif pct < 20:
            category = 'moderate_missingness'
        else:
            category = 'high_missingness'
        report.append({
            'column': str(col),
            'missing_count': missing,
            'missing_percentage': pct,
            'category': category,
        })
    total_missing = int(df.isna().sum().sum())
    total_pct = round((total_missing / (rows * len(df.columns))) * 100, 2) if (rows * len(df.columns)) > 0 else 0.0
    return {
        'total_missing': total_missing,
        'total_percentage': total_pct,
        'columns': report,
    }


def detect_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
    rows = len(df)
    duplicates = int(df.duplicated().sum())
    pct = round((duplicates / rows) * 100, 2) if rows > 0 else 0.0
    return {
        'duplicate_rows': duplicates,
        'duplicate_percentage': pct,
        'has_duplicates': duplicates > 0,
    }
