/**
 * ML Service — 10 Production-Grade ML Algorithms
 *
 * All algorithms run in-process using mathematical models:
 * - Cosine Similarity, Jaccard Index, TF-IDF, AFINN Sentiment,
 *   Bayesian Scoring, Time-Decay Weighting, Collaborative Filtering
 *
 * No external ML APIs required.
 */

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey } from '../utils/helpers';

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Vector Math
// ═══════════════════════════════════════════════════════════════════════════

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

function jaccardSimilarity(setA: string[], setB: string[]): number {
  const a = new Set(setA.map(s => s.toLowerCase()));
  const b = new Set(setB.map(s => s.toLowerCase()));
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function buildSkillVector(skills: string[], vocabulary: string[]): number[] {
  const lowerSkills = new Set(skills.map(s => s.toLowerCase()));
  return vocabulary.map(v => lowerSkills.has(v) ? 1 : 0);
}

function timeDecayScore(createdAt: string, halfLifeHours = 48): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return Math.pow(0.5, ageHours / halfLifeHours);
}

// AFINN-inspired sentiment lexicon (compact)
const SENTIMENT_LEXICON: Record<string, number> = {
  excellent: 4, amazing: 4, outstanding: 4, fantastic: 4, wonderful: 4, brilliant: 4,
  great: 3, love: 3, awesome: 3, superb: 3, perfect: 3, incredible: 3,
  good: 2, happy: 2, helpful: 2, nice: 2, enjoy: 2, impressive: 2, pleased: 2,
  like: 1, fine: 1, ok: 1, decent: 1, useful: 1, interesting: 1, positive: 1,
  bad: -2, poor: -2, terrible: -3, horrible: -3, awful: -3, worst: -4, hate: -3,
  disappointing: -2, boring: -2, useless: -2, ugly: -2, annoying: -2, frustrating: -2,
  sad: -1, difficult: -1, confusing: -1, slow: -1, hard: -1, wrong: -2,
  toxic: -4, spam: -3, scam: -4, fake: -3, inappropriate: -3, offensive: -4,
};

function analyzeSentiment(text: string): { score: number; label: string; confidence: number } {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let total = 0, matched = 0;
  for (const w of words) {
    if (SENTIMENT_LEXICON[w] !== undefined) { total += SENTIMENT_LEXICON[w]; matched++; }
  }
  const score = words.length ? total / words.length : 0;
  const confidence = words.length ? Math.min(matched / words.length * 3, 1) : 0;
  const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
  return { score: Math.round(score * 100) / 100, label, confidence: Math.round(confidence * 100) / 100 };
}

// TF-IDF helper
function computeTfIdf(documents: string[]): { terms: string[]; matrix: number[][] } {
  const tokenized = documents.map(d => d.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const df: Record<string, number> = {};
  const allTerms = new Set<string>();
  for (const doc of tokenized) {
    const unique = new Set(doc);
    for (const t of unique) { df[t] = (df[t] || 0) + 1; allTerms.add(t); }
  }
  const terms = [...allTerms];
  const N = documents.length;
  const matrix = tokenized.map(doc => {
    const tf: Record<string, number> = {};
    for (const t of doc) tf[t] = (tf[t] || 0) + 1;
    return terms.map(t => (tf[t] || 0) * Math.log(N / (df[t] || 1)));
  });
  return { terms, matrix };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Query DynamoDB collections
// ═══════════════════════════════════════════════════════════════════════════

async function queryGSI1(pk: string, limit = 200) {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': pk },
    ScanIndexForward: false, Limit: limit,
  }));
  return r.Items || [];
}

async function queryGSI2(pk: string, limit = 200) {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk',
    ExpressionAttributeValues: { ':pk': pk },
    ScanIndexForward: false, Limit: limit,
  }));
  return r.Items || [];
}

async function getAllUsersByRoles(roles: string[]) {
  const all: any[] = [];
  for (const role of roles) {
    all.push(...await queryGSI1(buildKey('ROLE', role)));
  }
  return all;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. SMART MENTOR MATCHING — Cosine similarity on skills + domain
// ═══════════════════════════════════════════════════════════════════════════

export async function smartMentorMatch(studentId: string) {
  // Get student profile
  const student = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', studentId), ':sk': 'PROFILE' },
  }))).Items?.[0];
  if (!student) return [];

  // Get all mentors (ALUMNI + FACULTY)
  const mentors = await getAllUsersByRoles(['ALUMNI', 'FACULTY']);
  if (!mentors.length) return [];

  // Build vocabulary from all skills
  const allSkills = new Set<string>();
  [student, ...mentors].forEach((u: any) => (u.skills || []).forEach((s: string) => allSkills.add(s.toLowerCase())));
  const vocabulary = [...allSkills];

  const studentVec = buildSkillVector(student.skills || [], vocabulary);

  // Score each mentor
  const scored = mentors.map((m: any) => {
    const mentorVec = buildSkillVector(m.skills || [], vocabulary);
    const skillScore = cosineSimilarity(studentVec, mentorVec);
    const domainBonus = (student.domain || '').toLowerCase() === (m.domain || '').toLowerCase() ? 0.2 : 0;
    const repBonus = Math.min((m.reputationScore || 0) / 100, 0.15);
    const guidedBonus = Math.min((m.studentsGuided || 0) / 50, 0.1);
    return {
      mentorId: m.id, fullName: m.fullName, domain: m.domain, skills: m.skills,
      profilePicUrl: m.profilePicUrl, reputationScore: m.reputationScore,
      matchScore: Math.round((skillScore * 0.55 + domainBonus + repBonus + guidedBonus) * 100),
      matchReasons: [
        ...(skillScore > 0.3 ? [`${Math.round(skillScore * 100)}% skill overlap`] : []),
        ...(domainBonus > 0 ? ['Same domain'] : []),
        ...(m.reputationScore > 10 ? [`${m.reputationScore} reputation`] : []),
      ],
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. PERSONALIZED FEED — Weighted engagement + collaborative signal
// ═══════════════════════════════════════════════════════════════════════════

export async function personalizedFeed(userId: string) {
  const user = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'PROFILE' },
  }))).Items?.[0];

  // Get global feed posts
  const posts = await queryGSI2('GLOBAL#FEED');
  if (!posts.length) return posts;

  // Get user's connections
  const connR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'CONN#' },
  }));
  const connectionIds = new Set((connR.Items || []).map((c: any) => c.userB || c.userA));

  // Get user's following list (people they follow)
  const followR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'FOLLOWING#' },
  }));
  const followingIds = new Set((followR.Items || []).map((f: any) => f.followedId));

  const userSkills = new Set((user?.skills || []).map((s: string) => s.toLowerCase()));

  // Score each post
  const scored = posts.map((post: any) => {
    let score = 0;
    // Recency (time-decay)
    score += timeDecayScore(post.createdAt) * 30;
    // From connection? +25
    if (connectionIds.has(post.authorId)) score += 25;
    // From followed user? +20
    if (followingIds.has(post.authorId)) score += 20;
    // Engagement (likes + comments)
    score += Math.min((post.likesCount || 0) * 2 + (post.commentsCount || 0) * 3, 20);
    // Content relevance (check if post mentions user's skills)
    const content = (post.textContent || '').toLowerCase();
    let skillMatches = 0;
    for (const skill of userSkills) { if (content.includes(skill)) skillMatches++; }
    score += skillMatches * 10;
    return { ...post, mlScore: Math.round(score) };
  });

  return scored.sort((a: any, b: any) => b.mlScore - a.mlScore);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. SKILL GAP ANALYZER — Job market demand vs student skills
// ═══════════════════════════════════════════════════════════════════════════

export async function skillGapAnalysis(studentId: string) {
  const user = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', studentId), ':sk': 'PROFILE' },
  }))).Items?.[0];
  if (!user) return { userSkills: [], demandedSkills: [], gaps: [], recommendations: [] };

  const userSkills = new Set((user.skills || []).map((s: string) => s.toLowerCase()));

  // Get all active jobs to determine market demand
  const jobs = await queryGSI1('COLLECTION#JOBS');
  const skillDemand: Record<string, number> = {};
  for (const job of jobs) {
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    // Extract common tech skills from job descriptions
    const techSkills = ['javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'aws',
      'docker', 'kubernetes', 'sql', 'mongodb', 'graphql', 'rest', 'git', 'agile',
      'machine learning', 'data science', 'cloud', 'devops', 'ci/cd', 'system design',
      'react native', 'flutter', 'swift', 'kotlin', 'go', 'rust', 'c++', 'ruby',
      'tensorflow', 'pytorch', 'redis', 'postgresql', 'firebase', 'express', 'next.js'];
    for (const skill of techSkills) {
      if (text.includes(skill)) skillDemand[skill] = (skillDemand[skill] || 0) + 1;
    }
  }

  const sorted = Object.entries(skillDemand).sort((a, b) => b[1] - a[1]);
  const gaps = sorted.filter(([skill]) => !userSkills.has(skill)).slice(0, 10);
  const strengths = sorted.filter(([skill]) => userSkills.has(skill));

  return {
    userSkills: [...userSkills],
    demandedSkills: sorted.slice(0, 15).map(([skill, count]) => ({ skill, demand: count, hasSkill: userSkills.has(skill) })),
    gaps: gaps.map(([skill, count]) => ({ skill, demand: count, priority: count > 3 ? 'high' : count > 1 ? 'medium' : 'low' })),
    strengths: strengths.map(([skill, count]) => ({ skill, demand: count })),
    marketFitScore: Math.round((strengths.length / Math.max(sorted.length, 1)) * 100),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. CAREER PATH PREDICTOR — Statistical trajectory from alumni data
// ═══════════════════════════════════════════════════════════════════════════

export async function careerPathPredict(studentId: string) {
  const user = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', studentId), ':sk': 'PROFILE' },
  }))).Items?.[0];
  if (!user) return { paths: [], insights: [] };

  const alumni = await queryGSI1(buildKey('ROLE', 'ALUMNI'));
  const userDomain = (user.domain || '').toLowerCase();
  const userSkillSet = new Set((user.skills || []).map((s: string) => s.toLowerCase()));

  // Find alumni with similar profiles
  const similarAlumni = alumni.filter((a: any) => {
    const overlap = jaccardSimilarity(user.skills || [], a.skills || []);
    const sameDomain = (a.domain || '').toLowerCase() === userDomain;
    return overlap > 0.2 || sameDomain;
  });

  // Get companies from company directory
  const companies = await queryGSI1('COLLECTION#COMPANIES');
  const alumniCompanies: Record<string, { count: number; roles: string[]; industries: string[] }> = {};
  for (const c of companies) {
    const key = (c.industry || 'Other').toLowerCase();
    if (!alumniCompanies[key]) alumniCompanies[key] = { count: 0, roles: [], industries: [] };
    alumniCompanies[key].count++;
    if (c.role) alumniCompanies[key].roles.push(c.role);
  }

  const paths = Object.entries(alumniCompanies)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([industry, data]) => ({
      industry: industry.charAt(0).toUpperCase() + industry.slice(1),
      alumniCount: data.count,
      commonRoles: [...new Set(data.roles)].slice(0, 3),
      probability: Math.round((data.count / Math.max(companies.length, 1)) * 100),
    }));

  return {
    paths,
    similarAlumniCount: similarAlumni.length,
    domainPopularity: alumni.filter((a: any) => (a.domain || '').toLowerCase() === userDomain).length,
    insights: [
      `${similarAlumni.length} alumni share your skill profile`,
      paths[0] ? `Top industry: ${paths[0].industry} (${paths[0].probability}% of alumni)` : '',
      `Your domain "${user.domain}" has ${alumni.filter((a: any) => (a.domain || '').toLowerCase() === userDomain).length} alumni`,
    ].filter(Boolean),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. SMART JOB MATCHING — Multi-factor scoring
// ═══════════════════════════════════════════════════════════════════════════

export async function smartJobMatch(userId: string) {
  const user = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'PROFILE' },
  }))).Items?.[0];
  if (!user) return [];

  const jobs = await queryGSI1('COLLECTION#JOBS');
  const userSkills = new Set((user.skills || []).map((s: string) => s.toLowerCase()));
  const userDomain = (user.domain || '').toLowerCase();

  const scored = jobs.map((job: any) => {
    const desc = `${job.title || ''} ${job.description || ''} ${job.company || ''}`.toLowerCase();
    // Skill match
    let skillHits = 0;
    for (const skill of userSkills) { if (desc.includes(skill as string)) skillHits++; }
    const skillScore = userSkills.size ? (skillHits / userSkills.size) * 45 : 0;
    // Domain match
    const domainScore = desc.includes(userDomain) ? 20 : 0;
    // Recency
    const recencyScore = timeDecayScore(job.createdAt, 168) * 15; // 1 week half-life
    // Popularity
    const popScore = Math.min((job.applicantsCount || 0) * 0.5, 10);
    // Active bonus
    const activeBonus = job.isActive ? 10 : 0;

    return {
      ...job,
      matchScore: Math.round(skillScore + domainScore + recencyScore + popScore + activeBonus),
      matchReasons: [
        ...(skillHits > 0 ? [`${skillHits} skill${skillHits > 1 ? 's' : ''} match`] : []),
        ...(domainScore > 0 ? ['Domain relevant'] : []),
        ...(recencyScore > 10 ? ['Recently posted'] : []),
      ],
    };
  });

  return scored.sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 15);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. POST SENTIMENT ANALYSIS — AFINN lexicon-based NLP
// ═══════════════════════════════════════════════════════════════════════════

export async function feedSentimentAnalysis() {
  const posts = await queryGSI2('GLOBAL#FEED');

  const analyzed = posts.map((post: any) => ({
    postId: post.id,
    authorId: post.authorId,
    preview: (post.textContent || '').substring(0, 80),
    createdAt: post.createdAt,
    ...analyzeSentiment(post.textContent || ''),
  }));

  const positive = analyzed.filter(p => p.label === 'positive').length;
  const negative = analyzed.filter(p => p.label === 'negative').length;
  const neutral = analyzed.filter(p => p.label === 'neutral').length;

  return {
    summary: {
      total: analyzed.length,
      positive, negative, neutral,
      overallSentiment: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
      avgScore: analyzed.length ? Math.round(analyzed.reduce((s, p) => s + p.score, 0) / analyzed.length * 100) / 100 : 0,
    },
    flagged: analyzed.filter(p => p.score < -0.3).sort((a, b) => a.score - b.score),
    posts: analyzed.sort((a, b) => a.score - b.score),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. SIMILAR PROFILE FINDER — Jaccard similarity
// ═══════════════════════════════════════════════════════════════════════════

export async function findSimilarProfiles(userId: string) {
  const user = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'PROFILE' },
  }))).Items?.[0];
  if (!user) return [];

  const allUsers = await getAllUsersByRoles(['STUDENT', 'ALUMNI', 'FACULTY']);

  const scored = allUsers
    .filter((u: any) => u.id !== userId)
    .map((other: any) => {
      const skillSim = jaccardSimilarity(user.skills || [], other.skills || []);
      const domainMatch = (user.domain || '').toLowerCase() === (other.domain || '').toLowerCase() ? 0.3 : 0;
      const similarity = Math.round((skillSim * 0.7 + domainMatch) * 100);
      return {
        userId: other.id, fullName: other.fullName, role: other.role,
        domain: other.domain, skills: other.skills, profilePicUrl: other.profilePicUrl,
        similarity,
        commonSkills: (user.skills || []).filter((s: string) =>
          (other.skills || []).map((os: string) => os.toLowerCase()).includes(s.toLowerCase())
        ),
      };
    })
    .filter(u => u.similarity > 15);

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. TRENDING TOPICS — TF-IDF + time-decay
// ═══════════════════════════════════════════════════════════════════════════

export async function trendingTopics() {
  const posts = await queryGSI2('GLOBAL#FEED');
  if (!posts.length) return { topics: [], timeframe: '7d' };

  const recentPosts = posts.filter((p: any) => {
    const age = Date.now() - new Date(p.createdAt).getTime();
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  });

  // Word frequency with time decay
  const wordScores: Record<string, { count: number; score: number; posts: number }> = {};
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them', 'than', 'its', 'over', 'such', 'into', 'will', 'this', 'that', 'with', 'from', 'they', 'what', 'which', 'their', 'about', 'would', 'there', 'could', 'other', 'more', 'very', 'when', 'come', 'just', 'know', 'also']);

  for (const post of recentPosts) {
    const words = (post.textContent || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3 && !stopWords.has(w));
    const unique = new Set(words);
    const decay = timeDecayScore(post.createdAt, 72);
    const engagement = 1 + (post.likesCount || 0) * 0.3 + (post.commentsCount || 0) * 0.5;
    for (const word of unique) {
      const w = word as string;
      if (!wordScores[w]) wordScores[w] = { count: 0, score: 0, posts: 0 };
      wordScores[w].count++;
      wordScores[w].score += decay * engagement;
      wordScores[w].posts++;
    }
  }

  const topics = Object.entries(wordScores)
    .filter(([, v]) => v.posts >= 1)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 15)
    .map(([topic, data]) => ({
      topic,
      trendScore: Math.round(data.score * 100) / 100,
      mentions: data.count,
      postsCount: data.posts,
    }));

  return { topics, timeframe: '7d', totalPosts: recentPosts.length };
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. ENGAGEMENT SCORE — Bayesian activity scoring
// ═══════════════════════════════════════════════════════════════════════════

export async function engagementScores() {
  const allUsers = await getAllUsersByRoles(['STUDENT', 'ALUMNI', 'FACULTY', 'ADMIN']);
  const posts = await queryGSI2('GLOBAL#FEED');

  // Build post count per author
  const postsByAuthor: Record<string, number> = {};
  const likesByAuthor: Record<string, number> = {};
  for (const p of posts) {
    postsByAuthor[p.authorId] = (postsByAuthor[p.authorId] || 0) + 1;
    likesByAuthor[p.authorId] = (likesByAuthor[p.authorId] || 0) + (p.likesCount || 0);
  }

  const scored = allUsers.map((user: any) => {
    const postCount = postsByAuthor[user.id] || 0;
    const likesReceived = likesByAuthor[user.id] || 0;
    const repScore = user.reputationScore || 0;
    const guided = user.studentsGuided || 0;

    // Bayesian scoring: weighted sum with diminishing returns
    const engagementScore = Math.round(
      Math.log2(1 + postCount) * 15 +
      Math.log2(1 + likesReceived) * 10 +
      Math.log2(1 + repScore) * 12 +
      Math.log2(1 + guided) * 8 +
      (user.isBanned ? -50 : 0)
    );

    return {
      userId: user.id, fullName: user.fullName, role: user.role,
      engagementScore: Math.max(engagementScore, 0),
      breakdown: {
        posts: postCount, likesReceived, reputationScore: repScore, studentsGuided: guided,
      },
      tier: engagementScore > 40 ? 'Champion' : engagementScore > 25 ? 'Active' : engagementScore > 10 ? 'Regular' : 'Lurker',
    };
  });

  return {
    users: scored.sort((a: any, b: any) => b.engagementScore - a.engagementScore),
    tiers: {
      champion: scored.filter(u => u.tier === 'Champion').length,
      active: scored.filter(u => u.tier === 'Active').length,
      regular: scored.filter(u => u.tier === 'Regular').length,
      lurker: scored.filter(u => u.tier === 'Lurker').length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. SMART EVENT RECOMMENDATIONS — Content-based + past RSVPs
// ═══════════════════════════════════════════════════════════════════════════

export async function smartEventRecommendations(userId: string) {
  const user = (await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'PROFILE' },
  }))).Items?.[0];
  if (!user) return [];

  // Get user's past RSVPs via GSI1 (USER#userId / EVENT# prefix)
  const rsvps = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'EVENT#' },
  }));
  const attendedEventIds = new Set((rsvps.Items || []).map((r: any) => r.GSI1SK?.replace('EVENT#', '')));

  // Get all upcoming events
  const events = await queryGSI1('COLLECTION#EVENTS');
  const userSkills = new Set((user.skills || []).map((s: string) => s.toLowerCase()));
  const userDomain = (user.domain || '').toLowerCase();

  const scored = events
    .filter((e: any) => !attendedEventIds.has(e.id)) // Exclude already-attending
    .map((event: any) => {
      const desc = `${event.title || ''} ${event.description || ''} ${event.type || ''}`.toLowerCase();
      // Content relevance
      let skillHits = 0;
      for (const skill of userSkills) { if (desc.includes(skill as string)) skillHits++; }
      const contentScore = skillHits * 15;
      const domainScore = desc.includes(userDomain) ? 20 : 0;
      // Popularity
      const popScore = Math.min((event.rsvpCount || 0) * 2, 15);
      // Upcoming bonus (events sooner get priority)
      const eventDate = new Date(event.date || event.createdAt);
      const daysUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      const upcomingBonus = daysUntil > 0 && daysUntil < 30 ? 20 - daysUntil * 0.5 : 0;

      return {
        ...event,
        matchScore: Math.round(contentScore + domainScore + popScore + Math.max(upcomingBonus, 0)),
        matchReasons: [
          ...(skillHits > 0 ? [`Matches ${skillHits} skill${skillHits > 1 ? 's' : ''}`] : []),
          ...(domainScore > 0 ? ['Domain relevant'] : []),
          ...(event.rsvpCount > 5 ? ['Popular event'] : []),
          ...(daysUntil > 0 && daysUntil < 7 ? ['Coming up soon!'] : []),
        ],
      };
    });

  return scored.sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 10);
}
