// app/api/attendance/pending/route.ts
import { NextResponse } from "next/server";
import { authenticateUser, AuthRequest } from "@/lib/auth";
import { getPunchFromQueue, removePunchFromQueue } from "@/lib/redis";
import { verifyAttendanceEligibility } from "@/lib/location-utils";
import connectDB from "@/lib/mongodb";
import AttendanceRecord from "@/models/AttendanceRecord";

interface PendingAttendanceRequest extends AuthRequest {
  user?: {
    id: string;
    email_id: string;
    enroll_no: string;
  };
}

/**
 * GET: Check if student has any pending punch requests in the queue
 * Returns the pending request if found, allowing student to submit location
 */
export async function GET(request: PendingAttendanceRequest) {
  // Authenticate user
  const authError = await authenticateUser(request);
  if (authError) return authError;

  try {
    const enroll_number = request.user?.enroll_no;

    if (!enroll_number) {
      return NextResponse.json(
        { error: "User enrollment number not found" },
        { status: 400 },
      );
    }

    // Check Redis queue for pending punch
    const pendingPunch = await getPunchFromQueue(enroll_number);

    if (!pendingPunch) {
      return NextResponse.json(
        {
          has_pending: false,
          message: "No pending attendance requests",
        },
        { status: 200 },
      );
    }

    // Return pending request details
    return NextResponse.json(
      {
        has_pending: true,
        pending_request: {
          room_id: pendingPunch.room_id,
          scanner_id: pendingPunch.scanner_id,
          queued_at: new Date(pendingPunch.timestamp).toISOString(),
          expires_in_seconds: Math.max(
            0,
            600 - (Date.now() - pendingPunch.timestamp) / 1000,
          ),
        },
        message: "Please submit your location to verify attendance",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Pending attendance GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Submit location to verify and mark attendance
 * Body: { latitude: number, longitude: number }
 */
export async function POST(request: PendingAttendanceRequest) {
  // Authenticate user
  const authError = await authenticateUser(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    const enroll_number = request.user?.enroll_no;

    if (!enroll_number) {
      return NextResponse.json(
        { error: "User enrollment number not found" },
        { status: 400 },
      );
    }

    // Validate location coordinates
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 },
      );
    }

    // Get pending punch from queue
    const pendingPunch = await getPunchFromQueue(enroll_number);

    if (!pendingPunch) {
      return NextResponse.json(
        { error: "No pending attendance request found" },
        { status: 404 },
      );
    }

    // Verify location and time eligibility
    const eligibility = await verifyAttendanceEligibility(
      pendingPunch.room_id,
      latitude,
      longitude,
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          message: "Attendance verification failed",
          ...eligibility,
        },
        { status: 403 },
      );
    }

    await connectDB();

    // Mark attendance
    const attendanceDate = new Date();
    const dateOnly = new Date(
      Date.UTC(
        attendanceDate.getUTCFullYear(),
        attendanceDate.getUTCMonth(),
        attendanceDate.getUTCDate(),
      ),
    );

    let attendanceRecord = await AttendanceRecord.findOne({
      enroll_number,
    }).exec();

    if (!attendanceRecord) {
      // Create new attendance record
      attendanceRecord = await AttendanceRecord.create({
        enroll_number,
        attendance_entries: [
          {
            date: dateOnly,
            room_id: pendingPunch.room_id,
            location_verified: true,
            marked_at: new Date(),
          },
        ],
      });
    } else {
      // Check if already marked for today
      const alreadyMarked = attendanceRecord.attendance_entries.some(
        (entry: any) =>
          entry.date.toISOString().split("T")[0] ===
          dateOnly.toISOString().split("T")[0],
      );

      if (!alreadyMarked) {
        attendanceRecord.attendance_entries.push({
          date: dateOnly,
          room_id: pendingPunch.room_id,
          location_verified: true,
          marked_at: new Date(),
        });
        await attendanceRecord.save();
      } else {
        return NextResponse.json(
          {
            message: "Attendance already marked for today",
            status: "already_marked",
          },
          { status: 409 },
        );
      }
    }

    // Remove from queue after successful verification
    await removePunchFromQueue(enroll_number);

    // console.log(
    //   `Attendance marked for ${enroll_number} in room ${pendingPunch.room_id}`,
    // );

    return NextResponse.json(
      {
        message: "Attendance marked successfully",
        attendance: {
          enroll_number,
          date: dateOnly.toISOString().split("T")[0],
          room_id: pendingPunch.room_id,
          location_verified: true,
          distance: eligibility.distance,
          marked_at: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Pending attendance POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
