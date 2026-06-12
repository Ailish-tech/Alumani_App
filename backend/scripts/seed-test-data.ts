import { dynamoDb } from '../src/config/db';
import { PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME, buildKey, isoNow, generateId } from '../src/utils/helpers';
import { Role, ConnectionStatus } from '../src/types/enums';
import { syncUser } from '../src/services/typesenseSync';

const NUM_USERS = 100;
const POSTS_PER_USER = 10;

async function seedUsers(): Promise<string[]> {
  console.log(`Seeding ${NUM_USERS} users...`);
  const userIds: string[] = [];

  for (let i = 1; i <= NUM_USERS; i++) {
    const uid = `test-user-${i}`;
    userIds.push(uid);

    const role = i % 3 === 0 ? Role.ALUMNI : (i % 3 === 1 ? Role.STUDENT : Role.FACULTY);

    const userProfile = {
      PK: buildKey('USER', uid),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', role),
      GSI1SK: buildKey('USER', uid),
      entityType: 'USER',
      id: uid,
      fullName: `Test User ${i}`,
      role,
      email: `test${i}@example.com`,
      bio: 'Load testing profile',
      skills: ['Load Testing', 'Node.js', 'DynamoDB'],
      domain: 'Engineering',
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };

    await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: userProfile }));
    await syncUser(userProfile as any);
  }
  
  return userIds;
}

async function seedPosts(userIds: string[]) {
  console.log(`Seeding posts...`);
  const items: any[] = [];

  for (const uid of userIds) {
    for (let p = 1; p <= POSTS_PER_USER; p++) {
      const postId = generateId();
      const now = isoNow();
      
      items.push({
        PutRequest: {
          Item: {
            PK: buildKey('POST', postId),
            SK: 'META',
            GSI1PK: buildKey('USER', uid),
            GSI1SK: buildKey('POST', postId),
            GSI2PK: 'GLOBAL_FEED',
            GSI2SK: now,
            entityType: 'POST',
            id: postId,
            authorId: uid,
            content: `This is a test post ${p} from user ${uid} to verify load handling.`,
            mediaUrls: [],
            likesCount: 0,
            commentsCount: 0,
            allowComments: true,
            createdAt: now,
            updatedAt: now,
          }
        }
      });
    }
  }

  // Batch write 25 at a time
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await dynamoDb.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk,
      }
    }));
  }
}

async function seedConnections(userIds: string[]) {
  console.log('Seeding connections...');
  const items: any[] = [];
  
  // Each user connects with 20 others
  for (const uid of userIds) {
    for (let c = 0; c < 20; c++) {
      const targetId = userIds[Math.floor(Math.random() * userIds.length)];
      if (uid === targetId) continue;
      
      const [userA, userB] = [uid, targetId].sort();
      const now = isoNow();
      
      items.push({
        PutRequest: {
          Item: {
            PK: buildKey('USER', userA),
            SK: buildKey('CONN', userB),
            GSI1PK: buildKey('USER', userB),
            GSI1SK: buildKey('CONN', userA),
            entityType: 'CONNECTION',
            userA,
            userB,
            status: ConnectionStatus.ACCEPTED,
            requesterId: userA,
            createdAt: now,
            updatedAt: now,
          }
        }
      });
    }
  }

  // Deduplicate items just in case (random might pick same target twice)
  const uniqueItemsMap = new Map();
  for (const item of items) {
    uniqueItemsMap.set(`${item.PutRequest.Item.PK}-${item.PutRequest.Item.SK}`, item);
  }
  const uniqueItems = Array.from(uniqueItemsMap.values());

  for (let i = 0; i < uniqueItems.length; i += 25) {
    const chunk = uniqueItems.slice(i, i + 25);
    await dynamoDb.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk,
      }
    }));
  }
}

async function run() {
  try {
    const uids = await seedUsers();
    await seedPosts(uids);
    await seedConnections(uids);
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

run();
