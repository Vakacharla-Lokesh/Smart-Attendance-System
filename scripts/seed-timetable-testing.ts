/**
 * TIMETABLE SEED SCRIPT
 * File: scripts/seed-timetable-testing.ts
 * Run: npx tsx scripts/seed-timetable-testing.ts
 *
 * Wipes the TimeTable collection and re-seeds Mon–Sun schedules.
 * Requires rooms and courses to already exist (run seed.master.ts first).
 *
 * Uses actual ObjectId refs for room_id and course_id.
 * All times are created as local-time Date objects (consistent with how
 * the backend reads them via minutes-since-midnight arithmetic).
 *
 * Saturday and Sunday classes are mapped to TEST-ROOM-101 so the demo
 * GPS (28.657758679477865, 77.15009598045862) can be used for weekend testing.
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a Date for today at the given hour (local time).
 * Stored in MongoDB as UTC — the backend converts back using
 * minutes-since-midnight arithmetic, so the date portion doesn't matter.
 */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedTimeTables() {
  await TimeTable.deleteMany({});
  console.log("✓ Cleared TimeTable collection");

  // Fetch rooms — we need at least 3, and specifically TEST-ROOM-101 for weekends
  const allRooms = await Room.find({});
  if (allRooms.length < 2) {
    console.error("✗ Not enough rooms found. Run seed.master.ts first.");
    process.exit(1);
  }

  // Map rooms by room_number for predictable assignment
  const roomMap: Record<
    string,
    mongoose.Document & { _id: mongoose.Types.ObjectId }
  > = {};
  for (const r of allRooms) {
    roomMap[(r as { room_number: string }).room_number] =
      r as mongoose.Document & { _id: mongoose.Types.ObjectId };
  }

  const r0 = roomMap["101"] ?? allRooms[0];
  const r1 = roomMap["201"] ?? allRooms[1];
  const r2 = roomMap["102"] ?? allRooms[2] ?? allRooms[0];
  const rTest = roomMap["TEST-ROOM-101"] ?? allRooms[allRooms.length - 1];

  // Fetch courses
  const courses = await Course.find({}).limit(5);
  if (courses.length < 4) {
    console.error("✗ Not enough courses found. Run seed.master.ts first.");
    process.exit(1);
  }

  const [c0, c1, c2, c3, c4Raw] = courses;
  const c4 = c4Raw ?? c0; // fallback if only 4 courses exist

  type Entry = {
    room_id: mongoose.Types.ObjectId;
    course_id: mongoose.Types.ObjectId;
    day: string;
    start_time: Date;
    end_time: Date;
  };

  const entries: Entry[] = [
    // ── Monday ────────────────────────────────────────────────────────────────
    {
      room_id: (r0 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c0._id as mongoose.Types.ObjectId,
      day: "Monday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: (r0 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c1._id as mongoose.Types.ObjectId,
      day: "Monday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c2._id as mongoose.Types.ObjectId,
      day: "Monday",
      start_time: todayAt(12),
      end_time: todayAt(13),
    },
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Monday",
      start_time: todayAt(14),
      end_time: todayAt(15),
    },

    // ── Tuesday ───────────────────────────────────────────────────────────────
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Tuesday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c4._id as mongoose.Types.ObjectId,
      day: "Tuesday",
      start_time: todayAt(11),
      end_time: todayAt(12),
    },
    {
      room_id: (r2 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c1._id as mongoose.Types.ObjectId,
      day: "Tuesday",
      start_time: todayAt(13),
      end_time: todayAt(14),
    },

    // ── Wednesday ─────────────────────────────────────────────────────────────
    {
      room_id: (r0 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c2._id as mongoose.Types.ObjectId,
      day: "Wednesday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: (r0 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Wednesday",
      start_time: todayAt(11),
      end_time: todayAt(12),
    },
    {
      room_id: (r2 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c0._id as mongoose.Types.ObjectId,
      day: "Wednesday",
      start_time: todayAt(14),
      end_time: todayAt(15),
    },

    // ── Thursday ──────────────────────────────────────────────────────────────
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c0._id as mongoose.Types.ObjectId,
      day: "Thursday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c4._id as mongoose.Types.ObjectId,
      day: "Thursday",
      start_time: todayAt(12),
      end_time: todayAt(13),
    },
    {
      room_id: (r2 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c2._id as mongoose.Types.ObjectId,
      day: "Thursday",
      start_time: todayAt(14),
      end_time: todayAt(15),
    },

    // ── Friday ────────────────────────────────────────────────────────────────
    {
      room_id: (r0 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c1._id as mongoose.Types.ObjectId,
      day: "Friday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: (r0 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Friday",
      start_time: todayAt(13),
      end_time: todayAt(14),
    },
    {
      room_id: (r2 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c0._id as mongoose.Types.ObjectId,
      day: "Friday",
      start_time: todayAt(15),
      end_time: todayAt(16),
    },

    // ── Saturday — mapped to TEST-ROOM-101 for demo GPS testing ───────────────
    {
      room_id: (rTest as { _id: mongoose.Types.ObjectId })._id,
      course_id: c0._id as mongoose.Types.ObjectId,
      day: "Saturday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: (rTest as { _id: mongoose.Types.ObjectId })._id,
      course_id: c2._id as mongoose.Types.ObjectId,
      day: "Saturday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: (r1 as { _id: mongoose.Types.ObjectId })._id,
      course_id: c4._id as mongoose.Types.ObjectId,
      day: "Saturday",
      start_time: todayAt(14),
      end_time: todayAt(15),
    },

    // ── Sunday — mapped to TEST-ROOM-101 for demo GPS testing ─────────────────
    {
      room_id: (rTest as { _id: mongoose.Types.ObjectId })._id,
      course_id: c1._id as mongoose.Types.ObjectId,
      day: "Sunday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: (rTest as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Sunday",
      start_time: todayAt(11),
      end_time: todayAt(12),
    },
    {
      room_id: (rTest as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Sunday",
      start_time: todayAt(12),
      end_time: todayAt(13),
    },
    {
      room_id: (rTest as { _id: mongoose.Types.ObjectId })._id,
      course_id: c3._id as mongoose.Types.ObjectId,
      day: "Sunday",
      start_time: todayAt(13),
      end_time: todayAt(14),
    },
  ];

  const created = await TimeTable.insertMany(entries);
  console.log(`\n✓ Seeded ${created.length} timetable entries\n`);

  // Summary by day
  const byDay: Record<string, number> = {};
  for (const e of entries) {
    byDay[e.day] = (byDay[e.day] ?? 0) + 1;
  }
  for (const [day, count] of Object.entries(byDay)) {
    console.log(
      `    ${day.padEnd(10)} : ${count} class${count > 1 ? "es" : ""}`,
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🗓️   Starting timetable seed (Mon–Sun)...\n");

  await mongoose.connect(MONGODB_URI!);
  console.log("✓ Connected to MongoDB\n");

  await seedTimeTables();

  console.log("\n✅  Timetable seed complete!\n");
  console.log("  Note: Saturday & Sunday classes are in TEST-ROOM-101");
  console.log(
    "  GPS: 28.657758679477865, 77.15009598045862 (geofence: 100 m)\n",
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Timetable seed failed:", err);
  process.exit(1);
});
