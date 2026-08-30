import fs from 'fs';
import path from 'path';
import { getSupabase } from '../config/supabase.js';
import { DatasetRecord, DatasetDetail } from '../types/dataset.js';
import { logger } from '../utils/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch {
  const tmpDir = path.join('/tmp', 'uploads');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

export interface AnalysisResult {
  rows: number;
  columns: number;
  profile: {
    rows: number;
    columns: number;
    memory_bytes: number;
    duplicate_rows: number;
    duplicate_percentage: number;
    missing_values: number;
    missing_percentage: number;
    columns_detail: Array<{
      column: string;
      dtype: string;
      detected_type: string;
      missing: number;
      missing_percentage: number;
      unique_values: number;
      sample_values: unknown[];
    }>;
    quality_score: number;
    quality_breakdown: {
      missing_values: number;
      duplicates: number;
      data_types: number;
      overall: number;
    };
  };
  missing_values: {
    total_missing: number;
    total_percentage: number;
    columns: Array<{
      column: string;
      missing_count: number;
      missing_percentage: number;
      category: string;
    }>;
  };
  duplicates: {
    duplicate_rows: number;
    duplicate_percentage: number;
    has_duplicates: boolean;
  };
  statistics: Record<string, {
    type: string;
    count: number;
    mean?: number | null;
    median?: number | null;
    std?: number | null;
    min?: number | null;
    max?: number | null;
    q1?: number | null;
    q3?: number | null;
    unique_count?: number;
    most_frequent?: string | null;
    most_frequent_count?: number;
  }>;
  outliers: Record<string, {
    outlier_count: number;
    outlier_percentage: number;
    lower_bound: number | null;
    upper_bound: number | null;
    method: string;
    note?: string;
  }>;
  correlations: {
    matrix: Record<string, Record<string, number>>;
    relationships: Array<{
      column_a: string;
      column_b: string;
      correlation: number;
      relationship: string;
    }>;
  };
}

export class DatasetService {
  static generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static async saveDataset(file: Express.Multer.File, analysis: AnalysisResult): Promise<DatasetRecord> {
    const id = this.generateId();
    const ext = path.extname(file.originalname);
    const safeName = `${id}${ext}`;
    const savePath = path.join(UPLOAD_DIR, safeName);

    const { error: writeError } = await getSupabase()
      .from('datasets')
      .insert({
        id,
        filename: safeName,
        original_filename: file.originalname,
        file_path: savePath,
        file_size: file.buffer.length,
        mime_type: file.mimetype,
        row_count: analysis.rows,
        column_count: analysis.columns,
        status: 'ready',
        storage_reference: `local:${safeName}`,
      });

    if (writeError) {
      logger.error('Failed to save dataset metadata to Supabase', { error: writeError });
      throw new Error(`Database error: ${writeError.message}`);
    }

    const { error: analysisError } = await getSupabase()
      .from('analysis_results')
      .insert({
        dataset_id: id,
        analysis_type: 'full_profile',
        result: {
          profile: analysis.profile,
          missing_values: analysis.missing_values,
          duplicates: analysis.duplicates,
          statistics: analysis.statistics,
          outliers: analysis.outliers,
          correlations: analysis.correlations,
        },
      });

    if (analysisError) {
      logger.error('Failed to save analysis results to Supabase', { error: analysisError });
      await getSupabase().from('datasets').delete().eq('id', id);
      throw new Error(`Database error: ${analysisError.message}`);
    }

    fs.writeFileSync(savePath, file.buffer);

    const record: DatasetRecord = {
      id,
      filename: safeName,
      original_filename: file.originalname,
      row_count: analysis.rows,
      column_count: analysis.columns,
      status: 'ready',
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return record;
  }

  static async getDatasets(): Promise<DatasetRecord[]> {
    const { data, error } = await getSupabase()
      .from('datasets')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch datasets from Supabase', { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      filename: row.filename,
      original_filename: row.original_filename,
      row_count: row.row_count,
      column_count: row.column_count,
      status: row.status,
      uploaded_at: row.uploaded_at,
      updated_at: row.updated_at,
    }));
  }

  static async getDatasetById(id: string): Promise<DatasetDetail | null> {
    const { data: dataset, error: datasetError } = await getSupabase()
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single();

    if (datasetError) {
      if (datasetError.code === 'PGRST116') {
        return null;
      }
      logger.error('Failed to fetch dataset from Supabase', { error: datasetError });
      throw new Error(`Database error: ${datasetError.message}`);
    }

    const { data: analysisData, error: analysisError } = await getSupabase()
      .from('analysis_results')
      .select('*')
      .eq('dataset_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      logger.error('Failed to fetch analysis results from Supabase', { error: analysisError });
    }

    const detail: DatasetDetail = {
      id: dataset.id,
      filename: dataset.filename,
      original_filename: dataset.original_filename,
      row_count: dataset.row_count,
      column_count: dataset.column_count,
      status: dataset.status,
      uploaded_at: dataset.uploaded_at,
      updated_at: dataset.updated_at,
      file_size: dataset.file_size,
      mime_type: dataset.mime_type,
      storage_reference: dataset.storage_reference,
    };

    if (analysisData && analysisData.result) {
      const result = analysisData.result as Record<string, unknown>;
      detail.profile = result.profile as DatasetDetail['profile'];
      detail.missing_values = result.missing_values as DatasetDetail['missing_values'];
      detail.duplicates = result.duplicates as DatasetDetail['duplicates'];
      detail.statistics = result.statistics as DatasetDetail['statistics'];
      detail.outliers = result.outliers as DatasetDetail['outliers'];
      detail.correlations = result.correlations as DatasetDetail['correlations'];
    }

    return detail;
  }

  static async deleteDataset(id: string): Promise<boolean> {
    const { data: dataset, error: fetchError } = await getSupabase()
      .from('datasets')
      .select('id, file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return false;
      }
      logger.error('Failed to fetch dataset for deletion', { error: fetchError });
      throw new Error(`Database error: ${fetchError.message}`);
    }

    const { error: deleteError } = await getSupabase()
      .from('datasets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Failed to delete dataset from Supabase', { error: deleteError });
      throw new Error(`Database error: ${deleteError.message}`);
    }

    if (dataset?.file_path) {
      try {
        if (fs.existsSync(dataset.file_path)) {
          fs.unlinkSync(dataset.file_path);
        }
      } catch (fsError) {
        logger.warn('Failed to delete dataset file from filesystem', { path: dataset.file_path, error: fsError });
      }
    }

    return true;
  }

  static cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn('Failed to cleanup file', { path: filePath, error });
    }
  }
}
