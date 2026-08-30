from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import pandas as pd
import os
import uuid
import time

from ingestion.reader import read_dataset
from profiling.profiler import profile_dataset, calculate_quality_score
from detection.detectors import detect_missing_values, detect_duplicates
from statistics.summarizer import compute_statistics, detect_column_types
from statistics.correlations import detect_outliers, compute_correlations
from ml.trainer import train_model, run_prediction, TrainingError

app = FastAPI(title='DataMind ML Service', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

UPLOAD_DIR = os.environ.get('UPLOAD_DIR', '/tmp/datamind-uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)


class TrainRequest(BaseModel):
    dataset_path: str
    target_column: str
    problem_type: Optional[str] = None
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    random_seed: int = 42
    selected_features: Optional[List[str]] = None
    model_types: Optional[List[str]] = None


class PredictRequest(BaseModel):
    model_id: str
    features: Dict[str, Any]


class BatchPredictRequest(BaseModel):
    model_id: str
    records: List[Dict[str, Any]]


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'datamind-ml'}


@app.post('/ingest')
async def ingest_file(file: UploadFile = File(...)):
    filename = file.filename or 'unknown'
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ('.csv', '.xlsx', '.xls'):
        raise HTTPException(status_code=422, detail='Unsupported file type')

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f'{file_id}{ext}')

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=422, detail='Empty file')
    if len(content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail='File too large')

    with open(save_path, 'wb') as f:
        f.write(content)

    try:
        df = read_dataset(save_path)
    except Exception as e:
        os.remove(save_path)
        raise HTTPException(status_code=422, detail=f'Invalid dataset: {str(e)}') from e

    detected_types = detect_column_types(df)
    profile = profile_dataset(df)
    quality = calculate_quality_score(profile)
    profile['quality_score'] = quality['score']
    profile['quality_breakdown'] = quality['breakdown']

    missing_report = detect_missing_values(df)
    duplicates_report = detect_duplicates(df)
    stats = compute_statistics(df, detected_types)
    outliers = detect_outliers(df, detected_types)
    correlations = compute_correlations(df, detected_types)

    result = {
        'file_id': file_id,
        'filename': filename,
        'rows': int(df.shape[0]),
        'columns': int(df.shape[1]),
        'detected_types': detected_types,
        'profile': profile,
        'missing_values': missing_report,
        'duplicates': duplicates_report,
        'statistics': stats,
        'outliers': outliers,
        'correlations': correlations,
    }
    return result


@app.post('/ml/train')
async def train_ml_model(request: TrainRequest):
    start_time = time.time()
    try:
        result = train_model(
            dataset_path=request.dataset_path,
            target_column=request.target_column,
            problem_type=request.problem_type,
            test_size=request.test_size,
            random_seed=request.random_seed,
            selected_features=request.selected_features,
            model_types=request.model_types,
        )
        result['training_duration_ms'] = round((time.time() - start_time) * 1000, 2)
        return result
    except TrainingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Training failed: {str(e)}')


@app.post('/predict')
async def predict(request: PredictRequest):
    try:
        result = run_prediction(
            model_id=request.model_id,
            features=request.features,
        )
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Prediction failed: {str(e)}')


@app.post('/batch-predict')
async def batch_predict(request: BatchPredictRequest):
    if len(request.records) > 10000:
        raise HTTPException(status_code=400, detail='Batch size exceeds maximum of 10000 records')

    results = []
    errors = []

    for idx, record in enumerate(request.records):
        try:
            result = run_prediction(
                model_id=request.model_id,
                features=record,
            )
            results.append({
                'index': idx,
                'status': 'success',
                'result': result,
            })
        except Exception as e:
            errors.append({
                'index': idx,
                'status': 'error',
                'error': str(e),
            })

    return {
        'total': len(request.records),
        'successful': len(results),
        'failed': len(errors),
        'predictions': results,
        'errors': errors,
    }
