import { Router } from 'express';
import { createExperiment, getExperiments, getExperiment, deleteExperiment, trainExperiment, predictExperiment } from '../controllers/mlController.js';

const router = Router();

router.post('/', createExperiment);
router.get('/', getExperiments);
router.get('/:id', getExperiment);
router.delete('/:id', deleteExperiment);
router.post('/:id/train', trainExperiment);
router.post('/:id/predict', predictExperiment);

export default router;
