from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import pandas as pd
import json
import os
import uuid
from datetime import datetime

from ingestion.reader import read_dataset
from statistics.summarizer import detect_column_types
from ml.preprocessing.pipeline import MLConfig, analyze_features, detect_problem_type, preprocess_data
from ml.training.trainer import run_experiment, predict

app = FastAPI(title='DataMind ML Service', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

UPLOAD_DIR = os.environ.get('UPLOAD_DIR', '/tmp/datamind-uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ExperimentRequest(BaseModel):
    dataset_path: str
    target_column: str
    problem_type: Optional[str] = None
    test_size: float = 0.2
    random_seed: int = 42
    selected_features: Optional[List[str]] = None
    selected_models: Optional[List[str]] = None


class PredictionRequest(BaseModel):
    features: Dict[str, any]


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'datamind-ml'}


@app.post('/ml/analyze-target')
async def analyze_target(request: ExperimentRequest):
    try:
        df = read_dataset(request.dataset_path)
        detected_types = detect_column_types(df)

        if request.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f'Target column {request.target_column} not found')

        problem_type, is_certain = detect_problem_type(df, request.target_column, detected_types)
        features = analyze_features(df, request.target_column, detected_types)
        target_info = {
            'column': request.target_column,
            'dtype': detected_types.get(request.target_column, 'unknown'),
            'unique_values': int(df[request.target_column].nunique()),
            'problem_type': problem_type,
            'is_certain': is_certain,
            'features': {
                'numerical': features.numerical_features,
                'categorical': features.categorical_features,
                'boolean': features.boolean_features,
                'datetime': features.datetime_features,
                'text': features.text_features,
                'identifiers': features.identifier_features,
                'excluded': features.excluded_features,
            },
            'total_features': len(features.all_features),
        }

        if problem_type in ('binary_classification', 'multiclass_classification'):
            value_counts = df[request.target_column].value_counts()
            target_info['class_distribution'] = {str(k): int(v) for k, v in value_counts.items()}
            total = len(df)
            target_info['class_balance'] = {
                str(k): f"{(v / total) * 100:.1f}%" for k, v in value_counts.items()
            }
            max_pct = (value_counts.iloc[0] / total) * 100
            target_info['potential_imbalance'] = max_pct > 80

        return target_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/ml/train')
async def train_model(request: ExperimentRequest):
    try:
        df = read_dataset(request.dataset_path)
        detected_types = detect_column_types(df)

        problem_type = request.problem_type or detect_problem_type(df, request.target_column, detected_types)[0]
        if problem_type in ('classification_uncertain', 'regression_uncertain', 'unknown'):
            raise HTTPException(status_code=400, detail=f'Cannot determine problem type. Please specify explicitly.')

        config = MLConfig(
            target_column=request.target_column,
            problem_type=problem_type,
            test_size=request.test_size,
            random_seed=request.random_seed,
            selected_features=request.selected_features,
        )

        data = preprocess_data(df, config, detected_types)
        result = run_experiment(data, request.selected_models)

        response = {
            'experiment_id': str(uuid.uuid4()),
            'problem_type': result.problem_type,
            'primary_metric': result.primary_metric,
            'best_model': {
                'model_type': result.best_model.model_type,
                'model_id': result.best_model.model_id,
                'metrics': result.best_model.metrics,
                'feature_importance': result.best_model.feature_importance,
            },
            'comparison': result.comparison,
            'class_distribution': data.class_distribution,
        }

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/ml/predict')
async def make_prediction(request: PredictionRequest, model_id: str, experiment_id: str):
    raise HTTPException(status_code=501, detail='Prediction endpoint not yet implemented')
