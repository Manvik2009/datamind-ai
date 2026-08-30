import { Router } from 'express';
import { uploadDataset, getDatasets, getDataset, deleteDataset } from '../controllers/datasetController.js';

const router = Router();

router.post('/upload', uploadDataset);
router.get('/', getDatasets);
router.get('/:id', getDataset);
router.delete('/:id', deleteDataset);

export default router;
