import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import { formatStudentResponse, validateRequiredFields } from "@/lib/db-utils";

// Interface for request with potential user info
interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email_id: string;
    enroll_no: string;
  };
}

// Simple error handler
function handleError(error: unknown) {
  console.error("API Error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// GET all students
export async function GET(_request: AuthRequest) {
  try {
    await connectDB();

    const students = await Student.find({})
      .select("enroll_number name card_number createdAt updatedAt")
      .lean()
      .exec();

    // Transform the data using our utility function
    const formattedStudents = students.map((student) =>
      formatStudentResponse(student)
    );

    return NextResponse.json(formattedStudents);
  } catch (error) {
    return handleError(error);
  }
}

// POST new student
export async function POST(request: AuthRequest) {
  try {
    const body = await request.json();
    const { enroll_number, name, card_number } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ["enroll_number", "name"]);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    // Type validation
    if (typeof enroll_number !== "string" || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid field types" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if student already exists
    const existingStudent = await Student.findOne({
      enroll_number: enroll_number.trim(),
    })
      .lean()
      .exec();

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this enrollment number already exists" },
        { status: 409 }
      );
    }

    // Create new student
    const student = await Student.create({
      enroll_number: enroll_number.trim(),
      name: name.trim(),
      card_number: card_number ? card_number.trim() : "",
    });

    return NextResponse.json({
      message: "Student created successfully",
      student: formatStudentResponse(student),
    });
  } catch (error) {
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

    // Handle duplicate key errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "Student with this enrollment number already exists" },
        { status: 409 }
      );
    }

    return handleError(error);
  }
}
