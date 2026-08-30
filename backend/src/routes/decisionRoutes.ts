import { Router } from 'express';
import {
  createPrediction,
  getPredictions,
  createBatchPrediction,
  createScenario,
  getScenarios,
  compareScenarios,
  runSensitivityAnalysis,
  getDecisionFactors,
  createRecommendation,
  getRecommendations,
  createReport,
  getReports,
  getHistory,
  getJobStatus,
  cancelJob,
  getJobs,
  explainPrediction,
  analyzeDecision,
} from '../controllers/decisionController.js';

const router = Router();

router.post('/predict', createPrediction);
router.post('/batch-predict', createBatchPrediction);
router.get('/predict', getPredictions);
router.get('/jobs', getJobs);
router.get('/jobs/:job_id', getJobStatus);
router.post('/jobs/:job_id/cancel', cancelJob);
router.post('/scenarios', createScenario);
router.get('/scenarios', getScenarios);
router.post('/scenarios/compare', compareScenarios);
router.post('/sensitivity', runSensitivityAnalysis);
router.get('/factors/:experiment_id', getDecisionFactors);
router.post('/recommendations', createRecommendation);
router.get('/recommendations', getRecommendations);
router.post('/reports', createReport);
router.get('/reports', getReports);
router.get('/history', getHistory);
router.get('/predictions/:prediction_id/explain', explainPrediction);
router.post('/analyze', analyzeDecision);

export default router;
