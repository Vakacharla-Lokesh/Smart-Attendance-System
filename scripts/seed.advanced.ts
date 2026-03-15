import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Student from "@/models/Student";
import Admin from "@/models/Admin";
import UserData from "@/models/UserData";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";
import Punch from "@/models/Punch";
import AttendanceRecord from "@/models/AttendanceRecord";

interface SeedOptions {
  studentCount?: number;
  dayRange?: number;
  clearCollections?: boolean;
  verbose?: boolean;
}

const DEFAULT_OPTIONS: SeedOptions = {
  studentCount: 8,
  dayRange: 30,
  clearCollections: true,
  verbose: true,
};

const log = (message: string, options: SeedOptions = {}) => {
  if (options.verbose !== false) {
    console.log(message);
  }
};

// Database connection with proper env handling
const connectDB = async (options: SeedOptions = {}) => {
  try {
    // Use the MONGODB_URI from .env.local
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      log("❌ ERROR: MONGODB_URI not found in environment variables", options);
      log("📝 Please add MONGODB_URI to your .env.local file", options);
      log(
        "   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname",
        options,
      );
      process.exit(1);
    }

    log(
      `✓ Connecting to MongoDB: ${mongoUri.replace(/mongodb\+srv:\/\/[^@]+@/, "mongodb+srv://***@")}`,
      options,
    );
    await mongoose.connect(mongoUri);
    log("✓ Connected to MongoDB", options);
  } catch (error) {
    log(`✗ Failed to connect to MongoDB: ${error}`, options);
    process.exit(1);
  }
};

// Hash password with bcrypt (same as auth system)
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Clear all collections
const clearCollections = async (options: SeedOptions = {}) => {
  if (!options.clearCollections) {
    log("⊘ Skipping collection clear", options);
    return;
  }

  try {
    await Student.deleteMany({});
    await Admin.deleteMany({});
    await UserData.deleteMany({});
    await Course.deleteMany({});
    await TimeTable.deleteMany({});
    await Room.deleteMany({});
    await Punch.deleteMany({});
    await AttendanceRecord.deleteMany({});
    log("✓ Cleared all collections", options);
  } catch (error) {
    log(`✗ Failed to clear collections: ${error}`, options);
    throw error;
  }
};

// Generate realistic student data with guaranteed uniqueness
const generateStudentData = (count: number) => {
  const firstNames = [
    "Aarav",
    "Priya",
    "Rahul",
    "Anjali",
    "Vikram",
    "Neha",
    "Arjun",
    "Sakshi",
    "Rohan",
    "Divya",
    "Aditya",
    "Pooja",
    "Harsh",
    "Sneha",
    "Nikhil",
    "Tanvi",
    "Varun",
    "Isha",
    "Karan",
    "Zara",
    "Aryan",
    "Nisha",
    "Sanjay",
    "Preet",
    "Akshay",
    "Riya",
    "Deepak",
    "Sanya",
    "Rohit",
    "Meera",
  ];

  const lastNames = [
    "Kumar",
    "Sharma",
    "Verma",
    "Patel",
    "Singh",
    "Gupta",
    "Menon",
    "Roy",
    "Reddy",
    "Nair",
    "Mishra",
    "Desai",
    "Joshi",
    "Rao",
    "Iyer",
    "Bhat",
    "Das",
    "Pandey",
    "Chopra",
    "Malhotra",
    "Bansal",
    "Kapoor",
    "Srivastava",
    "Dutta",
    "Mukherjee",
    "Saxena",
    "Aggarwal",
    "Bhatt",
    "Krishnan",
    "Pillai",
  ];

  const courses = ["CSE", "ECE", "ME", "CIVIL", "IT"];
  const sections = ["A", "B", "C", "D"];

  const students = [];
  const usedEmails = new Set<string>();

  for (let i = 1; i <= count; i++) {
    let firstName: string;
    let lastName: string;
    let email: string;

    // Generate unique email by combining index with name
    do {
      firstName =
        firstNames[
          (i + Math.floor(Math.random() * firstNames.length)) %
            firstNames.length
        ];
      lastName =
        lastNames[
          (i + Math.floor(Math.random() * lastNames.length)) % lastNames.length
        ];
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@college.edu`;
    } while (usedEmails.has(email));

    usedEmails.add(email);

    const enrollNumber = `STU${String(i).padStart(4, "0")}`;
    const rfidTag = `RFID${String(i).padStart(4, "0")}`;

    students.push({
      enroll_number: enrollNumber,
      name: `${firstName} ${lastName}`,
      email: email,
      phone: `98765${String(43210 + i).slice(-5)}`,
      course: courses[i % courses.length],
      year: ((i - 1) % 4) + 1,
      section: sections[i % sections.length],
      rfid_tag: rfidTag,
      is_active: Math.random() > 0.1, // 90% active
      is_admin: i <= 2, // First 2 are admins
    });
  }

  return students;
};

// Seed students
const seedStudents = async (options: SeedOptions = {}) => {
  const count = options.studentCount || DEFAULT_OPTIONS.studentCount || 8;
  const students = generateStudentData(count);

  try {
    // Validate uniqueness before insert
    const enrollNumbers = new Set(students.map((s) => s.enroll_number));
    const emails = new Set(students.map((s) => s.email));
    const rfidTags = students.filter((s) => s.rfid_tag).map((s) => s.rfid_tag);
    const rfidTagsSet = new Set(rfidTags);

    if (enrollNumbers.size !== students.length) {
      throw new Error("Duplicate enrollment numbers detected");
    }
    if (emails.size !== students.length) {
      throw new Error("Duplicate emails detected");
    }
    if (rfidTagsSet.size !== rfidTags.length) {
      throw new Error("Duplicate RFID tags detected");
    }

    const createdStudents = await Student.insertMany(students);
    log(`✓ Seeded ${createdStudents.length} students`, options);
    return createdStudents;
  } catch (error) {
    log(`✗ Failed to seed students: ${error}`, options);
    throw error;
  }
};

// Seed admin users
const seedAdmins = async (options: SeedOptions = {}) => {
  const admins = [
    { enroll_number: "ADM001", name: "Dr. Ramesh Kumar" },
    { enroll_number: "ADM002", name: "Prof. Sunita Mishra" },
    { enroll_number: "ADM003", name: "Dr. Anil Patel" },
  ];

  try {
    const createdAdmins = await Admin.insertMany(admins);
    log(`✓ Seeded ${createdAdmins.length} admins`, options);
    return createdAdmins;
  } catch (error) {
    log(`✗ Failed to seed admins: ${error}`, options);
    throw error;
  }
};

// Seed user data with HASHED passwords
const seedUserData = async (students: any[], options: SeedOptions = {}) => {
  try {
    // Hash passwords for students
    const studentPassword = await hashPassword("password123");

    const studentUsers = students.slice(0, 5).map((student) => ({
      email_id: student.email,
      password: studentPassword, // ✅ HASHED PASSWORD
      enroll_no: student.enroll_number,
    }));

    // Hash passwords for admins
    const adminPassword = await hashPassword("adminpass123");

    const adminUsers = [
      {
        email_id: "admin1@college.edu",
        password: adminPassword, // ✅ HASHED PASSWORD
        enroll_no: "ADM001",
      },
      {
        email_id: "admin2@college.edu",
        password: adminPassword, // ✅ HASHED PASSWORD
        enroll_no: "ADM002",
      },
    ];

    const allUsers = [...studentUsers, ...adminUsers];

    const createdUsers = await UserData.insertMany(allUsers);
    log(
      `✓ Seeded ${createdUsers.length} user credentials (passwords hashed with bcrypt)`,
      options,
    );
    log(`  📧 Sample student login:`, options);
    log(`     Email: ${studentUsers[0].email_id}`, options);
    log(`     Password: password123`, options);
    log(`  📧 Sample admin login:`, options);
    log(`     Email: admin1@college.edu`, options);
    log(`     Password: adminpass123`, options);
    return createdUsers;
  } catch (error) {
    log(`✗ Failed to seed user data: ${error}`, options);
    throw error;
  }
};

// Seed courses
const seedCourses = async (options: SeedOptions = {}) => {
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

  try {
    const createdCourses = await Course.insertMany(courses);
    log(`✓ Seeded ${createdCourses.length} courses`, options);
    return createdCourses;
  } catch (error) {
    log(`✗ Failed to seed courses: ${error}`, options);
    throw error;
  }
};

// Seed timetables
const seedTimeTables = async (options: SeedOptions = {}) => {
  const courses = await Course.find().limit(5);

  const timeTables = [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    { start: "09:00", end: "10:30" },
    { start: "11:00", end: "12:30" },
    { start: "14:00", end: "15:30" },
    { start: "16:00", end: "17:30" },
  ];

  let roomCounter = 101;

  for (const course of courses) {
    for (const day of days.slice(0, 2)) {
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      timeTables.push({
        course_id: course._id.toString(),
        day,
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        room_number: String(roomCounter),
      });
      roomCounter++;
    }
  }

  try {
    const createdTimeTables = await TimeTable.insertMany(timeTables);
    log(`✓ Seeded ${createdTimeTables.length} timetable entries`, options);
    return createdTimeTables;
  } catch (error) {
    log(`✗ Failed to seed timetables: ${error}`, options);
    throw error;
  }
};

// Seed rooms
const seedRooms = async (options: SeedOptions = {}) => {
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
      room_number: "LAB101",
      building: "Lab Building",
      floor: "1st Floor",
      scanner_id: "SCANNER006",
      latitude: 28.6144,
      longitude: 77.2095,
      geofence_radius: 75,
    },
  ];

  try {
    const createdRooms = await Room.insertMany(rooms);
    log(`✓ Seeded ${createdRooms.length} rooms`, options);
    return createdRooms;
  } catch (error) {
    log(`✗ Failed to seed rooms: ${error}`, options);
    throw error;
  }
};

// Seed punch records
const seedPunchRecords = async (options: SeedOptions = {}) => {
  const students = await Student.find().limit(
    Math.min(options.studentCount || 8, 20),
  );
  const rooms = await Room.find().limit(3);
  const dayRange = options.dayRange || DEFAULT_OPTIONS.dayRange || 30;

  const punchRecords = [];

  for (let dayOffset = 0; dayOffset < dayRange; dayOffset++) {
    // Skip weekends
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const student of students) {
      // 85% attendance rate
      if (Math.random() > 0.85) continue;

      const inTime = new Date(date);
      inTime.setHours(
        8 + Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      const room = rooms[Math.floor(Math.random() * rooms.length)];

      punchRecords.push({
        student_id: student._id,
        scanner_id: room.scanner_id,
        punch_type: "in",
        punch_time: inTime,
        location: room.room_number,
        verified: true,
      });

      // Out punch
      const outTime = new Date(inTime);
      outTime.setHours(
        17 + Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      punchRecords.push({
        student_id: student._id,
        scanner_id: room.scanner_id,
        punch_type: "out",
        punch_time: outTime,
        location: room.room_number,
        verified: true,
      });
    }
  }

  try {
    const createdPunches = await Punch.insertMany(punchRecords);
    log(`✓ Seeded ${createdPunches.length} punch records`, options);
    return createdPunches;
  } catch (error) {
    log(`✗ Failed to seed punch records: ${error}`, options);
    throw error;
  }
};

// Seed attendance records
const seedAttendanceRecords = async (options: SeedOptions = {}) => {
  const students = await Student.find();

  const attendanceRecords = [];

  for (const student of students) {
    const presentDates = [];
    const dayRange = options.dayRange || DEFAULT_OPTIONS.dayRange || 30;

    // Generate attendance for 85% of days
    for (let i = 0; i < dayRange; i++) {
      if (Math.random() > 0.85) continue; // 85% attendance

      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        presentDates.push(date);
      }
    }

    attendanceRecords.push({
      enroll_number: student.enroll_number,
      present_dates: presentDates,
    });
  }

  try {
    const createdRecords = await AttendanceRecord.insertMany(attendanceRecords);
    log(`✓ Seeded ${createdRecords.length} attendance records`, options);
    return createdRecords;
  } catch (error) {
    log(`✗ Failed to seed attendance records: ${error}`, options);
    throw error;
  }
};

// Main seed function
export const seed = async (options: SeedOptions = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  log("\n🌱 Starting database seed...\n", mergedOptions);

  try {
    await connectDB(mergedOptions);
    await clearCollections(mergedOptions);

    const students = await seedStudents(mergedOptions);
    await seedAdmins(mergedOptions);
    await seedUserData(students, mergedOptions);
    await seedCourses(mergedOptions);
    await seedTimeTables(mergedOptions);
    await seedRooms(mergedOptions);
    await seedPunchRecords(mergedOptions);
    await seedAttendanceRecords(mergedOptions);

    log("\n✅ Database seeding completed successfully!\n", mergedOptions);
  } catch (error) {
    log(`\n❌ Database seeding failed: ${error}`, mergedOptions);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log("✓ Disconnected from MongoDB\n", mergedOptions);
  }
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    studentCount: parseInt(args[0]) || 8,
    dayRange: parseInt(args[1]) || 30,
    clearCollections: args[2] !== "false",
    verbose: true,
  };

  seed(options);
}

export default seed;
