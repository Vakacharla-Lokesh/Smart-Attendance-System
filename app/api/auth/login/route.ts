import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import UserData from "@/models/UserData";
import { formatUserResponse, validateRequiredFields } from "@/lib/db-utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email_id, password } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ["email_id", "password"]);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    // Type validation
    if (typeof email_id !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid field types" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await UserData.findOne({
      email_id: email_id.toLowerCase().trim(),
    }).exec();

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email_id: user.email_id,
        enroll_no: user.enroll_no,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return success response
    return NextResponse.json({
      message: "Login successful",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
