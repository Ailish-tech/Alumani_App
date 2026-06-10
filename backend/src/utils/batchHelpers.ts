import { BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey } from './helpers';
import { UserEntity } from '../types/entities';

/**
 * Wraps DynamoDB BatchGetCommand to fetch up to 100 items at a time.
 * Automatically chunks the requests and handles UnprocessedKeys.
 */
export async function batchGetItems(keys: Record<string, string>[]): Promise<any[]> {
  if (!keys || keys.length === 0) return [];

  const BATCH_SIZE = 100;
  let allItems: any[] = [];
  
  // Deduplicate keys
  const uniqueKeysMap = new Map();
  for (const key of keys) {
    uniqueKeysMap.set(`${key.PK}_${key.SK}`, key);
  }
  const uniqueKeys = Array.from(uniqueKeysMap.values());

  for (let i = 0; i < uniqueKeys.length; i += BATCH_SIZE) {
    const chunk = uniqueKeys.slice(i, i + BATCH_SIZE);
    let unprocessedKeys = chunk;

    while (unprocessedKeys.length > 0) {
      const result = await dynamoDb.send(new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: unprocessedKeys,
          },
        },
      }));

      if (result.Responses && result.Responses[TABLE_NAME]) {
        allItems = allItems.concat(result.Responses[TABLE_NAME]);
      }

      if (result.UnprocessedKeys && result.UnprocessedKeys[TABLE_NAME] && result.UnprocessedKeys[TABLE_NAME].Keys) {
        unprocessedKeys = result.UnprocessedKeys[TABLE_NAME].Keys as Record<string, string>[];
      } else {
        unprocessedKeys = [];
      }
    }
  }

  return allItems;
}

/**
 * Fetches multiple users by their IDs in a single batch request.
 * Returns a Map<userId, UserEntity> for O(1) lookups.
 */
export async function batchGetUsers(userIds: string[]): Promise<Map<string, UserEntity>> {
  if (!userIds || userIds.length === 0) return new Map();

  const validIds = userIds.filter((id) => id && typeof id === 'string');
  const uniqueIds = Array.from(new Set(validIds));
  const keys = uniqueIds.map((id) => ({ PK: buildKey('USER', id), SK: 'PROFILE' }));
  
  const users = await batchGetItems(keys);
  
  const userMap = new Map<string, UserEntity>();
  for (const user of users) {
    userMap.set(user.id, user as UserEntity);
  }

  return userMap;
}
