import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

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
 * Returns the queue entry that was added
 */
export async function addPunchToQueue(
  entry: PunchQueueEntry,
): Promise<PunchQueueEntry> {
  try {
    const key = `${QUEUE_PREFIX}${entry.enroll_number}`;
    await redis.setex(key, QUEUE_TTL, JSON.stringify(entry));
    // console.log(
    //   `Added punch to queue for ${entry.enroll_number}, TTL: ${QUEUE_TTL}s`,
    // );
    return entry;
  } catch (error) {
    console.error("Error adding punch to queue:", error);
    throw error;
  }
}

/**
 * Get a pending punch request from the queue for a student
 * Returns the entry if found, null if not found or expired
 */
export async function getPunchFromQueue(
  enroll_number: string,
): Promise<PunchQueueEntry | null> {
  try {
    const key = `${QUEUE_PREFIX}${enroll_number}`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    const entry = JSON.parse(data as string) as PunchQueueEntry;

    // Check if entry is stale (older than 10 minutes)
    const now = Date.now();
    const entryAge = (now - entry.timestamp) / 1000; // in seconds

    if (entryAge > QUEUE_TTL) {
      // Entry is stale, remove it
      await removePunchFromQueue(enroll_number);
      return null;
    }

    return entry;
  } catch (error) {
    console.error("Error getting punch from queue:", error);
    return null;
  }
}

/**
 * Remove a punch request from the queue (after attendance is marked)
 */
export async function removePunchFromQueue(
  enroll_number: string,
): Promise<boolean> {
  try {
    const key = `${QUEUE_PREFIX}${enroll_number}`;
    const result = await redis.del(key);
    // console.log(`Removed punch from queue for ${enroll_number}`);
    return result > 0;
  } catch (error) {
    console.error("Error removing punch from queue:", error);
    throw error;
  }
}

/**
 * Get all pending punch requests (for admin dashboard)
 */
export async function getAllPendingPunches(): Promise<PunchQueueEntry[]> {
  try {
    // Note: This requires more sophisticated scanning on Upstash
    // For now, we'll return empty and suggest using MongoDB for bulk operations
    console.warn(
      "getAllPendingPunches: Not recommended for large datasets on Upstash free tier",
    );
    return [];
  } catch (error) {
    console.error("Error getting all pending punches:", error);
    return [];
  }
}

export { redis };
