import { GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { UserEntity } from '../types/entities';
import { Role } from '../types/enums';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';

/**
 * Create a new user profile in DynamoDB.
 *
 * GSI1: ROLE#<role> / SCORE#<reputationScore>  — lookup by role, sorted by score
 */
export async function createUser(params: {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  domain?: string;
  skills?: string[];
  profilePicUrl?: string;
  bio?: string;
  workplace?: string;
}): Promise<UserEntity> {
  const now = isoNow();
  const user: UserEntity = {
    PK: buildKey('USER', params.id),
    SK: 'PROFILE',
    GSI1PK: buildKey('ROLE', params.role),
    GSI1SK: buildKey('SCORE', String(0)),
    entityType: 'USER',
    id: params.id,
    email: params.email,
    role: params.role,
    fullName: params.fullName,
    profilePicUrl: params.profilePicUrl || '',
    skills: params.skills || [],
    domain: params.domain || '',
    bio: params.bio || '',
    workplace: params.workplace || '',
    reputationScore: 0,
    studentsGuided: 0,
    isBanned: false,
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
    })
  );

  return user;
}

/**
 * Get a user profile by ID.
 */
export async function getUserById(userId: string): Promise<UserEntity> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', userId),
        SK: 'PROFILE',
      },
    })
  );

  if (!result.Item) {
    throw new NotFoundError('User', userId);
  }

  return result.Item as UserEntity;
}

/**
 * Search mentors (ALUMNI/FACULTY) by domain, sorted by reputationScore.
 * Uses GSI1: GSI1PK = ROLE#ALUMNI, GSI1SK = SCORE#<score> (sorted descending)
 */
export async function searchMentors(
  domain?: string,
  limit = 20
): Promise<UserEntity[]> {
  const results: UserEntity[] = [];

  for (const role of [Role.ALUMNI, Role.FACULTY]) {
    const queryResult = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :rolePk',
        FilterExpression: domain ? 'contains(#domain, :domain)' : undefined,
        ExpressionAttributeValues: {
          ':rolePk': buildKey('ROLE', role),
          ...(domain && { ':domain': domain }),
        },
        ExpressionAttributeNames: domain ? { '#domain': 'domain' } : undefined,
        ScanIndexForward: false, // highest score first
      })
    );

    if (queryResult.Items) {
      results.push(...(queryResult.Items as UserEntity[]));
    }
  }

  // Sort by reputationScore DESC, then studentsGuided DESC
  results.sort((a, b) => {
    if (b.reputationScore !== a.reputationScore) {
      return b.reputationScore - a.reputationScore;
    }
    return b.studentsGuided - a.studentsGuided;
  });

  return results.slice(0, limit);
}

/**
 * Update editable profile fields: fullName, profilePicUrl, skills, domain.
 */
export async function updateProfile(
  userId: string,
  updates: {
    fullName?: string;
    profilePicUrl?: string;
    skills?: string[];
    domain?: string;
    bio?: string;
    workplace?: string;
  }
): Promise<UserEntity> {
  const now = isoNow();

  const setClauses: string[] = ['updatedAt = :now'];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = { ':now': now };

  if (updates.fullName !== undefined) {
    setClauses.push('fullName = :fullName');
    expressionValues[':fullName'] = updates.fullName;
  }
  if (updates.profilePicUrl !== undefined) {
    setClauses.push('profilePicUrl = :profilePicUrl');
    expressionValues[':profilePicUrl'] = updates.profilePicUrl;
  }
  if (updates.skills !== undefined) {
    setClauses.push('skills = :skills');
    expressionValues[':skills'] = updates.skills;
  }
  if (updates.domain !== undefined) {
    setClauses.push('#domain = :domain');
    expressionNames['#domain'] = 'domain';
    expressionValues[':domain'] = updates.domain;
  }
  if (updates.bio !== undefined) {
    setClauses.push('bio = :bio');
    expressionValues[':bio'] = updates.bio;
  }
  if (updates.workplace !== undefined) {
    setClauses.push('workplace = :workplace');
    expressionValues[':workplace'] = updates.workplace;
  }

  const updateParams: any = {
    TableName: TABLE_NAME,
    Key: {
      PK: buildKey('USER', userId),
      SK: 'PROFILE',
    },
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ConditionExpression: 'attribute_exists(PK)',
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  if (Object.keys(expressionNames).length > 0) {
    updateParams.ExpressionAttributeNames = expressionNames;
  }

  try {
    const result = await dynamoDb.send(new UpdateCommand(updateParams));
    return (result.Attributes as UserEntity) || (await getUserById(userId));
  } catch (err: any) {
    console.error('[updateProfile] DynamoDB error for user', userId, ':', err.message);
    // If condition check failed, user doesn't exist
    if (err.name === 'ConditionalCheckFailedException') {
      throw new NotFoundError('User', userId);
    }
    throw err;
  }
}

/**
 * Increment mentor's studentsGuided and reputationScore by 1.
 * Also updates GSI1SK to keep SCORE# sort key consistent.
 */
export async function incrementMentorStats(mentorId: string): Promise<void> {
  // First get current score to compute new GSI1SK
  const user = await getUserById(mentorId);
  const newScore = user.reputationScore + 1;

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', mentorId),
        SK: 'PROFILE',
      },
      UpdateExpression:
        'SET studentsGuided = studentsGuided + :inc, reputationScore = reputationScore + :inc, updatedAt = :now, GSI1SK = :gsi1sk',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': isoNow(),
        ':gsi1sk': buildKey('SCORE', String(newScore)),
      },
    })
  );
}

/**
 * Ban or unban a user.
 */
export async function setUserBanStatus(userId: string, isBanned: boolean): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', userId),
        SK: 'PROFILE',
      },
      UpdateExpression: 'SET isBanned = :banned, updatedAt = :now',
      ExpressionAttributeValues: {
        ':banned': isBanned,
        ':now': isoNow(),
      },
    })
  );
}

/**
 * Search users by name, ID, domain, or skills.
 * Like Instagram — searches fullName and userId with case-insensitive contains.
 */
export async function searchUsers(params: {
  query?: string;
  role?: string;
  limit?: number;
}): Promise<UserEntity[]> {
  const { query, role, limit = 30 } = params;

  // Build filter: always start with entityType = USER
  const filterParts: string[] = ['entityType = :entityType', 'SK = :sk'];
  const exprValues: Record<string, unknown> = {
    ':entityType': 'USER',
    ':sk': 'PROFILE',
  };
  const exprNames: Record<string, string> = {};

  // Role filter
  if (role) {
    filterParts.push('#role = :role');
    exprValues[':role'] = role;
    exprNames['#role'] = 'role';
  }

  const result = await dynamoDb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterParts.join(' AND '),
      ExpressionAttributeValues: exprValues,
      ...(Object.keys(exprNames).length > 0 && {
        ExpressionAttributeNames: exprNames,
      }),
      Limit: 200, // scan limit (pre-filter)
    })
  );

  let users = (result.Items || []) as UserEntity[];

  // Client-side search by query (case-insensitive contains on name, id, domain, skills)
  if (query) {
    const q = query.toLowerCase();
    users = users.filter((u) => {
      const searchable = [
        u.fullName || '',
        u.id || '',
        u.domain || '',
        u.email || '',
        ...(u.skills || []),
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }

  // Exclude banned users and limit results
  return users
    .filter((u) => !u.isBanned)
    .slice(0, limit);
}

