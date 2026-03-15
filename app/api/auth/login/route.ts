import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import UserData from "@/models/UserData";
import { formatUserResponse, validateRequiredFields } from "@/lib/db-utils";
import Student from "@/models/Student";
import Admin from "@/models/Admin";

import { JWT_SECRET } from "@/lib/auth";

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
        { status: 400 },
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
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ADDED: Check if user is admin
    let isAdmin = false;
    
    // Check if in Admin collection
    const adminRecord = await Admin.findOne({
      enroll_number: user.enroll_no,
    }).lean().exec();

    if (adminRecord) {
      isAdmin = true;
    } else {
      const student = await Student.findOne({
        enroll_number: user.enroll_no,
      })
        .select("is_admin")
        .lean()
        .exec();

      isAdmin = student?.is_admin || false;
    }

    // Generate JWT token WITH is_admin field
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email_id: user.email_id,
        enroll_no: user.enroll_no,
        is_admin: isAdmin, // ADDED THIS
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Return success response
    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        ...formatUserResponse(user),
        is_admin: isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
