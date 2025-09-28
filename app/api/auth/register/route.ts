import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import UserData from "@/models/UserData";
import Student from "@/models/Student";
import {
  formatUserResponse,
  formatStudentResponse,
  validateRequiredFields,
} from "@/lib/db-utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email_id, password, enroll_no, name, card_number } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, [
      "email_id",
      "password",
      "enroll_no",
      "name",
    ]);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    // Type validation
    if (
      typeof email_id !== "string" ||
      typeof password !== "string" ||
      typeof enroll_no !== "string" ||
      typeof name !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid field types" },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await UserData.findOne({
      $or: [
        { email_id: email_id.toLowerCase().trim() },
        { enroll_no: enroll_no.trim() },
      ],
    }).exec();

    if (existingUser) {
      const field =
        existingUser.email_id === email_id.toLowerCase().trim()
          ? "email"
          : "enrollment number";
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Check if student profile already exists
    const existingStudent = await Student.findOne({
      enroll_number: enroll_no.trim(),
    }).exec();

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student profile with this enrollment number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account
    const newUser = await UserData.create({
      email_id: email_id.toLowerCase().trim(),
      password: hashedPassword,
      enroll_no: enroll_no.trim(),
    });

    // Create student profile
    const newStudent = await Student.create({
      enroll_number: enroll_no.trim(),
      name: name.trim(),
      card_number: card_number ? card_number.trim() : "",
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        email_id: newUser.email_id,
        enroll_no: newUser.enroll_no,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Registration successful",
      token,
      user: formatUserResponse(newUser),
      student: formatStudentResponse(newStudent),
    });
  } catch (error) {
    console.error("Registration error:", error);

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
        { error: "User with this information already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
