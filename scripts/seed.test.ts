/**
 * TEST SEED SCRIPT
 * File: scripts/seed.test.ts
 * Run: npx tsx scripts/seed.test.ts
 *
 * Seeds ONE complete test scenario without wiping other collections:
 *   - 1 Room at the demo GPS (TEST-ROOM-101) — upserted
 *   - 1 Course (TEST101) — upserted
 *   - 1 Timetable entry for TODAY's day covering ±2 hours from now — recreated
 *   - 1 Student with card_number and profile_photo — upserted
 *   - 1 UserData entry (bcrypt-hashed) — upserted
 *
 * Safe to run repeatedly. Only touches the TEST* identifiers.
 *
 * Test credentials:
 *   Email    : test.student@college.edu
 *   Password : test1234
 *   Enroll   : TEST001
 *   Card     : CARD-TEST-001
 *   Scanner  : SCANNER-TEST-001
 *   Room     : TEST-ROOM-101
 *   GPS      : 28.657758679477865, 77.15009598045862  (geofence: 100 m)
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Student from "@/models/Student";
import UserData from "@/models/UserData";
import Course from "@/models/Course";
import Room from "@/models/Room";
import TimeTable from "@/models/TimeTable";

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

const DEMO_LAT = 28.657758679477865;
const DEMO_LNG = 77.15009598045862;
const GEOFENCE = 100; // meters

const TEST_ENROLL = "TEST001";
const TEST_EMAIL = "test.student@college.edu";
const TEST_PASS = "test1234";
const TEST_CARD = "CARD-TEST-001";
const TEST_SCANNER = "SCANNER-TEST-001";
const TEST_ROOM = "TEST-ROOM-101";
const TEST_COURSE = "TEST101";

// Placeholder profile photo (1×1 transparent PNG).
// The face-match check in punch-out uses this value on both sides during dev.
const PLACEHOLDER_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayName(): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];
}

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour < 0 ? 0 : hour > 23 ? 23 : hour, minute, 0, 0);
  return d;
}

// ─── Seed helpers ──────────────────────────────────────────────────────────────

async function seedRoom() {
  await Room.updateOne(
    { room_number: TEST_ROOM },
    {
      $set: {
        room_number: TEST_ROOM,
        building: "Test Building",
        floor: "1st Floor",
        scanner_id: TEST_SCANNER,
        latitude: DEMO_LAT,
        longitude: DEMO_LNG,
        geofence_radius: GEOFENCE,
      },
    },
    { upsert: true },
  );
  const room = await Room.findOne({ room_number: TEST_ROOM });
  console.log(`✓ Room upserted: ${TEST_ROOM}  (${DEMO_LAT}, ${DEMO_LNG})`);
  return room!;
}

async function seedCourse() {
  await Course.updateOne(
    { course_code: TEST_COURSE },
    {
      $set: {
        course_code: TEST_COURSE,
        course_name: "Test Course — Attendance Flow",
        department: "CSE",
        credits: 3,
        instructor_name: "Test Instructor",
        instructor_email: "instructor@college.edu",
        year: 2,
        semester: 3,
        is_active: true,
      },
    },
    { upsert: true },
  );
  const course = await Course.findOne({ course_code: TEST_COURSE });
  console.log(`✓ Course upserted: ${TEST_COURSE}`);
  return course!;
}

async function seedTimetable(
  roomId: mongoose.Types.ObjectId,
  courseId: mongoose.Types.ObjectId,
) {
  const today = getTodayName();

  // Delete any existing test timetable for this room today
  await TimeTable.deleteMany({ room_id: roomId, day: today });

  const now = new Date();
  const startHour = now.getHours() - 1; // 1 hour before now
  const endHour = now.getHours() + 2; // 2 hours after now

  const entry = await TimeTable.create({
    room_id: roomId,
    course_id: courseId,
    day: today,
    start_time: todayAt(startHour),
    end_time: todayAt(endHour, 59),
  });

  console.log(
    `✓ Timetable created for today (${today}): ` +
      `${Math.max(startHour, 0)}:00 → ${Math.min(endHour, 23)}:59`,
  );
  return entry;
}

async function seedStudent() {
  await Student.updateOne(
    { enroll_number: TEST_ENROLL },
    {
      $set: {
        enroll_number: TEST_ENROLL,
        name: "Test Student",
        email: TEST_EMAIL,
        phone: "9999999999",
        course: "CSE",
        year: 2,
        section: "A",
        card_number: TEST_CARD,
        rfid_tag: "RFID-TEST-001",
        is_active: true,
        is_admin: false,
        profile_photo: PLACEHOLDER_PHOTO,
      },
    },
    { upsert: true },
  );
  console.log(`✓ Student upserted: ${TEST_ENROLL}  (card: ${TEST_CARD})`);
}

async function seedUserData() {
  const existing = await UserData.findOne({ enroll_no: TEST_ENROLL });
  if (existing) {
    console.log(`✓ UserData already exists for ${TEST_ENROLL} — skipped`);
    return;
  }

  const hashed = await bcrypt.hash(TEST_PASS, 10);
  await UserData.create({
    email_id: TEST_EMAIL,
    password: hashed,
    enroll_no: TEST_ENROLL,
  });
  console.log(
    `✓ UserData created  (email: ${TEST_EMAIL}, password: ${TEST_PASS})`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Starting test seed...\n");

  await mongoose.connect(MONGODB_URI!);
  console.log("✓ Connected to MongoDB\n");

  const room = await seedRoom();
  const course = await seedCourse();
  await seedTimetable(
    room._id as mongoose.Types.ObjectId,
    course._id as mongoose.Types.ObjectId,
  );
  await seedStudent();
  await seedUserData();

  console.log("\n✅  Test seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Email    : ${TEST_EMAIL}`);
  console.log(`  Password : ${TEST_PASS}`);
  console.log(`  Enroll   : ${TEST_ENROLL}`);
  console.log(`  Card     : ${TEST_CARD}  |  Scanner: ${TEST_SCANNER}`);
  console.log(`  Room GPS : ${DEMO_LAT}, ${DEMO_LNG}`);
  console.log(`  Geofence : ${GEOFENCE} m`);
  console.log(`  Today    : ${getTodayName()} — timetable covers right now`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Test seed failed:", err);
  process.exit(1);
});
