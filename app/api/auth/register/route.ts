import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import UserData from "@/models/UserData";
import Student from "@/models/Student";

export async function POST(request: NextRequest) {
  try {
    const { email_id, password, enroll_no, name, card_number } = await request.json();

    // Validate required fields
    if (!email_id || !password || !enroll_no || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await UserData.findOne({
      $or: [{ email_id: email_id.toLowerCase() }, { enroll_no }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const newUser = await UserData.create({
      email_id: email_id.toLowerCase(),
      password: hashedPassword,
      enroll_no,
    });

    // Create student profile
    const newStudent = await Student.create({
      enroll_number: enroll_no,
      name,
      card_number: card_number || "",
    });

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        email_id: newUser.email_id,
        enroll_no: newUser.enroll_no,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
