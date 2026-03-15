// FILE: app/api/attendance/pending/route.ts
//
// This route is a READ-ONLY status endpoint.
// Its only job is to tell the student app whether a pending IoT scan exists
// in the Redis queue — so the UI can show/hide the "Punch In" button.
//
// The actual punch-in logic (geofence check + DB write) lives in:
//   POST /api/punch/manual  (punch_type: "in")
//
// The attendance marking logic lives in:
//   POST /api/punch/manual  (punch_type: "out") — triggers after punch-out

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPunchFromQueue } from "@/lib/redis";
import { getScheduledClassAtTime } from "@/lib/location-utils";

/**
 * GET /api/attendance/pending
 * Returns whether a pending IoT scan exists for the authenticated student.
 * The app uses this to show/hide the Punch In button and display the countdown.
 */
export async function GET(request: NextRequest) {
  const { user, error: authError } = getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const enroll_number = user?.enroll_no;

    if (!enroll_number) {
      return NextResponse.json(
        { error: "User enrollment number not found" },
        { status: 400 },
      );
    }

    const pendingPunch = await getPunchFromQueue(enroll_number);

    if (!pendingPunch) {
      return NextResponse.json(
        {
          has_pending: false,
          message:
            "No pending IoT scan. Please scan your card at the classroom reader.",
        },
        { status: 200 },
      );
    }

    const expiresInSeconds = Math.max(
      0,
      Math.round(600 - (Date.now() - pendingPunch.timestamp) / 1000),
    );

    const scheduledClass = await getScheduledClassAtTime(pendingPunch.room_id, new Date(), "in");

    return NextResponse.json(
      {
        has_pending: true,
        pending_scan: {
          room_id: pendingPunch.room_id,
          scanner_id: pendingPunch.scanner_id,
          scanned_at: new Date(pendingPunch.timestamp).toISOString(),
          expires_in_seconds: expiresInSeconds,
          scheduled_class: scheduledClass ? {
            _id: scheduledClass._id,
            start_time: scheduledClass.start_time,
            end_time: scheduledClass.end_time,
            course_code: scheduledClass.course_id?.course_code,
            course_name: scheduledClass.course_id?.course_name,
          } : null
        },
        message: `IoT scan found. You have ${expiresInSeconds}s to punch in from the app.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[AttendancePending] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
