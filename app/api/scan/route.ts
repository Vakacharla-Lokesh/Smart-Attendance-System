// FILE: app/api/scan/route.ts
// API Route: POST /api/scan
// IoT device endpoint — receives card scan, stores in Redis queue for student to confirm via app.
// Does NOT write to MongoDB directly. Student must punch-in from the app to complete the flow.

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import { addPunchToQueue, getPunchFromQueue } from "@/lib/redis";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { card_number, scanner_id, room_id } = body;

    // Validate required fields from IoT device
    if (!card_number || !scanner_id || !room_id) {
      return NextResponse.json(
        {
          success: false,
          error: "card_number, scanner_id, and room_id are required",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    interface IStudentLean {
      _id: mongoose.Types.ObjectId;
      enroll_number: string;
      name: string;
      course?: string;
      year?: number;
      section?: string;
    }

    // Look up student by card_number
    const student = await Student.findOne({ card_number, is_active: true })
      .select("_id enroll_number name course year section")
      .lean<IStudentLean>();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: "Student not found or inactive",
          card_number,
        },
        { status: 404 },
      );
    }

    const enroll_number = student.enroll_number;

    // Check if there is already a pending scan in Redis for this student
    // If yes, the previous scan is still waiting — overwrite it with the latest scan
    const existing = await getPunchFromQueue(enroll_number);
    if (existing) {
      console.warn(
        `[Scan] Overwriting existing Redis entry for ${enroll_number} (previous scan not yet confirmed)`,
      );
    }

    // Push scan event to Redis queue with TTL (10 min, configured in redis.ts)
    const entry = await addPunchToQueue({
      enroll_number,
      card_number,
      room_id,
      scanner_id,
      timestamp: Date.now(),
    });

    if (!entry) {
      // Redis is unavailable — fail loudly so the IoT device knows
      return NextResponse.json(
        {
          success: false,
          error: "Queue unavailable. Please try again.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Scan queued. Student must confirm via app within 10 minutes.",
        data: {
          enroll_number,
          student_name: student.name,
          room_id,
          scanner_id,
          queued_at: new Date(entry.timestamp).toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Scan] Error processing IoT scan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process scan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
