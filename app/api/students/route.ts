// FILE: app/api/students/route.js
// API Route: GET /api/students - Fetch all students with filters
// API Route: POST /api/students - Create a new student

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const course = searchParams.get("course");
    const year = searchParams.get("year");
    const section = searchParams.get("section");

    let query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { enroll_number: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (course) query.course = course;
    if (year) query.year = parseInt(year);
    if (section) query.section = section;

    const students = await Student.find(query)
      .select(
        "enroll_number name email phone course year section rfid_tag is_active",
      )
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "enroll_number",
      "name",
      "email",
      "phone",
      "course",
      "year",
      "section",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        );
      }
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ enroll_number: body.enroll_number }, { email: body.email }],
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: "Student with this enrollment number or email already exists",
        },
        { status: 409 },
      );
    }

    const student = await Student.create(body);

    return NextResponse.json(
      {
        success: true,
        data: student,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating student:", error);

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
        error: "Failed to create student",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
