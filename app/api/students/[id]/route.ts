import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Punch from "@/models/Punch";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const { id } = params;

    const student = await Student.findById(id).lean();

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    // Get recent punches for this student
    const recentPunches = await Punch.find({ student_id: id })
      .sort({ punch_time: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        recentPunches,
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const { id } = params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;

    const student = await Student.findByIdAndUpdate(
      id,
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
  } catch (error: any) {
    console.error("Error updating student:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate entry detected",
          message: error.message,
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const { id } = params;

    const student = await Student.findByIdAndDelete(id);

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
