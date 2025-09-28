import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import { authenticateUser, AuthRequest } from "@/lib/auth";
import { handleError } from "@/lib/utils";

// GET all students
export async function GET(request: AuthRequest) {
  try {
    // Check authentication
    const authError = await authenticateUser(request);
    if (authError) return authError;

    await connectDB();
    const students = await Student.find({})
      .select("enroll_number name card_number")
      .lean();

    return NextResponse.json(students);
  } catch (error) {
    return handleError(error);
  }
}

// POST new student
export async function POST(request: AuthRequest) {
  try {
    // Check authentication
    const authError = await authenticateUser(request);
    if (authError) return authError;

    const { enroll_number, name, card_number } = await request.json();

    if (!enroll_number || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingStudent = await Student.findOne({ enroll_number }).lean();
    if (existingStudent) {
      return NextResponse.json(
        { error: "Student already exists" },
        { status: 409 }
      );
    }

    const student = await Student.create({
      enroll_number,
      name,
      card_number: card_number || "",
    });

    return NextResponse.json({
      message: "Student created successfully",
      student: student.toJSON()
    });
  } catch (error) {
    return handleError(error);
  }
}
