import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";

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

const seedTimeTables = async () => {
  console.log("Clearing existing TimeTable entries...");
  await TimeTable.deleteMany({});

  // Fetch some courses and rooms
  const courses = await Course.find().limit(5);
  const rooms = await Room.find().limit(2);

  if (courses.length === 0 || rooms.length === 0) {
    console.error(
      "✗ No courses or rooms found. Please run the full seed script first.",
    );
    return;
  }

  // Helper to create date object for time using local time (like the frontend does)
  const createTime = (hour: number) => {
    const now = new Date();
    // This parses using the local timezone, ensuring it matches what the frontend expects
    return new Date(now.toDateString() + " " + hour.toString().padStart(2, "0") + ":00:00");
  };

  const timeTables = [
    // Monday
    {
      course_id: courses[0]._id,
      day: "Monday",
      start_time: createTime(9),
      end_time: createTime(10),
      room_id: rooms[0]._id,
    },
    {
      course_id: courses[1]._id,
      day: "Monday",
      start_time: createTime(10),
      end_time: createTime(11),
      room_id: rooms[0]._id,
    },
    // Break 11-12
    {
      course_id: courses[2]._id,
      day: "Monday",
      start_time: createTime(12),
      end_time: createTime(13),
      room_id: rooms[0]._id,
    },
    // Empty 1-2 PM

    // Tuesday
    {
      course_id: courses[3]._id,
      day: "Tuesday",
      start_time: createTime(9),
      end_time: createTime(10),
      room_id: rooms[1]._id,
    },
    // Empty 10-11
    {
      course_id: courses[4]?._id || courses[0]._id,
      day: "Tuesday",
      start_time: createTime(11),
      end_time: createTime(12),
      room_id: rooms[1]._id,
    },
    {
      course_id: courses[1]._id,
      day: "Tuesday",
      start_time: createTime(13),
      end_time: createTime(14), // 1 PM - 2 PM
      room_id: rooms[1]._id,
    },

    // Wednesday
    {
      course_id: courses[2]._id,
      day: "Wednesday",
      start_time: createTime(10),
      end_time: createTime(11),
      room_id: rooms[0]._id,
    },
    {
      course_id: courses[3]._id,
      day: "Wednesday",
      start_time: createTime(11),
      end_time: createTime(12),
      room_id: rooms[0]._id,
    },
    // Empty rest of Wednesday

    // Thursday
    {
      course_id: courses[0]._id,
      day: "Thursday",
      start_time: createTime(9),
      end_time: createTime(10),
      room_id: rooms[1]._id,
    },
    {
      course_id: courses[4]?._id || courses[2]._id,
      day: "Thursday",
      start_time: createTime(12),
      end_time: createTime(13),
      room_id: rooms[1]._id,
    },
    
    // Friday
    {
      course_id: courses[1]._id,
      day: "Friday",
      start_time: createTime(10),
      end_time: createTime(11),
      room_id: rooms[0]._id,
    },
    // Break 11-1
    {
      course_id: courses[3]._id,
      day: "Friday",
      start_time: createTime(13),
      end_time: createTime(14),
      room_id: rooms[0]._id,
    },
  ];

  try {
    const createdTimeTables = await TimeTable.insertMany(timeTables);
    console.log(`✓ Seeded ${createdTimeTables.length} timetable entries with breaks and empty slots.`);
    return createdTimeTables;
  } catch (error) {
    console.error("✗ Failed to seed timetables:", error);
    throw error;
  }
};

const run = async () => {
  console.log("\n🌱 Starting timetable seed (Testing version)...\n");

  try {
    await connectDB();
    await seedTimeTables();
    console.log("\n✅ Timetable test seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Timetable seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run seed
run();
