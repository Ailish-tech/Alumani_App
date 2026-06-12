import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../src/config/db';
import { TABLE_NAME, buildKey } from '../src/utils/helpers';
import { initializeTypesenseCollections, syncUser, syncJob, syncEvent } from '../src/services/typesenseSync';

async function queryAllItemsByIndex(indexName: string, pkValue: string) {
  let items: any[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const response = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: indexName,
        KeyConditionExpression: `${indexName}PK = :pk`,
        ExpressionAttributeValues: { ':pk': pkValue },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    if (response.Items) {
      items = items.concat(response.Items);
    }
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

async function bulkSync() {
  console.log('🔄 Starting bulk sync to Typesense...');
  
  await initializeTypesenseCollections();

  // 1. Sync Users
  const roles = ['STUDENT', 'ALUMNI', 'FACULTY', 'ADMIN'];
  let totalUsers = 0;
  for (const role of roles) {
    const users = await queryAllItemsByIndex('GSI1', buildKey('ROLE', role));
    for (const user of users) {
      await syncUser(user);
    }
    totalUsers += users.length;
    console.log(`Synced ${users.length} users with role ${role}`);
  }

  // 2. Sync Jobs
  const jobs = await queryAllItemsByIndex('GSI1', 'COLLECTION#JOBS');
  for (const job of jobs) {
    await syncJob(job);
  }
  console.log(`Synced ${jobs.length} jobs`);

  // 3. Sync Events
  const events = await queryAllItemsByIndex('GSI1', 'COLLECTION#EVENTS');
  for (const event of events) {
    await syncEvent(event);
  }
  console.log(`Synced ${events.length} events`);

  console.log(`✅ Bulk sync complete! (Users: ${totalUsers}, Jobs: ${jobs.length}, Events: ${events.length})`);
}

bulkSync().catch((err) => {
  console.error('Error during bulk sync:', err);
  process.exit(1);
});
