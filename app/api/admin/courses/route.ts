import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";

// GET all courses
export async function GET(request: NextRequest) {
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const year = searchParams.get("year");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};

    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    if (search) {
      query.$or = [
        { course_code: { $regex: search, $options: "i" } },
        { course_name: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
      .sort({ course_code: 1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      courses,
      count: courses.length,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST create a new course
export async function POST(request: NextRequest) {
  const authError = await authenticateAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const body = await request.json();
    const {
      course_code,
      course_name,
      department,
      credits,
      instructor_name,
      instructor_email,
      year,
      semester,
      is_active,
    } = body;

    // Validate required fields
    if (
      !course_code ||
      !course_name ||
      !department ||
      !credits ||
      !year ||
      !semester
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: course_code, course_name, department, credits, year, semester",
        },
        { status: 400 },
      );
    }

    // Check if course code already exists
    const existing = await Course.findOne({
      course_code: course_code.trim().toUpperCase(),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Course with this code already exists" },
        { status: 409 },
      );
    }

    const course = await Course.create({
      course_code: course_code.trim().toUpperCase(),
      course_name: course_name.trim(),
      department: department.trim(),
      credits: Number(credits),
      instructor_name: instructor_name?.trim() || undefined,
      instructor_email: instructor_email?.trim().toLowerCase() || undefined,
      year: Number(year),
      semester: Number(semester),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully",
        course,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating course:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Course with this code already exists" },
        { status: 409 },
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name: string }).name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: "Validation error. Please check your input data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
