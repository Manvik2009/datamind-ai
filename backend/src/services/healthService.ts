import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  services?: Record<string, string>;
}

const startTime = Date.now();

export class HealthService {
  static getLiveness(): { status: 'ok'; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'datamind-api',
      timestamp: new Date().toISOString(),
    };
  }

  static async getReadiness(): Promise<HealthStatus> {
    const services: Record<string, string> = {};

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('datasets').select('id').limit(1);
      services.database = error && error.code !== 'PGRST116' ? 'unhealthy' : 'healthy';
    } catch {
      services.database = 'unhealthy';
    }

    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      services.python_worker = response.ok ? 'healthy' : 'unhealthy';
    } catch {
      services.python_worker = 'unhealthy';
    }

    const allHealthy = Object.values(services).every((s) => s === 'healthy');
    const anyHealthy = Object.values(services).some((s) => s === 'healthy');

    return {
      status: allHealthy ? 'ok' : anyHealthy ? 'degraded' : 'down',
      service: 'datamind-api',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      services,
    };
  }

  static async getFullHealth(): Promise<HealthStatus> {
    return this.getReadiness();
  }
}
