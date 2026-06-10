import { PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';
import { typesenseClient } from '../config/typesense';
import { syncJob, removeJob } from './typesenseSync';

// ─── Job Service ────────────────────────────────────────────────────────────────
// GSI1: COLLECTION#JOBS / DATE#<createdAt>  — list all jobs

export async function createJob(params: {
  title: string; company: string; type: string; description: string;
  location?: string; applyUrl?: string; salary?: string; postedBy: string;
}) {
  const id = generateId();
  const now = isoNow();
  const item = {
    PK: buildKey('JOB', id), SK: 'META',
    GSI1PK: 'COLLECTION#JOBS', GSI1SK: buildKey('DATE', now),
    entityType: 'JOB',
    id, ...params,
    type: params.type || 'job',
    location: params.location || 'Remote',
    applyUrl: params.applyUrl || '',
    salary: params.salary || '',
    applicantsCount: 0, isActive: true, createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  await syncJob(item);
  return item;
}

export async function getAllJobs(typeFilter?: string) {
  try {
    const searchResult = await typesenseClient
      .collections('jobs')
      .documents()
      .search({
        q: '*',
        filter_by: typeFilter ? `type:=${typeFilter}` : '',
        per_page: 250, // Reasonable max for now
        sort_by: 'createdAt:desc',
      });
    return searchResult.hits?.map((hit) => hit.document) || [];
  } catch (error) {
    console.error('Typesense jobs search error:', error);
    return [];
  }
}

export async function getJobById(jobId: string) {
  const result = await dynamoDb.send(new GetCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('JOB', jobId), SK: 'META' },
  }));
  return result.Item || null;
}

export async function applyToJob(jobId: string, userId: string, coverNote?: string) {
  const item = {
    PK: buildKey('JOB', jobId), SK: `APP#${userId}`,
    entityType: 'JOB_APPLICATION', userId, coverNote: coverNote || '', appliedAt: isoNow(),
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('JOB', jobId), SK: 'META' },
    UpdateExpression: 'ADD applicantsCount :inc',
    ExpressionAttributeValues: { ':inc': 1 },
  }));
  return item;
}

export async function getJobApplicants(jobId: string) {
  const result = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': buildKey('JOB', jobId), ':sk': 'APP#' },
  }));
  return result.Items || [];
}

export async function deleteJob(jobId: string) {
  await dynamoDb.send(new DeleteCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('JOB', jobId), SK: 'META' },
  }));
  await removeJob(jobId);
}
