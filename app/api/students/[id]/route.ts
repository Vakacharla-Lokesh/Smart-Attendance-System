import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import mongoose from "mongoose";
import Punch from "@/models/Punch";
import Course from "@/models/Course";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await dbConnect();

    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { enroll_number: id };
    const student =
      await Student.findOne(query).lean<Record<string, unknown>>();

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    const recentPunches = await Punch.find({ student_id: student._id })
      .sort({ punch_time: -1 })
      .limit(10)
      .lean();

    // Fetch related courses for the student (matched by department = student.course & year)
    let enrolled_courses: unknown[] = [];
    const studentCourse = student.course as string | undefined;
    const studentYear = student.year as number | undefined;
    if (studentCourse && studentYear) {
      enrolled_courses = await Course.find({
        department: studentCourse,
        year: studentYear,
      }).lean();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        recentPunches,
        enrolled_courses,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch student",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await dbConnect();

    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;

    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { enroll_number: id };
    const student = await Student.findOneAndUpdate(
      query,
      { $set: body },
      { new: true, runValidators: true },
    );

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error updating student:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate entry detected",
          message: error.message ?? "Duplicate entry",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update student",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await dbConnect();

    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { enroll_number: id };
    const student = await Student.findOneAndDelete(query);

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    // Optionally delete associated punches
    await Punch.deleteMany({ student_id: id });

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete student",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
