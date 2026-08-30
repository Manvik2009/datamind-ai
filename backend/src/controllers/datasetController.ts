import { Request, Response } from 'express';
import multer from 'multer';
import { DatasetService, AnalysisResult } from '../services/datasetService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateUploadedFile } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
const upload = multer();

export const uploadDataset = [
  upload.single('file'),
  validateUploadedFile,
  asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
      throw new AppError(400, 'NO_FILE', 'No file uploaded');
    }

    logger.info(`Uploading dataset: ${file.originalname}`);

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    const response = await fetch(`${PYTHON_SERVICE_URL}/ingest`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 422) {
        throw new AppError(422, 'INVALID_DATASET', detail);
      }
      if (response.status === 413) {
        throw new AppError(413, 'FILE_TOO_LARGE', detail);
      }
      throw new AppError(502, 'PYTHON_SERVICE_ERROR', 'Data processing service unavailable');
    }

    const analysis = await response.json() as AnalysisResult;
    const record = await DatasetService.saveDataset(file, analysis);

    logger.info(`Dataset uploaded successfully: ${record.id}`);

    const detail = await DatasetService.getDatasetById(record.id);
    res.status(201).json(successResponse(detail, req.originalUrl));
  }),
];

export const getDatasets = asyncHandler(async (_req: Request, res: Response) => {
  const datasets = await DatasetService.getDatasets();
  res.status(200).json(successResponse(datasets, _req.originalUrl));
});

export const getDataset = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const dataset = await DatasetService.getDatasetById(id);

  if (!dataset) {
    throw new AppError(404, 'NOT_FOUND', 'Dataset not found');
  }

  res.status(200).json(successResponse(dataset, req.originalUrl));
});

export const deleteDataset = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const deleted = await DatasetService.deleteDataset(id);

  if (!deleted) {
    throw new AppError(404, 'NOT_FOUND', 'Dataset not found');
  }

  res.status(200).json(successResponse({ id, deleted: true }, req.originalUrl));
});
