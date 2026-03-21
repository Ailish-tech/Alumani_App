import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Local Database Connection
const client = new DynamoDBClient({
  endpoint: "http://localhost:8000",
  region: "us-east-1",
  credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
});
const docClient = DynamoDBDocumentClient.from(client);

// Humara Dummy Data (Single-Table Design ke hisaab se)
const dummyData = [
  {
    // 1. A 2nd Year B.Tech Student
    PK: "USER#2026CS105",
    SK: "PROFILE",
    role: "STUDENT",
    fullName: "Priya Singh",
    branch: "Computer Science",
    graduationYear: 2028,
    skills: ["PostgreSQL", "JavaScript"],
    GSI1PK: "ROLE#STUDENT",
    GSI1SK: "SCORE#0"
  },
  {
    // 2. An Alumni (ML Expert)
    PK: "USER#2022CS001",
    SK: "PROFILE",
    role: "ALUMNI",
    fullName: "Rahul Sharma",
    branch: "Computer Science",
    graduationYear: 2022,
    skills: ["Machine Learning", "Python", "AWS"],
    reputationScore: 15,
    GSI1PK: "ROLE#ALUMNI",
    GSI1SK: "SCORE#15"
  },
  {
    // 3. A Post for the Global Feed
    PK: "POST#101",
    SK: "DETAILS",
    authorId: "USER#2022CS001",
    authorName: "Rahul Sharma",
    content: "Just deployed my new Machine Learning model on AWS! Any juniors need help with regression models, let me know.",
    createdAt: new Date().toISOString(),
    // GSIs for fast fetching
    GSI1PK: "USER#2022CS001", // Fetch posts by author
    GSI1SK: "POST#" + new Date().toISOString(),
    GSI2PK: "GLOBAL#FEED", // Fetch posts for global feed
    GSI2SK: "POST#" + new Date().toISOString()
  }
];

const run = async () => {
  console.log("🌱 Planting seeds in the database...");
  for (const item of dummyData) {
    try {
      await docClient.send(new PutCommand({
        TableName: "AlumniConnectData",
        Item: item
      }));
      console.log(`✔️ Inserted: ${item.PK} | ${item.SK}`);
    } catch (err) {
      console.error(`❌ Error inserting ${item.PK}:`, err);
    }
  }
  console.log("✅ Dummy data seeded successfully!");
};

run();