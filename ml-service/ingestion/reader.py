import pandas as pd
import os

ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}


def read_dataset(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(path, keep_default_na=True, na_values=['', 'NA', 'N/A', 'null', 'NULL', 'NaN', 'nan'])
    elif ext in ('.xlsx', '.xls'):
        df = pd.read_excel(path, keep_default_na=True, na_values=['', 'NA', 'N/A', 'null', 'NULL', 'NaN', 'nan'])
    else:
        raise ValueError(f'Unsupported extension: {ext}')
    if df.shape[0] == 0 or df.shape[1] == 0:
        raise ValueError('Dataset is empty')
    df.columns = [str(c) for c in df.columns]
    return df
