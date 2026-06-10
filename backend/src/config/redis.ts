import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || '';

export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword || undefined,
  retryStrategy: (times) => {
    // Reconnect after 2 seconds
    return Math.min(times * 50, 2000);
  },
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
