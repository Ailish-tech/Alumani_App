import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'fakeAccessKeyId', secretAccessKey: 'fakeSecretAccessKey' },
});
const db = DynamoDBDocumentClient.from(client);

async function main() {
  console.log('Searching for bhavyagupta294@gmail.com...');
  
  const scan = await db.send(new ScanCommand({
    TableName: 'Users',
    FilterExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': 'bhavyagupta294@gmail.com' },
  }));
  
  console.log('Found:', scan.Items?.length || 0, 'users');
  
  if (scan.Items && scan.Items.length > 0) {
    const user = scan.Items[0];
    console.log('User ID:', user.id);
    console.log('Current role:', user.role);
    
    await db.send(new UpdateCommand({
      TableName: 'Users',
      Key: { id: user.id },
      UpdateExpression: 'SET #r = :role',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': 'ALUMNI' },
    }));
    
    console.log('✅ Role updated to ALUMNI!');
  } else {
    console.log('❌ No user found with that email');
  }
}

main().catch(e => console.error('Error:', e));
