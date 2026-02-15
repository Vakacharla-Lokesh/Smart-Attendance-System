import { NextResponse } from "next/server";
import { authenticateAdmin, AdminRequest } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";

// GET single course
export async function GET(
  request: AdminRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params; // ← AWAIT params

  try {
    await connectDB();

    const course = await Course.findById(id).lean().exec();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT update course
export async function PUT(
  request: AdminRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params; // ← AWAIT params

  try {
    await connectDB();

    const body = await request.json();
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).exec();

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE course
export async function DELETE(
  request: AdminRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  const { id } = await params; // ← AWAIT params

  try {
    await connectDB();

    const deletedCourse = await Course.findByIdAndDelete(id).exec();

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
