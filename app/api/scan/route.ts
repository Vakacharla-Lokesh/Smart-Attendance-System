// FILE: app/api/scan/route.js
// API Route: POST /api/scan - RFID scan endpoint (auto punch in/out)

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Punch from "@/models/Punch";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { rfid_tag, scanner_id, location } = body;

    if (!rfid_tag || !scanner_id) {
      return NextResponse.json(
        {
          success: false,
          error: "RFID tag and scanner ID are required",
        },
        { status: 400 },
      );
    }

    // Find student by RFID tag
    const student = await Student.findOne({ rfid_tag, is_active: true });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: "Student not found or inactive",
          rfid_tag,
        },
        { status: 404 },
      );
    }

    // Get last punch for this student
    const lastPunch = await Punch.findOne({
      student_id: student._id,
    }).sort({ punch_time: -1 });

    // Determine punch type (in/out)
    let punchType = "in";
    if (lastPunch && lastPunch.punch_type === "in") {
      punchType = "out";
    }

    // Create new punch
    const punch = await Punch.create({
      student_id: student._id,
      scanner_id,
      punch_type: punchType,
      punch_time: new Date(),
      location: location || "",
      verified: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          punch,
          student: {
            _id: student._id,
            enroll_number: student.enroll_number,
            name: student.name,
            course: student.course,
            year: student.year,
            section: student.section,
          },
          punch_type: punchType,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing RFID scan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process RFID scan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
