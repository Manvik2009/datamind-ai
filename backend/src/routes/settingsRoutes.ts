import { Router } from 'express';
import {
  getSettings,
  updateProfile,
  updateAppearance,
  updateAIPreferences,
  updateNotificationPreferences,
  updatePrivacy,
  getDataSummary,
  getIntegrationStatuses,
  getSecurityInfo,
  exportUserData,
  deleteAccount,
} from '../controllers/settingsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getSettings);
router.patch('/profile', optionalAuth, updateProfile);
router.patch('/appearance', optionalAuth, updateAppearance);
router.patch('/ai-preferences', optionalAuth, updateAIPreferences);
router.patch('/notifications', optionalAuth, updateNotificationPreferences);
router.patch('/privacy', optionalAuth, updatePrivacy);
router.get('/data/summary', optionalAuth, getDataSummary);
router.get('/integrations', optionalAuth, getIntegrationStatuses);
router.get('/security', optionalAuth, getSecurityInfo);
router.post('/data/export', optionalAuth, exportUserData);
router.post('/account/delete', optionalAuth, deleteAccount);

export default router;
