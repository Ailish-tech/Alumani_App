import { Request, Response, NextFunction } from 'express';
import * as ml from '../services/mlService';

// 1. Smart Mentor Matching
export async function getSmartMentorMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.smartMentorMatch(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 2. Personalized Feed
export async function getPersonalizedFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.personalizedFeed(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 3. Skill Gap Analysis
export async function getSkillGapAnalysis(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.skillGapAnalysis(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 4. Career Path Predictor
export async function getCareerPathPredict(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.careerPathPredict(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 5. Smart Job Matching
export async function getSmartJobMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.smartJobMatch(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 6. Sentiment Analysis (Admin)
export async function getSentimentAnalysis(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ml.feedSentimentAnalysis();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 7. Similar Profiles
export async function getSimilarProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.findSimilarProfiles(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 8. Trending Topics
export async function getTrendingTopics(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ml.trendingTopics();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 9. Engagement Scores (Admin)
export async function getEngagementScores(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ml.engagementScores();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// 10. Smart Event Recommendations
export async function getSmartEventRecs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.uid;
    const result = await ml.smartEventRecommendations(userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
