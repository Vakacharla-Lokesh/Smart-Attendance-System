// app/api/admin/timetables/route.ts
import { NextResponse } from "next/server";
import { withAdmin, AdminRequest } from "@/lib/admin-auth";
import connectDB from "@/lib/mongodb";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room";
import Course from "@/models/Course";

/**
 * GET /api/admin/timetables
 * Get all timetables with optional filters
 */
export const GET = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const room_id = url.searchParams.get("room_id");
    const course_id = url.searchParams.get("course_id");
    const day = url.searchParams.get("day");

    const query: any = {};

    if (room_id) query.room_id = room_id;
    if (course_id) query.course_id = course_id;
    if (day) query.day = day;

    const timetables = await TimeTable.find(query)
      .populate("room_id", "room_number building floor")
      .populate("course_id", "course_code course_name instructor_name")
      .sort({ day: 1, start_time: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      timetables,
    });
  } catch (error) {
    console.error("Get timetables error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetables" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/admin/timetables
 * Create a new timetable entry
 */
export const POST = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { room_id, course_id, day, start_time, end_time } = body;

    // Validate required fields
    if (!room_id || !course_id || !day || !start_time || !end_time) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: room_id, course_id, day, start_time, end_time",
        },
        { status: 400 },
      );
    }

    // Validate day
    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    if (!validDays.includes(day)) {
      return NextResponse.json(
        { error: "Invalid day. Must be Monday-Sunday" },
        { status: 400 },
      );
    }

    // Verify room exists
    const room = await Room.findById(room_id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify course exists
    const course = await Course.findById(course_id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Parse times
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    // Validate time range
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 },
      );
    }

    // Check for overlapping timetables in the same room
    const overlapping = await TimeTable.findOne({
      room_id,
      day,
      $or: [
        {
          // New class starts during existing class
          start_time: { $lte: startTime },
          end_time: { $gt: startTime },
        },
        {
          // New class ends during existing class
          start_time: { $lt: endTime },
          end_time: { $gte: endTime },
        },
        {
          // New class completely contains existing class
          start_time: { $gte: startTime },
          end_time: { $lte: endTime },
        },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        {
          error: "Time slot conflicts with existing timetable in this room",
          conflicting_entry: overlapping,
        },
        { status: 409 },
      );
    }

    // Create timetable
    const timetable = await TimeTable.create({
      room_id,
      course_id,
      day,
      start_time: startTime,
      end_time: endTime,
    });

    // Populate and return
    const populatedTimetable = await TimeTable.findById(timetable._id)
      .populate("room_id", "room_number building floor")
      .populate("course_id", "course_code course_name instructor_name")
      .lean()
      .exec();

    return NextResponse.json(
      {
        success: true,
        message: "Timetable created successfully",
        timetable: populatedTimetable,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create timetable error:", error);
    return NextResponse.json(
      { error: "Failed to create timetable" },
      { status: 500 },
    );
  }
});
