import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";
import Room from "@/models/Room"; // to populate room info
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enroll_no = searchParams.get("enroll_no");

    if (!enroll_no) {
      return NextResponse.json(
        { success: false, error: "Enrollment number is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify room is registered
    if (!mongoose.models.Room) {
      mongoose.model("Room", new mongoose.Schema({})); 
    }

    // Find student
    const student = await Student.findOne({ enroll_number: enroll_no }).lean();
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Find enrolled courses based on department and year
    const enrolled_courses = await Course.find({
      department: student.course,
      year: student.year,
    }).lean();

    const courseIds = enrolled_courses.map((c) => c._id);

    // Find timetables for these courses
    const timetables = await TimeTable.find({
      course_id: { $in: courseIds },
    })
      .populate("course_id", "course_code course_name course")
      .populate("room_id", "room_number building")
      .lean();

    return NextResponse.json({ success: true, timetables });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
