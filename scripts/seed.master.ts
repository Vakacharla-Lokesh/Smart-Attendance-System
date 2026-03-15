/**
 * MASTER SEED SCRIPT
 * File: scripts/seed.master.ts
 * Run: npx tsx scripts/seed.master.ts
 *
 * Wipes ALL collections and seeds a complete, consistent dataset:
 *   - 10 Students (with card_number, email, phone, profile_photo)
 *   - 10 UserData entries (bcrypt-hashed passwords)
 *   - 3 Admins + 2 Admin UserData entries
 *   - 5 Courses
 *   - 6 Rooms (including TEST-ROOM-101 at the demo GPS)
 *   - Timetable entries for ALL 7 days (Mon–Sun)
 *   - Punch history for the past 14 days (weekdays only, 85% attendance)
 *   - AttendanceRecord documents derived from that punch history
 *
 * All students get:
 *   card_number  → used by IoT /api/scan
 *   profile_photo → required for punch-out face match
 *
 * Credentials after seeding:
 *   Student:  aarav.kumar.1@college.edu  / password123  (enroll: STU0001, card: CARD-0001)
 *   Admin:    admin1@college.edu          / adminpass123  (enroll: ADM001)
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Student from "@/models/Student";
import Admin from "@/models/Admin";
import UserData from "@/models/UserData";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";
import Punch from "@/models/Punch";
import AttendanceRecord from "@/models/AttendanceRecord";

// ─── Config ──────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Demo GPS — matches TEST-ROOM-101
const DEMO_LAT = 28.657758679477865;
const DEMO_LNG = 77.15009598045862;

// Placeholder 1×1 transparent PNG (base64) used as profile_photo.
// Replace with real photos in production. Face-match will pass with the
// same placeholder on both sides during development.
const PLACEHOLDER_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a Date set to today at the given hour:minute (local time). */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Returns a Date N days ago at the given hour:minute (local time). */
function daysAgoAt(daysAgo: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Returns the day name for a given Date. */
function getDayName(date: Date): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];
}

// ─── 1. Clear ─────────────────────────────────────────────────────────────────

async function clearAll() {
  await Promise.all([
    Student.deleteMany({}),
    Admin.deleteMany({}),
    UserData.deleteMany({}),
    Course.deleteMany({}),
    TimeTable.deleteMany({}),
    Room.deleteMany({}),
    Punch.deleteMany({}),
    AttendanceRecord.deleteMany({}),
  ]);
  console.log("✓ Cleared all collections");
}

// ─── 2. Rooms ─────────────────────────────────────────────────────────────────

async function seedRooms() {
  const rooms = [
    {
      room_number: "101",
      building: "Main Building",
      floor: "1st Floor",
      scanner_id: "SCANNER001",
      latitude: 28.6139,
      longitude: 77.209,
      geofence_radius: 50,
    },
    {
      room_number: "102",
      building: "Main Building",
      floor: "1st Floor",
      scanner_id: "SCANNER002",
      latitude: 28.614,
      longitude: 77.2091,
      geofence_radius: 50,
    },
    {
      room_number: "201",
      building: "Main Building",
      floor: "2nd Floor",
      scanner_id: "SCANNER003",
      latitude: 28.6141,
      longitude: 77.2092,
      geofence_radius: 50,
    },
    {
      room_number: "202",
      building: "Main Building",
      floor: "2nd Floor",
      scanner_id: "SCANNER004",
      latitude: 28.6142,
      longitude: 77.2093,
      geofence_radius: 50,
    },
    {
      room_number: "301",
      building: "Annex Building",
      floor: "3rd Floor",
      scanner_id: "SCANNER005",
      latitude: 28.6143,
      longitude: 77.2094,
      geofence_radius: 50,
    },
    {
      // Demo room — GPS matches the test location used in seed.test.ts
      room_number: "TEST-ROOM-101",
      building: "Test Building",
      floor: "1st Floor",
      scanner_id: "SCANNER-TEST-001",
      latitude: DEMO_LAT,
      longitude: DEMO_LNG,
      geofence_radius: 100,
    },
  ];

  const created = await Room.insertMany(rooms);
  console.log(`✓ Seeded ${created.length} rooms`);
  return created;
}

// ─── 3. Courses ───────────────────────────────────────────────────────────────

async function seedCourses() {
  const courses = [
    {
      course_code: "CSE101",
      course_name: "Data Structures",
      department: "CSE",
      credits: 4,
      instructor_name: "Dr. Rajesh Kumar",
      instructor_email: "rajesh.kumar@college.edu",
      year: 2,
      semester: 3,
      is_active: true,
    },
    {
      course_code: "CSE102",
      course_name: "Web Development",
      department: "CSE",
      credits: 3,
      instructor_name: "Prof. Anita Singh",
      instructor_email: "anita.singh@college.edu",
      year: 2,
      semester: 4,
      is_active: true,
    },
    {
      course_code: "ECE101",
      course_name: "Digital Electronics",
      department: "ECE",
      credits: 4,
      instructor_name: "Dr. Vikram Patel",
      instructor_email: "vikram.patel@college.edu",
      year: 2,
      semester: 3,
      is_active: true,
    },
    {
      course_code: "ME101",
      course_name: "Thermodynamics",
      department: "ME",
      credits: 4,
      instructor_name: "Prof. Suresh Gupta",
      instructor_email: "suresh.gupta@college.edu",
      year: 2,
      semester: 3,
      is_active: true,
    },
    {
      course_code: "CSE103",
      course_name: "Database Management",
      department: "CSE",
      credits: 4,
      instructor_name: "Dr. Priya Sharma",
      instructor_email: "priya.teacher@college.edu",
      year: 1,
      semester: 2,
      is_active: true,
    },
  ];

  const created = await Course.insertMany(courses);
  console.log(`✓ Seeded ${created.length} courses`);
  return created;
}

// ─── 4. Timetable (Mon–Sun) ───────────────────────────────────────────────────

async function seedTimetable(
  rooms: mongoose.Document[],
  courses: mongoose.Document[],
) {
  const r = rooms as Array<
    mongoose.Document & { _id: mongoose.Types.ObjectId }
  >;
  const c = courses as Array<
    mongoose.Document & { _id: mongoose.Types.ObjectId }
  >;

  // Shorthand aliases
  const [r0, r1, r2, , , r5] = r; // r5 = TEST-ROOM-101
  const [c0, c1, c2, c3, c4] = c;

  const entries = [
    // ── Monday ────────────────────────────────────────────────
    {
      room_id: r0._id,
      course_id: c0._id,
      day: "Monday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: r0._id,
      course_id: c1._id,
      day: "Monday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: r1._id,
      course_id: c2._id,
      day: "Monday",
      start_time: todayAt(12),
      end_time: todayAt(13),
    },
    // ── Tuesday ───────────────────────────────────────────────
    {
      room_id: r1._id,
      course_id: c3._id,
      day: "Tuesday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: r1._id,
      course_id: c4._id,
      day: "Tuesday",
      start_time: todayAt(11),
      end_time: todayAt(12),
    },
    {
      room_id: r2._id,
      course_id: c1._id,
      day: "Tuesday",
      start_time: todayAt(13),
      end_time: todayAt(14),
    },
    // ── Wednesday ─────────────────────────────────────────────
    {
      room_id: r0._id,
      course_id: c2._id,
      day: "Wednesday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: r0._id,
      course_id: c3._id,
      day: "Wednesday",
      start_time: todayAt(11),
      end_time: todayAt(12),
    },
    {
      room_id: r2._id,
      course_id: c0._id,
      day: "Wednesday",
      start_time: todayAt(14),
      end_time: todayAt(15),
    },
    // ── Thursday ──────────────────────────────────────────────
    {
      room_id: r1._id,
      course_id: c0._id,
      day: "Thursday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: r1._id,
      course_id: c4._id,
      day: "Thursday",
      start_time: todayAt(12),
      end_time: todayAt(13),
    },
    // ── Friday ────────────────────────────────────────────────
    {
      room_id: r0._id,
      course_id: c1._id,
      day: "Friday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: r0._id,
      course_id: c3._id,
      day: "Friday",
      start_time: todayAt(13),
      end_time: todayAt(14),
    },
    // ── Saturday ──────────────────────────────────────────────
    {
      room_id: r5._id,
      course_id: c0._id,
      day: "Saturday",
      start_time: todayAt(9),
      end_time: todayAt(10),
    },
    {
      room_id: r5._id,
      course_id: c2._id,
      day: "Saturday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: r2._id,
      course_id: c4._id,
      day: "Saturday",
      start_time: todayAt(14),
      end_time: todayAt(15),
    },
    // ── Sunday ────────────────────────────────────────────────
    {
      room_id: r5._id,
      course_id: c1._id,
      day: "Sunday",
      start_time: todayAt(10),
      end_time: todayAt(11),
    },
    {
      room_id: r5._id,
      course_id: c3._id,
      day: "Sunday",
      start_time: todayAt(11),
      end_time: todayAt(12),
    },
  ];

  const created = await TimeTable.insertMany(entries);
  console.log(`✓ Seeded ${created.length} timetable entries (Mon–Sun)`);
  return created;
}

// ─── 5. Students ──────────────────────────────────────────────────────────────

async function seedStudents() {
  const data = [
    {
      enroll_number: "STU0001",
      name: "Aarav Kumar",
      email: "aarav.kumar.1@college.edu",
      phone: "9876543201",
      course: "CSE",
      year: 2,
      section: "A",
      card_number: "CARD-0001",
    },
    {
      enroll_number: "STU0002",
      name: "Priya Sharma",
      email: "priya.sharma.2@college.edu",
      phone: "9876543202",
      course: "CSE",
      year: 2,
      section: "A",
      card_number: "CARD-0002",
    },
    {
      enroll_number: "STU0003",
      name: "Rahul Verma",
      email: "rahul.verma.3@college.edu",
      phone: "9876543203",
      course: "ECE",
      year: 2,
      section: "B",
      card_number: "CARD-0003",
    },
    {
      enroll_number: "STU0004",
      name: "Anjali Patel",
      email: "anjali.patel.4@college.edu",
      phone: "9876543204",
      course: "CSE",
      year: 1,
      section: "A",
      card_number: "CARD-0004",
    },
    {
      enroll_number: "STU0005",
      name: "Vikram Singh",
      email: "vikram.singh.5@college.edu",
      phone: "9876543205",
      course: "ECE",
      year: 3,
      section: "C",
      card_number: "CARD-0005",
    },
    {
      enroll_number: "STU0006",
      name: "Neha Gupta",
      email: "neha.gupta.6@college.edu",
      phone: "9876543206",
      course: "CSE",
      year: 2,
      section: "A",
      card_number: "CARD-0006",
    },
    {
      enroll_number: "STU0007",
      name: "Arjun Menon",
      email: "arjun.menon.7@college.edu",
      phone: "9876543207",
      course: "ME",
      year: 2,
      section: "B",
      card_number: "CARD-0007",
    },
    {
      enroll_number: "STU0008",
      name: "Sakshi Roy",
      email: "sakshi.roy.8@college.edu",
      phone: "9876543208",
      course: "CSE",
      year: 1,
      section: "B",
      card_number: "CARD-0008",
    },
    {
      enroll_number: "STU0009",
      name: "Rohan Das",
      email: "rohan.das.9@college.edu",
      phone: "9876543209",
      course: "ME",
      year: 3,
      section: "C",
      card_number: "CARD-0009",
    },
    {
      enroll_number: "STU0010",
      name: "Divya Nair",
      email: "divya.nair.10@college.edu",
      phone: "9876543210",
      course: "CSE",
      year: 2,
      section: "A",
      card_number: "CARD-0010",
    },
  ];

  const students = data.map((s) => ({
    ...s,
    rfid_tag: s.card_number.replace("CARD-", "RFID-"),
    is_active: true,
    is_admin: false,
    profile_photo: PLACEHOLDER_PHOTO,
  }));

  const created = await Student.insertMany(students);
  console.log(
    `✓ Seeded ${created.length} students (all with card_number + profile_photo)`,
  );
  return created;
}

// ─── 6. Admins ────────────────────────────────────────────────────────────────

async function seedAdmins() {
  const admins = [
    { enroll_number: "ADM001", name: "Dr. Ramesh Kumar" },
    { enroll_number: "ADM002", name: "Prof. Sunita Mishra" },
    { enroll_number: "ADM003", name: "Dr. Anil Patel" },
  ];

  const created = await Admin.insertMany(admins);
  console.log(`✓ Seeded ${created.length} admins`);
  return created;
}

// ─── 7. UserData (hashed passwords) ──────────────────────────────────────────

async function seedUserData(
  students: Array<{ enroll_number: string; email: string }>,
) {
  const studentHash = await bcrypt.hash("password123", 12);
  const adminHash = await bcrypt.hash("adminpass123", 12);

  const studentUsers = students.map((s) => ({
    email_id: s.email,
    password: studentHash,
    enroll_no: s.enroll_number,
  }));

  const adminUsers = [
    {
      email_id: "admin1@college.edu",
      password: adminHash,
      enroll_no: "ADM001",
    },
    {
      email_id: "admin2@college.edu",
      password: adminHash,
      enroll_no: "ADM002",
    },
  ];

  const created = await UserData.insertMany([...studentUsers, ...adminUsers]);
  console.log(
    `✓ Seeded ${created.length} UserData entries (passwords bcrypt-hashed, rounds=12)`,
  );
}

// ─── 8. Punch history + AttendanceRecords ─────────────────────────────────────

async function seedPunchHistory(
  students: Array<{ _id: mongoose.Types.ObjectId; enroll_number: string }>,
  rooms: Array<{
    _id: mongoose.Types.ObjectId;
    scanner_id: string;
    room_number: string;
  }>,
) {
  const DAYS = 14;
  const ATTENDANCE_RATE = 0.85;

  const punches: object[] = [];
  const attendanceMap: Record<string, Date[]> = {};

  for (const student of students) {
    attendanceMap[student.enroll_number] = [];
  }

  for (let offset = 1; offset <= DAYS; offset++) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const dayName = getDayName(date);

    // Skip Sunday for punch history (only Mon–Sat has history)
    if (dayName === "Sunday") continue;

    for (const student of students) {
      if (Math.random() > ATTENDANCE_RATE) continue;

      const room = rooms[Math.floor(Math.random() * Math.min(rooms.length, 3))];
      const inHour = 8 + Math.floor(Math.random() * 2);
      const outHour = 17 + Math.floor(Math.random() * 2);

      punches.push({
        student_id: student._id,
        scanner_id: room.scanner_id,
        punch_type: "in",
        punch_time: daysAgoAt(offset, inHour, Math.floor(Math.random() * 60)),
        location: room.room_number,
        verified: true,
      });

      punches.push({
        student_id: student._id,
        scanner_id: room.scanner_id,
        punch_type: "out",
        punch_time: daysAgoAt(offset, outHour, Math.floor(Math.random() * 60)),
        location: room.room_number,
        verified: true,
      });

      // Record attendance date (UTC midnight)
      const utcDate = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      attendanceMap[student.enroll_number].push(utcDate);
    }
  }

  if (punches.length > 0) {
    await Punch.insertMany(punches);
  }
  console.log(
    `✓ Seeded ${punches.length} punch records (${DAYS} days, ${Math.round(ATTENDANCE_RATE * 100)}% rate)`,
  );

  const attendanceDocs = Object.entries(attendanceMap).map(
    ([enroll_number, present_dates]) => ({ enroll_number, present_dates }),
  );
  if (attendanceDocs.length > 0) {
    await AttendanceRecord.insertMany(attendanceDocs);
  }
  console.log(`✓ Seeded ${attendanceDocs.length} AttendanceRecord documents`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Starting master seed...\n");

  await mongoose.connect(MONGODB_URI!);
  console.log("✓ Connected to MongoDB\n");

  await clearAll();
  console.log();

  const rooms = await seedRooms();
  const courses = await seedCourses();
  await seedTimetable(rooms, courses);
  const students = await seedStudents();
  await seedAdmins();
  await seedUserData(
    students.map((s: { enroll_number: string; email: string }) => ({
      enroll_number: s.enroll_number,
      email: s.email,
    })),
  );
  await seedPunchHistory(
    students.map(
      (s: { _id: mongoose.Types.ObjectId; enroll_number: string }) => ({
        _id: s._id,
        enroll_number: s.enroll_number,
      }),
    ),
    rooms.map(
      (r: {
        _id: mongoose.Types.ObjectId;
        scanner_id: string;
        room_number: string;
      }) => ({
        _id: r._id,
        scanner_id: r.scanner_id,
        room_number: r.room_number,
      }),
    ),
  );

  console.log("\n✅  Master seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Student login   : aarav.kumar.1@college.edu");
  console.log("  Password        : password123");
  console.log("  Card (IoT scan) : CARD-0001  |  Scanner: SCANNER001");
  console.log("  Admin login     : admin1@college.edu");
  console.log("  Admin password  : adminpass123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
