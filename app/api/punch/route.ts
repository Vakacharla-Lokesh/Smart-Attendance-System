// app/api/punch/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PunchRecord from "@/models/PunchRecord";
import Student from "@/models/Student";
import Room from "@/models/Room";
import { addPunchToQueue } from "@/lib/redis";

// POST: Create a punch record and queue it for verification
// Body: { card_number: string, scanner_id: string, date?: string (YYYY-MM-DD) }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { card_number, scanner_id, date } = body;

    console.log("Received punch request:", body);

    // Validate required fields
    if (!card_number || typeof card_number !== "string") {
      return NextResponse.json(
        { error: "card_number is required" },
        { status: 400 },
      );
    }

    if (!scanner_id || typeof scanner_id !== "string") {
      return NextResponse.json(
        { error: "scanner_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find room by scanner_id
    const room = await Room.findOne({ scanner_id: scanner_id.trim() })
      .lean()
      .exec();

    if (!room) {
      return NextResponse.json(
        { error: "Invalid scanner_id - room not found" },
        { status: 404 },
      );
    }

    // Find student by card_number
    const student = await Student.findOne({
      card_number: card_number.trim(),
    })
      .lean()
      .exec();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found with this card_number" },
        { status: 404 },
      );
    }

    // Determine the date
    let punchDate: Date;
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      punchDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      punchDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    }

    // Create punch record in database
    const punchRecord = await PunchRecord.create({
      enroll_number: student.enroll_number,
      card_number: card_number.trim(),
      room_id: (room as any)._id.toString(),
      scanner_id: scanner_id.trim(),
      date: punchDate,
    });

    console.log(
      `Punch record created: ${student.enroll_number} in room ${(room as any).room_number}`,
    );

    // Add to Redis queue for student to claim on login
    const queueEntry = {
      enroll_number: student.enroll_number,
      card_number: card_number.trim(),
      room_id: (room as any)._id.toString(),
      scanner_id: scanner_id.trim(),
      timestamp: Date.now(),
    };

    await addPunchToQueue(queueEntry);

    console.log(
      `Punch queued for ${student.enroll_number}: ${(room as any).room_number}`,
    );

    return NextResponse.json(
      {
        message: "Punch recorded and queued for verification",
        punch_id: punchRecord._id,
        student: {
          enroll_number: student.enroll_number,
          name: student.name,
        },
        room: {
          room_id: (room as any)._id,
          room_number: (room as any).room_number,
          building: (room as any).building,
        },
        status: "queued",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Punch POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET: Check punch status (for debugging/admin)
// Query: ?enroll_number=xxx
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const enrollNumber = url.searchParams.get("enroll_number");

    if (!enrollNumber) {
      return NextResponse.json(
        { error: "enroll_number query parameter is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Get recent punch records
    const records = await PunchRecord.find({
      enroll_number: enrollNumber,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    return NextResponse.json({
      enroll_number: enrollNumber,
      recent_punches: records,
      count: records.length,
    });
  } catch (error) {
    console.error("Punch GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
