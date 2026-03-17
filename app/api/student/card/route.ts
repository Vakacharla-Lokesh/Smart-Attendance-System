import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  const { user, error: authError } = getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    await dbConnect();

    const student = await Student.findOne({
      enroll_number: user?.enroll_no,
      is_active: true,
    })
      .select("enroll_number name card_number is_active")
      .lean();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: "Student not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enroll_number: student.enroll_number,
        name: student.name,
        card_number: student.card_number || "",
        is_active: student.is_active,
      },
    });
  } catch (error) {
    console.error("[StudentCard] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch student card mapping",
      },
      { status: 500 },
    );
  }
}
