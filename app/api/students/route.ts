import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";

// GET all students
export async function GET() {
  try {
    await connectDB();
    const students = await Student.find({}).select("-__v");
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST new student
export async function POST(request: NextRequest) {
  try {
    const { enroll_number, name, card_number } = await request.json();

    if (!enroll_number || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingStudent = await Student.findOne({ enroll_number });
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

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}