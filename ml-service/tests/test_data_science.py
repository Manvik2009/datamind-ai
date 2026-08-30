import pytest
import pandas as pd
import numpy as np
from profiling.profiler import profile_dataset, calculate_quality_score
from detection.detectors import detect_missing_values, detect_duplicates
from statistics.summarizer import compute_statistics, detect_column_types
from statistics.correlations import detect_outliers_iqr, compute_correlations


def test_profile_simple_dataset():
    df = pd.DataFrame({'a': [1, 2, 3, 4, 5], 'b': ['x', 'y', 'x', 'z', 'y']})
    profile = profile_dataset(df)
    assert profile['rows'] == 5
    assert profile['columns'] == 2
    assert profile['duplicate_rows'] == 0


def test_detect_missing_values():
    df = pd.DataFrame({'a': [1, None, 3], 'b': ['x', 'y', None]})
    report = detect_missing_values(df)
    assert report['total_missing'] == 2


def test_detect_duplicates():
    df = pd.DataFrame({'a': [1, 1, 2], 'b': ['x', 'x', 'y']})
    report = detect_duplicates(df)
    assert report['duplicate_rows'] == 1
    assert report['has_duplicates'] is True


def test_compute_statistics():
    df = pd.DataFrame({'a': [1, 2, 3, 4, 5], 'b': ['x', 'y', 'x', 'z', 'y']})
    types = detect_column_types(df)
    stats = compute_statistics(df, types)
    assert stats['a']['type'] == 'numeric'
    assert stats['a']['mean'] == pytest.approx(3.0)


def test_detect_outliers():
    df = pd.DataFrame({'a': [1, 2, 3, 4, 100]})
    result = detect_outliers_iqr(df['a'])
    assert result['outlier_count'] > 0


def test_compute_correlations():
    df = pd.DataFrame({'a': [1, 2, 3, 4, 5], 'b': [2, 4, 6, 8, 10]})
    types = detect_column_types(df)
    result = compute_correlations(df, types)
    assert len(result['relationships']) > 0
    assert result['relationships'][0]['correlation'] == pytest.approx(1.0)


def test_empty_dataset():
    df = pd.DataFrame()
    with pytest.raises(ValueError):
        profile_dataset(df)


def test_all_missing_column():
    df = pd.DataFrame({'a': [None, None, None]})
    report = detect_missing_values(df)
    assert report['total_missing'] == 3
    assert report['columns'][0]['category'] == 'high_missingness'
