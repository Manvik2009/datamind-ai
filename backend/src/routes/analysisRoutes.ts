import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  duplicateSession,
  getDatasetOverview,
  exploreColumn,
  getDescriptiveStatistics,
  getDistributionAnalysis,
  getCorrelation,
  getCorrelationMatrix,
  analyzeOutliers,
  analyzeMissingData,
  groupByAnalysis,
  timeSeriesAnalysis,
  generateChart,
  runStatisticalTest,
  exportAnalysis,
} from '../controllers/analysisController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/history', getSessions);
router.get('/:id', getSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);
router.post('/:id/duplicate', duplicateSession);

router.get('/dataset/:datasetId/overview', getDatasetOverview);
router.get('/dataset/:datasetId/columns/:columnName', exploreColumn);
router.get('/dataset/:datasetId/statistics', getDescriptiveStatistics);
router.get('/dataset/:datasetId/distribution', getDistributionAnalysis);
router.get('/dataset/:datasetId/correlation', getCorrelation);
router.get('/dataset/:datasetId/correlation-matrix', getCorrelationMatrix);
router.get('/dataset/:datasetId/outliers', analyzeOutliers);
router.get('/dataset/:datasetId/missing-data', analyzeMissingData);

router.post('/dataset/:datasetId/group-by', groupByAnalysis);
router.post('/dataset/:datasetId/time-series', timeSeriesAnalysis);
router.post('/dataset/:datasetId/chart', generateChart);
router.post('/dataset/:datasetId/statistical-test', runStatisticalTest);

router.get('/:id/export', exportAnalysis);

export default router;
