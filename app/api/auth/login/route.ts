import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import UserData from "@/models/UserData";

export async function POST(request: NextRequest) {
  try {
    const { email_id, password } = await request.json();

    if (!email_id || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserData.findOne({ email_id: email_id.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Return user data without sensitive information
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        email_id: user.email_id,
        enroll_no: user.enroll_no,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}