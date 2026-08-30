import { Router } from 'express';
import {
  getDatasetSummary,
  getDataQualityExplanation,
  getMLExplanation,
  getInsights,
  queryData,
  explainDecision,
  analyzeDecision,
  generateRecommendations,
  generateDecisionReport,
} from './ai.controller.js';

const router = Router();

router.post('/datasets/:id/summary', getDatasetSummary);
router.post('/datasets/:id/data-quality', getDataQualityExplanation);
router.post('/experiments/:id/explain', getMLExplanation);
router.post('/experiments/:id/insights', getInsights);
router.post('/query', queryData);
router.post('/decisions/explain', explainDecision);
router.post('/decisions/analyze', analyzeDecision);
router.post('/decisions/recommendations', generateRecommendations);
router.post('/decisions/report', generateDecisionReport);

export default router;
