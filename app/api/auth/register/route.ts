import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import UserData from "@/models/UserData";
import Student from "@/models/Student";
import { formatUserResponse, validateRequiredFields } from "@/lib/db-utils";

import { JWT_SECRET } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, // Student.email  (also stored in UserData.email_id)
      password,
      enroll_no, // UserData.enroll_no  / Student.enroll_number
      name,
      phone, // Student.phone   (required)
      course, // Student.course  (optional)
      year, // Student.year    (optional)
      section, // Student.section (optional)
      card_number, // Student.card_number (optional)
    } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, [
      "email",
      "password",
      "enroll_no",
      "name",
      "phone",
    ]);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    // Type validation
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof enroll_no !== "string" ||
      typeof name !== "string" ||
      typeof phone !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid field types" },
        { status: 400 },
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if a UserData account already exists with this email or enroll_no
    const existingUser = await UserData.findOne({
      $or: [
        { email_id: email.toLowerCase().trim() },
        { enroll_no: enroll_no.trim() },
      ],
    }).exec();

    if (existingUser) {
      const field =
        existingUser.email_id === email.toLowerCase().trim()
          ? "email"
          : "enrollment number";
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 },
      );
    }

    // Check if a Student profile already exists with this enroll_number or email
    const existingStudent = await Student.findOne({
      $or: [
        { enroll_number: enroll_no.trim() },
        { email: email.toLowerCase().trim() },
      ],
    }).exec();

    if (existingStudent) {
      const field =
        existingStudent.email === email.toLowerCase().trim()
          ? "email"
          : "enrollment number";
      return NextResponse.json(
        {
          error: `Student profile with this ${field} already exists`,
        },
        { status: 409 },
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create UserData account (handles login / auth)
    const newUser = await UserData.create({
      email_id: email.toLowerCase().trim(),
      password: hashedPassword,
      enroll_no: enroll_no.trim(),
    });

    // Build Student document — only include optional fields when provided
    const studentData: Record<string, unknown> = {
      enroll_number: enroll_no.trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      card_number: card_number ? card_number.trim() : "",
    };

    if (course && typeof course === "string" && course.trim()) {
      studentData.course = course.trim();
    }
    if (year !== undefined && year !== null && year !== "") {
      const yearNum = Number(year);
      if (!isNaN(yearNum) && yearNum >= 1 && yearNum <= 5) {
        studentData.year = yearNum;
      }
    }
    if (section && typeof section === "string" && section.trim()) {
      studentData.section = section.trim();
    }

    const newStudent = await Student.create(studentData);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        email_id: newUser.email_id,
        enroll_no: newUser.enroll_no,
        is_admin: false,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return NextResponse.json({
      message: "Registration successful",
      token,
      user: formatUserResponse(newUser),
      student: {
        id: newStudent._id.toString(),
        enroll_number: newStudent.enroll_number,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        course: newStudent.course,
        year: newStudent.year,
        section: newStudent.section,
        is_active: newStudent.is_active,
        is_admin: newStudent.is_admin,
        card_number: newStudent.card_number,
      },
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
        { status: 400 },
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
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
