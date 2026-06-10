import { redisClient } from '../config/redis';

// Default TTLs in seconds
const DEFAULT_TTL = 3600; // 1 hour

export async function cacheSet(key: string, data: any, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  try {
    const value = JSON.stringify(data);
    await redisClient.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    console.error(`❌ Redis cacheSet error for key ${key}:`, err);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error(`❌ Redis cacheGet error for key ${key}:`, err);
    return null;
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`❌ Redis cacheDelete error for key ${key}:`, err);
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100,
    });
    
    stream.on('data', async (keys: string[]) => {
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    });
    
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  } catch (err) {
    console.error(`❌ Redis cacheDeletePattern error for pattern ${pattern}:`, err);
  }
}

// ─── Cache Keys Helpers ──────────────────────────────────────────────────────

export const CacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  globalFeed: () => `feed:global`,
  userFeed: (userId: string) => `feed:user:${userId}`,
};
