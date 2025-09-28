import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import UserData from "@/models/UserData";
import { formatStudentResponse, validateRequiredFields } from "@/lib/db-utils";

// GET student by enrollment number
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params since they're now a Promise in newer Next.js versions
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 }
      );
    }

    await connectDB();

    const student = await Student.findOne({
      enroll_number: id.trim(),
    })
      .select("-__v")
      .lean()
      .exec();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(formatStudentResponse(student));
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update student
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params since they're now a Promise in newer Next.js versions
    const { id } = await context.params;
    const body = await request.json();
    const { name, card_number } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateRequiredFields(body, ["name"]);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    if (typeof name !== "string") {
      return NextResponse.json(
        { error: "Name must be a string" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if student exists
    const existingStudent = await Student.findOne({
      enroll_number: id.trim(),
    }).exec();

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update student
    const updatedStudent = await Student.findOneAndUpdate(
      { enroll_number: id.trim() },
      {
        name: name.trim(),
        card_number: card_number
          ? card_number.trim()
          : existingStudent.card_number,
      },
      { new: true }
    )
      .select("-__v")
      .lean()
      .exec();

    if (!updatedStudent) {
      return NextResponse.json(
        { error: "Failed to update student" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Student updated successfully",
      student: formatStudentResponse(updatedStudent),
    });
  } catch (error) {
    console.error("Error updating student:", error);

    // Handle mongoose validation errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: "Validation error: Please check your input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE student
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params since they're now a Promise in newer Next.js versions
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and delete student
    const deletedStudent = await Student.findOneAndDelete({
      enroll_number: id.trim(),
    }).exec();

    if (!deletedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Also delete associated user account if it exists
    try {
      await UserData.findOneAndDelete({
        enroll_no: id.trim(),
      }).exec();
    } catch (userError) {
      // Log but don't fail if user deletion fails
      console.warn("Could not delete associated user account:", userError);
    }

    return NextResponse.json({
      message: "Student deleted successfully",
      deletedStudent: {
        id: deletedStudent._id.toString(),
        enroll_number: deletedStudent.enroll_number,
        name: deletedStudent.name,
      },
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
