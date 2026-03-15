import { Redis } from "@upstash/redis";

// Validate environment variables before creating client
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const isRedisConfigured =
  REDIS_URL.startsWith("https://") && REDIS_TOKEN.length > 10;

// Create Redis client — only used if configured
const redis = isRedisConfigured
  ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
  : null;

if (!isRedisConfigured) {
  console.warn(
    "[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing or invalid. " +
      "Real-time NFC punch queue will be disabled. Set these values in .env.local to enable it.",
  );
}

export interface PunchQueueEntry {
  enroll_number: string;
  card_number: string;
  room_id: string;
  scanner_id: string;
  timestamp: number; // Unix timestamp when card was scanned
}

const QUEUE_TTL = 600; // 10 minutes in seconds
const QUEUE_PREFIX = "punch_queue:";

/**
 * Add a punch request to the Redis queue
 * Returns the queue entry that was added, or null if Redis is unavailable
 */
export async function addPunchToQueue(
  entry: PunchQueueEntry,
): Promise<PunchQueueEntry | null> {
  if (!redis) {
    console.warn("[Redis] addPunchToQueue: Redis not configured, skipping.");
    return null;
  }
  try {
    const key = `${QUEUE_PREFIX}${entry.enroll_number}`;
    await redis.setex(key, QUEUE_TTL, JSON.stringify(entry));
    return entry;
  } catch (error) {
    // Log a concise message — no full stack trace for network errors
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis] addPunchToQueue failed: ${msg}`);
    return null;
  }
}

/**
 * Get a pending punch request from the queue for a student
 * Returns the entry if found, null if not found, expired, or Redis unavailable
 */
export async function getPunchFromQueue(
  enroll_number: string,
): Promise<PunchQueueEntry | null> {
  if (!redis) return null;

  try {
    const key = `${QUEUE_PREFIX}${enroll_number}`;
    const data = await redis.get(key);

    if (!data) return null;

    const entry = (
      typeof data === "string" ? JSON.parse(data) : data
    ) as PunchQueueEntry;

    // Check if the entry is stale (older than 10 minutes)
    const now = Date.now();
    const entryAge = (now - entry.timestamp) / 1000;

    if (entryAge > QUEUE_TTL) {
      await removePunchFromQueue(enroll_number);
      return null;
    }

    return entry;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis] getPunchFromQueue failed: ${msg}`);
    return null;
  }
}

/**
 * Remove a punch request from the queue (after attendance is marked)
 */
export async function removePunchFromQueue(
  enroll_number: string,
): Promise<boolean> {
  if (!redis) return false;

  try {
    const key = `${QUEUE_PREFIX}${enroll_number}`;
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis] removePunchFromQueue failed: ${msg}`);
    return false;
  }
}

/**
 * Get all pending punch requests (for admin dashboard)
 * Note: requires SCAN on Upstash — not recommended for large datasets
 */
export async function getAllPendingPunches(): Promise<PunchQueueEntry[]> {
  if (!redis) return [];

  try {
    console.warn(
      "[Redis] getAllPendingPunches: Not recommended for large datasets on Upstash free tier",
    );
    return [];
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis] getAllPendingPunches failed: ${msg}`);
    return [];
  }
}

export { redis };
