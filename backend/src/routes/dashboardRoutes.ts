import { Router } from 'express';
import { getDashboardOverview, getDashboardActivity, getDashboardJobs } from '../controllers/dashboardController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

router.get('/overview', getDashboardOverview);
router.get('/activity', getDashboardActivity);
router.get('/jobs', getDashboardJobs);

export default router;
