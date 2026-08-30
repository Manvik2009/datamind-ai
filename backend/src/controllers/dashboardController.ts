import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { DashboardOverview, ActivityItem, JobSummary } from '../services/dashboardService.js';

const emptyOverview: DashboardOverview = {
  summary: { datasets: 0, analyses: 0, experiments: 0, completedExperiments: 0, insights: 0, predictions: 0, reports: 0, activeJobs: 0 },
  recentDatasets: [],
  recentExperiments: [],
  recentInsights: [],
  recentActivity: [],
  activeJobs: [],
};

export const getDashboardOverview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse(emptyOverview, req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const overview = await DashboardService.getOverview(userId);
  res.status(200).json(successResponse(overview, req.originalUrl));
});

export const getDashboardActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse([] as ActivityItem[], req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const activity = await DashboardService.getRecentActivity(userId, limit);
  res.status(200).json(successResponse(activity, req.originalUrl));
});

export const getDashboardJobs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(200).json(successResponse([] as JobSummary[], req.originalUrl));
    return;
  }
  const userId = req.user.id;
  const jobs = await DashboardService.getActiveJobs(userId);
  res.status(200).json(successResponse(jobs, req.originalUrl));
});
