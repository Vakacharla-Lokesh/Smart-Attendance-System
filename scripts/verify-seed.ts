import mongoose from "mongoose";
import Student from "@/models/Student";
import Admin from "@/models/Admin";
import UserData from "@/models/UserData";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";
import Punch from "@/models/Punch";
import AttendanceRecord from "@/models/AttendanceRecord";

interface DataStats {
  collection: string;
  count: number;
  sample?: any;
}

// Connect to database
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/smart-attendance";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB\n");
  } catch (error) {
    console.error("✗ Failed to connect:", error);
    process.exit(1);
  }
};

// Get stats for all collections
const getCollectionStats = async (): Promise<DataStats[]> => {
  const stats: DataStats[] = [];

  const collections = [
    { model: Student, name: "Student" },
    { model: Admin, name: "Admin" },
    { model: UserData, name: "UserData" },
    { model: Course, name: "Course" },
    { model: TimeTable, name: "TimeTable" },
    { model: Room, name: "Room" },
    { model: Punch, name: "Punch" },
    { model: AttendanceRecord, name: "AttendanceRecord" },
  ];

  for (const { model, name } of collections) {
    try {
      const count = await model.countDocuments();
      const sample = await model.findOne();
      stats.push({ collection: name, count, sample });
    } catch (error) {
      stats.push({ collection: name, count: 0, sample: null });
    }
  }

  return stats;
};

// Display statistics
const displayStats = (stats: DataStats[]) => {
  console.log("📊 DATABASE STATISTICS\n");
  console.log("Collection         | Count");
  console.log("-------------------|-------");

  let totalRecords = 0;

  for (const stat of stats) {
    const paddedName = stat.collection.padEnd(17);
    console.log(`${paddedName} | ${stat.count}`);
    totalRecords += stat.count;
  }

  console.log("================|=======");
  console.log(`TOTAL            | ${totalRecords}\n`);
};

// Display detailed breakdown
const displayDetailedBreakdown = async () => {
  console.log("📋 DETAILED BREAKDOWN\n");

  // Students
  const studentCount = await Student.countDocuments();
  const activeStudents = await Student.countDocuments({ is_active: true });
  const adminStudents = await Student.countDocuments({ is_admin: true });

  console.log("👥 STUDENTS:");
  console.log(`   Total: ${studentCount}`);
  console.log(`   Active: ${activeStudents}`);
  console.log(`   Admin: ${adminStudents}\n`);

  // Courses
  const courseCount = await Course.countDocuments();
  const activeCourses = await Course.countDocuments({ is_active: true });
  const coursesByDept = await Course.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 } } },
  ]);

  console.log("📚 COURSES:");
  console.log(`   Total: ${courseCount}`);
  console.log(`   Active: ${activeCourses}`);
  console.log(`   By Department:`);
  for (const dept of coursesByDept) {
    console.log(`     ${dept._id}: ${dept.count}`);
  }
  console.log();

  // Rooms
  const roomCount = await Room.countDocuments();
  console.log("🏛️ ROOMS:");
  console.log(`   Total: ${roomCount}`);
  console.log(`   Scanner Coverage: ${roomCount} (1:1)\n`);

  // Punch Records
  const punchCount = await Punch.countDocuments();
  const inPunches = await Punch.countDocuments({ punch_type: "in" });
  const outPunches = await Punch.countDocuments({ punch_type: "out" });

  console.log("✋ PUNCH RECORDS:");
  console.log(`   Total: ${punchCount}`);
  console.log(`   Check-In: ${inPunches}`);
  console.log(`   Check-Out: ${outPunches}\n`);

  // Attendance Records
  const attendanceCount = await AttendanceRecord.countDocuments();
  const avgAttendance = await AttendanceRecord.aggregate([
    { $project: { presentCount: { $size: "$present_dates" } } },
    { $group: { _id: null, avg: { $avg: "$presentCount" } } },
  ]);

  console.log("📅 ATTENDANCE:");
  console.log(`   Records: ${attendanceCount}`);
  console.log(
    `   Avg Days Attended: ${avgAttendance[0]?.avg.toFixed(1) || 0}\n`,
  );

  // User Credentials
  const userCount = await UserData.countDocuments();
  console.log("🔐 USER CREDENTIALS:");
  console.log(`   Total: ${userCount}\n`);
};

// Check data integrity
const checkIntegrity = async () => {
  console.log("🔍 DATA INTEGRITY CHECK\n");

  const issues: string[] = [];

  // Check for duplicate enrollments
  const duplicateEnrolls = await Student.aggregate([
    { $group: { _id: "$enroll_number", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicateEnrolls.length > 0) {
    issues.push(
      `⚠️  Duplicate student enrollments: ${duplicateEnrolls.length}`,
    );
  }

  // Check for orphaned punch records
  const allStudentIds = await Student.distinct("_id");
  const orphanedPunches = await Punch.countDocuments({
    student_id: { $nin: allStudentIds },
  });

  if (orphanedPunches > 0) {
    issues.push(`⚠️  Orphaned punch records: ${orphanedPunches}`);
  }

  // Check for missing user credentials
  const students = await Student.find({ is_active: true });
  const missingCreds = [];

  for (const student of students.slice(0, 5)) {
    const user = await UserData.findOne({ enroll_no: student.enroll_number });
    if (!user) {
      missingCreds.push(student.enroll_number);
    }
  }

  if (missingCreds.length > 0) {
    issues.push(
      `⚠️  Students missing user credentials: ${missingCreds.join(", ")}`,
    );
  }

  // Check room scanner IDs
  const rooms = await Room.find();
  const scannerIds = new Set(rooms.map((r) => r.scanner_id));
  const punches = await Punch.distinct("scanner_id");
  const invalidScanners = punches.filter((s) => !scannerIds.has(s));

  if (invalidScanners.length > 0) {
    issues.push(
      `⚠️  Unknown scanner IDs in punch records: ${invalidScanners.join(", ")}`,
    );
  }

  if (issues.length === 0) {
    console.log("✅ All integrity checks passed!\n");
  } else {
    console.log("Issues found:");
    issues.forEach((issue) => console.log(`   ${issue}`));
    console.log();
  }
};

// Show sample records
const showSamples = async () => {
  console.log("📝 SAMPLE RECORDS\n");

  // Sample student
  const student = await Student.findOne();
  if (student) {
    console.log("👤 Sample Student:");
    console.log(`   ${JSON.stringify(student.toJSON(), null, 2)}\n`);
  }

  // Sample punch
  const punch = await Punch.findOne().lean();
  if (punch) {
    console.log("✋ Sample Punch Record:");
    console.log(`   ${JSON.stringify(punch, null, 2)}\n`);
  }

  // Sample course
  const course = await Course.findOne();
  if (course) {
    console.log("📚 Sample Course:");
    console.log(`   ${JSON.stringify(course.toJSON(), null, 2)}\n`);
  }

  // Sample room
  const room = await Room.findOne();
  if (room) {
    console.log("🏛️ Sample Room:");
    console.log(`   ${JSON.stringify(room.toJSON(), null, 2)}\n`);
  }
};

// Generate quick queries
const generateQuickQueries = () => {
  console.log("🔎 USEFUL QUERIES FOR TESTING\n");

  const queries = [
    {
      title: "Get all active students",
      query: "Student.find({ is_active: true })",
    },
    {
      title: "Get punch records for a student today",
      query:
        "Punch.find({ student_id: studentId, punch_time: { $gte: startOfDay } })",
    },
    {
      title: "Check attendance for last 7 days",
      query: "AttendanceRecord.findOne({ enroll_number: 'STU001' })",
    },
    {
      title: "Get all scanner locations",
      query:
        "Room.find({}, { room_number: 1, scanner_id: 1, latitude: 1, longitude: 1 })",
    },
    {
      title: "Find students in a course/section",
      query: "Student.find({ course: 'CSE', section: 'A' })",
    },
    {
      title: "Get course schedule",
      query: "TimeTable.find({ course_id: courseId }).sort({ day: 1 })",
    },
    {
      title: "Verify geofence validation",
      query:
        "Room.findOne({ scanner_id: 'SCANNER001' }) // Check lat/long/radius",
    },
  ];

  for (const { title, query } of queries) {
    console.log(`${title}:`);
    console.log(`   ${query}\n`);
  }
};

// Main function
const verify = async () => {
  console.log("\n═══════════════════════════════════════════════════\n");
  console.log("     🔧 SMART ATTENDANCE - DATA VERIFICATION\n");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    await connectDB();

    const stats = await getCollectionStats();
    displayStats(stats);

    await displayDetailedBreakdown();

    await checkIntegrity();

    await showSamples();

    generateQuickQueries();

    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  verify();
}

export default verify;
