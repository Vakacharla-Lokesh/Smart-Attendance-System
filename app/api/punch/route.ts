import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Punch from "@/models/Punch";
import Student from "@/models/Student";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");
    const scannerId = searchParams.get("scanner_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit")) || 50;

    let query = {};

    if (studentId) query.student_id = studentId;
    if (scannerId) query.scanner_id = scannerId;

    if (startDate || endDate) {
      query.punch_time = {};
      if (startDate) query.punch_time.$gte = new Date(startDate);
      if (endDate) query.punch_time.$lte = new Date(endDate);
    }

    const punches = await Punch.find(query)
      .populate("student_id", "enroll_number name course year section")
      .sort({ punch_time: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: punches,
      count: punches.length,
    });
  } catch (error) {
    console.error("Error fetching punches:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch punches",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["student_id", "scanner_id", "punch_type"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        );
      }
    }

    // Verify student exists
    const student = await Student.findById(body.student_id);
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: "Student not found",
        },
        { status: 404 },
      );
    }

    // Check if student is active
    if (!student.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "Student account is inactive",
        },
        { status: 403 },
      );
    }

    // Create punch record
    const punch = await Punch.create({
      student_id: body.student_id,
      scanner_id: body.scanner_id,
      punch_type: body.punch_type,
      punch_time: body.punch_time || new Date(),
      location: body.location || "",
      verified: body.verified !== undefined ? body.verified : true,
    });

    // Populate student details
    await punch.populate(
      "student_id",
      "enroll_number name course year section",
    );

    return NextResponse.json(
      {
        success: true,
        data: punch,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating punch:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create punch",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
