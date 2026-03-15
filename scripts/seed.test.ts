/**
 * TEST SEED SCRIPT
 * File: scripts/seed.test.ts
 * Run: npx tsx scripts/seed.test.ts
 *
 * Seeds ONE complete test scenario:
 *   - 1 Room at the provided dummy location (28.581594, 77.072501)
 *   - 1 Course linked to that room
 *   - 1 Timetable entry for TODAY's day-of-week, covering the next 2 hours
 *   - 1 Student with card_number for IoT scan
 *   - 1 UserData entry (login credentials) for that student
 *
 * Does NOT wipe other collections — only upserts what it needs.
 *
 * Test credentials after seeding:
 *   Email:    test.student@college.edu
 *   Password: test1234
 *   Enroll:   TEST001
 *   Card:     CARD-TEST-001
 *   Scanner:  SCANNER-TEST-001
 *   Room:     TEST-ROOM-101
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load env from .env.local
dotenv.config({ path: ".env.local" });

import Student from "@/models/Student";
import UserData from "@/models/UserData";
import Course from "@/models/Course";
import Room from "@/models/Room";
import TimeTable from "@/models/TimeTable";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smart-attendance";

// ─── Dummy location provided ─────────────────────────────────────────────────
// const DUMMY_LAT = 28.581594082152122;
// const DUMMY_LNG = 77.07250122463445;

// Change these two lines:
const DUMMY_LAT = 28.657758679477865;
const DUMMY_LNG = 77.15009598045862;

const GEOFENCE_RADIUS_METERS = 100; // 100m — generous for testing

// ─── Fixed test identifiers ───────────────────────────────────────────────────
const TEST_ENROLL = "TEST001";
const TEST_EMAIL = "test.student@college.edu";
const TEST_PASSWORD = "test1234";
const TEST_CARD = "CARD-TEST-001";
const TEST_SCANNER = "SCANNER-TEST-001";
const TEST_ROOM_NUMBER = "TEST-ROOM-101";
const TEST_COURSE_CODE = "TEST101";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns today's day name e.g. "Wednesday"
 */
function getTodayName(): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
}

/**
 * Returns a Date for today at a given hour/minute (local time, stored as UTC)
 */
function todayAt(hour: number, minute: number = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedRoom() {
  const existing = await Room.findOne({ room_number: TEST_ROOM_NUMBER });
  if (existing) {
    console.log(
      `  ↳ Room already exists (${TEST_ROOM_NUMBER}), updating coordinates...`,
    );
    await Room.updateOne(
      { room_number: TEST_ROOM_NUMBER },
      {
        latitude: DUMMY_LAT,
        longitude: DUMMY_LNG,
        geofence_radius: GEOFENCE_RADIUS_METERS,
        scanner_id: TEST_SCANNER,
      },
    );
    return await Room.findOne({ room_number: TEST_ROOM_NUMBER });
  }

  const room = await Room.create({
    room_number: TEST_ROOM_NUMBER,
    building: "Test Building",
    floor: "1st Floor",
    scanner_id: TEST_SCANNER,
    latitude: DUMMY_LAT,
    longitude: DUMMY_LNG,
    geofence_radius: GEOFENCE_RADIUS_METERS,
  });

  console.log(`  ✓ Room created: ${TEST_ROOM_NUMBER}`);
  console.log(`    Lat: ${DUMMY_LAT}, Lng: ${DUMMY_LNG}`);
  console.log(`    Geofence: ${GEOFENCE_RADIUS_METERS}m`);
  console.log(`    Scanner: ${TEST_SCANNER}`);
  return room;
}

async function seedCourse() {
  const existing = await Course.findOne({ course_code: TEST_COURSE_CODE });
  if (existing) {
    console.log(`  ↳ Course already exists (${TEST_COURSE_CODE})`);
    return existing;
  }

  const course = await Course.create({
    course_code: TEST_COURSE_CODE,
    course_name: "Test Course — Attendance Flow",
    department: "CSE",
    credits: 3,
    instructor_name: "Test Instructor",
    instructor_email: "instructor@college.edu",
    year: 2,
    semester: 3,
    is_active: true,
  });

  console.log(`  ✓ Course created: ${TEST_COURSE_CODE}`);
  return course;
}

async function seedTimetable(
  roomId: mongoose.Types.ObjectId,
  courseId: mongoose.Types.ObjectId,
) {
  // Remove any existing timetable for this room today (clean slate)
  const today = getTodayName();
  await TimeTable.deleteMany({ room_id: roomId, day: today });

  // Class window: 1 hour ago → 2 hours from now
  // This guarantees the current time always falls inside the window during testing
  const now = new Date();
  const startHour = now.getHours() - 1;
  const endHour = now.getHours() + 2;

  const timetable = await TimeTable.create({
    room_id: roomId,
    course_id: courseId,
    day: today,
    start_time: todayAt(startHour < 0 ? 0 : startHour),
    end_time: todayAt(endHour > 23 ? 23 : endHour, 59),
  });

  console.log(`  ✓ Timetable created for today (${today})`);
  console.log(
    `    Window: ${startHour < 0 ? 0 : startHour}:00 → ${endHour > 23 ? 23 : endHour}:59 (covers right now)`,
  );
  return timetable;
}

async function seedStudent() {
  const existing = await Student.findOne({ enroll_number: TEST_ENROLL });
  if (existing) {
    console.log(
      `  ↳ Student already exists (${TEST_ENROLL}), ensuring card_number is set...`,
    );
    await Student.updateOne(
      { enroll_number: TEST_ENROLL },
      { card_number: TEST_CARD, is_active: true },
    );
    return await Student.findOne({ enroll_number: TEST_ENROLL });
  }

  const student = await Student.create({
    enroll_number: TEST_ENROLL,
    name: "Test Student",
    email: TEST_EMAIL,
    phone: "9999999999",
    course: "CSE",
    year: 2,
    section: "A",
    card_number: TEST_CARD,
    is_active: true,
    is_admin: false,
  });

  console.log(`  ✓ Student created: ${TEST_ENROLL}`);
  console.log(`    Card Number: ${TEST_CARD}`);
  return student;
}

async function seedUserData() {
  const existing = await UserData.findOne({ enroll_no: TEST_ENROLL });
  if (existing) {
    console.log(`  ↳ UserData already exists for ${TEST_ENROLL}`);
    return existing;
  }

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  const userData = await UserData.create({
    email_id: TEST_EMAIL,
    password: hashedPassword,
    enroll_no: TEST_ENROLL,
  });

  console.log(`  ✓ UserData created`);
  console.log(`    Email: ${TEST_EMAIL}`);
  console.log(`    Password (plain): ${TEST_PASSWORD}`);
  return userData;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Starting test seed...\n");

  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB\n");

  console.log("📍 Seeding Room...");
  const room = await seedRoom();

  console.log("\n📚 Seeding Course...");
  const course = await seedCourse();

  console.log("\n🗓️  Seeding Timetable...");
  await seedTimetable(
    room!._id as mongoose.Types.ObjectId,
    course._id as mongoose.Types.ObjectId,
  );

  console.log("\n👤 Seeding Student...");
  await seedStudent();

  console.log("\n🔐 Seeding UserData (login)...");
  await seedUserData();

  console.log("\n✅ Test seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Use these values in your test API calls:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Login Email    : ${TEST_EMAIL}`);
  console.log(`  Login Password : ${TEST_PASSWORD}`);
  console.log(`  Enroll Number  : ${TEST_ENROLL}`);
  console.log(`  Card Number    : ${TEST_CARD}`);
  console.log(`  Scanner ID     : ${TEST_SCANNER}`);
  console.log(`  Room Number    : ${TEST_ROOM_NUMBER}`);
  console.log(`  Room Lat/Lng   : ${DUMMY_LAT}, ${DUMMY_LNG}`);
  console.log(`  Geofence       : ${GEOFENCE_RADIUS_METERS}m`);
  console.log(`  Today's Day    : ${getTodayName()} (timetable set for today)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
