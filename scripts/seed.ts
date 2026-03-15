import mongoose from "mongoose";
import Student from "@/models/Student";
import Admin from "@/models/Admin";
import UserData from "@/models/UserData";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";
import Punch from "@/models/Punch";
import AttendanceRecord from "@/models/AttendanceRecord";

// Database connection
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/smart-attendance";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// Clear all collections
const clearCollections = async () => {
  try {
    await Student.deleteMany({});
    await Admin.deleteMany({});
    await UserData.deleteMany({});
    await Course.deleteMany({});
    await TimeTable.deleteMany({});
    await Room.deleteMany({});
    await Punch.deleteMany({});
    await AttendanceRecord.deleteMany({});
    console.log("✓ Cleared all collections");
  } catch (error) {
    console.error("✗ Failed to clear collections:", error);
    throw error;
  }
};

// Seed students
const seedStudents = async () => {
  const students = [
    {
      enroll_number: "STU001",
      name: "Aarav Kumar",
      email: "aarav.kumar@college.edu",
      phone: "9876543210",
      course: "CSE",
      year: 2,
      section: "A",
      rfid_tag: "RFID001",
      is_active: true,
      is_admin: false,
    },
    {
      enroll_number: "STU002",
      name: "Priya Sharma",
      email: "priya.sharma@college.edu",
      phone: "9876543211",
      course: "CSE",
      year: 2,
      section: "A",
      rfid_tag: "RFID002",
      is_active: true,
      is_admin: false,
    },
    {
      enroll_number: "STU003",
      name: "Rahul Verma",
      email: "rahul.verma@college.edu",
      phone: "9876543212",
      course: "ECE",
      year: 2,
      section: "B",
      rfid_tag: "RFID003",
      is_active: true,
      is_admin: false,
    },
    {
      enroll_number: "STU004",
      name: "Anjali Patel",
      email: "anjali.patel@college.edu",
      phone: "9876543213",
      course: "CSE",
      year: 1,
      section: "A",
      rfid_tag: "RFID004",
      is_active: true,
      is_admin: false,
    },
    {
      enroll_number: "STU005",
      name: "Vikram Singh",
      email: "vikram.singh@college.edu",
      phone: "9876543214",
      course: "ECE",
      year: 3,
      section: "C",
      rfid_tag: "RFID005",
      is_active: true,
      is_admin: false,
    },
    {
      enroll_number: "STU006",
      name: "Neha Gupta",
      email: "neha.gupta@college.edu",
      phone: "9876543215",
      course: "CSE",
      year: 2,
      section: "A",
      rfid_tag: "RFID006",
      is_active: true,
      is_admin: true,
    },
    {
      enroll_number: "STU007",
      name: "Arjun Menon",
      email: "arjun.menon@college.edu",
      phone: "9876543216",
      course: "ME",
      year: 2,
      section: "B",
      rfid_tag: "RFID007",
      is_active: true,
      is_admin: false,
    },
    {
      enroll_number: "STU008",
      name: "Sakshi Roy",
      email: "sakshi.roy@college.edu",
      phone: "9876543217",
      course: "CSE",
      year: 1,
      section: "B",
      rfid_tag: "RFID008",
      is_active: false,
      is_admin: false,
    },
  ];

  try {
    const createdStudents = await Student.insertMany(students);
    console.log(`✓ Seeded ${createdStudents.length} students`);
    return createdStudents;
  } catch (error) {
    console.error("✗ Failed to seed students:", error);
    throw error;
  }
};

// Seed admin users
const seedAdmins = async () => {
  const admins = [
    {
      enroll_number: "ADM001",
      name: "Dr. Ramesh Kumar",
    },
    {
      enroll_number: "ADM002",
      name: "Prof. Sunita Mishra",
    },
    {
      enroll_number: "ADM003",
      name: "Dr. Anil Patel",
    },
  ];

  try {
    const createdAdmins = await Admin.insertMany(admins);
    console.log(`✓ Seeded ${createdAdmins.length} admins`);
    return createdAdmins;
  } catch (error) {
    console.error("✗ Failed to seed admins:", error);
    throw error;
  }
};

// Seed user data (login credentials)
const seedUserData = async () => {
  const users = [
    {
      email_id: "aarav.kumar@college.edu",
      password: "password123", // Note: In production, this should be hashed
      enroll_no: "STU001",
    },
    {
      email_id: "priya.sharma@college.edu",
      password: "password123",
      enroll_no: "STU002",
    },
    {
      email_id: "rahul.verma@college.edu",
      password: "password123",
      enroll_no: "STU003",
    },
    {
      email_id: "admin1@college.edu",
      password: "adminpass123",
      enroll_no: "ADM001",
    },
    {
      email_id: "admin2@college.edu",
      password: "adminpass123",
      enroll_no: "ADM002",
    },
  ];

  try {
    const createdUsers = await UserData.insertMany(users);
    console.log(`✓ Seeded ${createdUsers.length} user credentials`);
    return createdUsers;
  } catch (error) {
    console.error("✗ Failed to seed user data:", error);
    throw error;
  }
};

// Seed courses
const seedCourses = async () => {
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
    console.log(`✓ Seeded ${createdCourses.length} courses`);
    return createdCourses;
  } catch (error) {
    console.error("✗ Failed to seed courses:", error);
    throw error;
  }
};

// Seed timetables
const seedTimeTables = async () => {
  const courses = await Course.find().limit(5);

  const timeTables = [
    {
      course_id: courses[0]._id.toString(),
      day: "Monday",
      start_time: "09:00",
      end_time: "10:30",
      room_number: "101",
    },
    {
      course_id: courses[0]._id.toString(),
      day: "Wednesday",
      start_time: "09:00",
      end_time: "10:30",
      room_number: "101",
    },
    {
      course_id: courses[1]._id.toString(),
      day: "Tuesday",
      start_time: "11:00",
      end_time: "12:30",
      room_number: "202",
    },
    {
      course_id: courses[1]._id.toString(),
      day: "Thursday",
      start_time: "11:00",
      end_time: "12:30",
      room_number: "202",
    },
    {
      course_id: courses[2]._id.toString(),
      day: "Monday",
      start_time: "14:00",
      end_time: "15:30",
      room_number: "303",
    },
    {
      course_id: courses[2]._id.toString(),
      day: "Friday",
      start_time: "14:00",
      end_time: "15:30",
      room_number: "303",
    },
  ];

  try {
    const createdTimeTables = await TimeTable.insertMany(timeTables);
    console.log(`✓ Seeded ${createdTimeTables.length} timetable entries`);
    return createdTimeTables;
  } catch (error) {
    console.error("✗ Failed to seed timetables:", error);
    throw error;
  }
};

// Seed rooms with scanners
const seedRooms = async () => {
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
      room_number: "202",
      building: "Main Building",
      floor: "2nd Floor",
      scanner_id: "SCANNER002",
      latitude: 28.614,
      longitude: 77.2091,
      geofence_radius: 50,
    },
    {
      room_number: "303",
      building: "Annex Building",
      floor: "3rd Floor",
      scanner_id: "SCANNER003",
      latitude: 28.6141,
      longitude: 77.2092,
      geofence_radius: 50,
    },
    {
      room_number: "104",
      building: "Lab Building",
      floor: "1st Floor",
      scanner_id: "SCANNER004",
      latitude: 28.6142,
      longitude: 77.2093,
      geofence_radius: 50,
    },
  ];

  try {
    const createdRooms = await Room.insertMany(rooms);
    console.log(`✓ Seeded ${createdRooms.length} rooms`);
    return createdRooms;
  } catch (error) {
    console.error("✗ Failed to seed rooms:", error);
    throw error;
  }
};

// Seed punch records (attendance)
const seedPunchRecords = async () => {
  const students = await Student.find().limit(5);
  const rooms = await Room.find().limit(2);

  const punchRecords = [];

  // Generate punch records for the past 10 days
  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    for (const student of students) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(9, 0, 0, 0);

      punchRecords.push({
        student_id: student._id,
        scanner_id: rooms[dayOffset % rooms.length].scanner_id,
        punch_type: "in",
        punch_time: date,
        location: rooms[dayOffset % rooms.length].room_number,
        verified: true,
      });

      const exitTime = new Date(date);
      exitTime.setHours(17, 0, 0, 0);

      punchRecords.push({
        student_id: student._id,
        scanner_id: rooms[dayOffset % rooms.length].scanner_id,
        punch_type: "out",
        punch_time: exitTime,
        location: rooms[dayOffset % rooms.length].room_number,
        verified: true,
      });
    }
  }

  try {
    const createdPunches = await Punch.insertMany(punchRecords);
    console.log(`✓ Seeded ${createdPunches.length} punch records`);
    return createdPunches;
  } catch (error) {
    console.error("✗ Failed to seed punch records:", error);
    throw error;
  }
};

// Seed attendance records
const seedAttendanceRecords = async () => {
  const students = await Student.find().limit(6);

  const attendanceRecords = [];

  for (const student of students) {
    const presentDates = [];

    // Generate 20 random attendance dates in the past 30 days
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      date.setHours(0, 0, 0, 0);
      presentDates.push(date);
    }

    attendanceRecords.push({
      enroll_number: student.enroll_number,
      present_dates: presentDates,
    });
  }

  try {
    const createdRecords = await AttendanceRecord.insertMany(attendanceRecords);
    console.log(`✓ Seeded ${createdRecords.length} attendance records`);
    return createdRecords;
  } catch (error) {
    console.error("✗ Failed to seed attendance records:", error);
    throw error;
  }
};

// Main seed function
const seed = async () => {
  console.log("\n🌱 Starting database seed...\n");

  try {
    await connectDB();
    await clearCollections();

    await seedStudents();
    await seedAdmins();
    await seedUserData();
    await seedCourses();
    await seedTimeTables();
    await seedRooms();
    await seedPunchRecords();
    await seedAttendanceRecords();

    console.log("\n✅ Database seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Database seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run seed
seed();
