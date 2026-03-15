// FILE: app/api/punch/manual/route.ts
// API Route: POST /api/punch/manual
//
// Punch-in flow:
//   1. Student must have a valid IoT scan in Redis (card was scanned in the classroom)
//   2. Student sends GPS coordinates from the app
//   3. GPS is verified against the room's geofence (Haversine distance check)
//   4. If within geofence → Punch-in record written to MongoDB, Redis entry cleared
//
// Punch-out flow:
//   1. Student just clicks the button — no location required
//   2. Punch-out record written to MongoDB
//   3. System checks if a punch-in also exists today → if yes, marks attendance in AttendanceRecord

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Punch from "@/models/Punch";
import AttendanceRecord from "@/models/AttendanceRecord";
import { getPunchFromQueue, removePunchFromQueue } from "@/lib/redis";
import { verifyAttendanceEligibility } from "@/lib/location-utils";
import MatchFaces from "@/lib/imageMatecher";

export async function POST(request: NextRequest) {
  // Step 1: Authenticate the student via JWT
  const { user, error: authError } = getAuthenticatedUser(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { punch_type, latitude, longitude, image_base64 } = body;

    const enroll_number = user?.enroll_no;

    if (!enroll_number) {
      return NextResponse.json(
        { success: false, error: "User enrollment number not found in token" },
        { status: 400 },
      );
    }

    // Step 2: Validate punch_type
    if (!punch_type || !["in", "out"].includes(punch_type)) {
      return NextResponse.json(
        { success: false, error: "punch_type must be 'in' or 'out'" },
        { status: 400 },
      );
    }

    // Step 3: Punch-in requires valid GPS coordinates
    if (punch_type === "in") {
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Valid latitude and longitude are required for punch-in",
          },
          { status: 400 },
        );
      }
    }

    await dbConnect();

    // Step 4: Look up student
    const student = await Student.findOne({ enroll_number, is_active: true });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found or inactive" },
        { status: 404 },
      );
    }

    // Step 5: Prevent duplicate punch-in / punch-out on the same day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lastPunch = await Punch.findOne({
      student_id: student._id,
      punch_time: { $gte: todayStart },
    }).sort({ punch_time: -1 });

    if (lastPunch && lastPunch.punch_type === punch_type) {
      return NextResponse.json(
        {
          success: false,
          error:
            punch_type === "in"
              ? "You have already punched in today. Please punch out first."
              : "You have not punched in yet. Please punch in first.",
          current_status: punch_type,
        },
        { status: 409 },
      );
    }

    // ─── PUNCH-IN FLOW ────────────────────────────────────────────────────────

    if (punch_type === "in") {
      // Step 6: Check Redis for a pending IoT scan for this student
      const queueEntry = await getPunchFromQueue(enroll_number);

      if (!queueEntry) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No IoT scan found. Please scan your card at the classroom reader first. Scans expire after 10 minutes.",
          },
          { status: 403 },
        );
      }

      // Step 7: Verify student is within the room's geofence AND class is scheduled
      const eligibility = await verifyAttendanceEligibility(
        queueEntry.room_id,
        latitude,
        longitude,
        new Date(),
        "in"
      );

      if (!eligibility.eligible) {
        return NextResponse.json(
          {
            success: false,
            error: eligibility.reason || "Attendance verification failed",
            details: {
              location_verified: eligibility.location_verified,
              within_class_time: eligibility.within_class_time,
              distance_meters: eligibility.distance,
            },
          },
          { status: 403 },
        );
      }

      // Step 8: All checks passed — write punch-in to MongoDB
      const locationString = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

      const punch = await Punch.create({
        student_id: student._id,
        scanner_id: queueEntry.scanner_id,
        punch_type: "in",
        punch_time: new Date(),
        location: locationString,
        verified: true,
        timetable_id: eligibility.scheduled_class?._id,
        course_id: eligibility.scheduled_class?.course_id?._id,
      });

      // Step 9: Clear the Redis entry — scan has been consumed
      await removePunchFromQueue(enroll_number);

      await punch.populate(
        "student_id",
        "enroll_number name course year section",
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            punch,
            punch_type: "in",
            student: {
              enroll_number: student.enroll_number,
              name: student.name,
            },
            room_id: queueEntry.room_id,
            distance_meters: eligibility.distance,
            message: "Punched in successfully",
          },
        },
        { status: 201 },
      );
    }

    // ─── PUNCH-OUT FLOW ───────────────────────────────────────────────────────

    if (punch_type === "out") {
      // Step 6: Verify image provided
      if (!image_base64) {
        return NextResponse.json(
          {
            success: false,
            error: "An image is required to punch out.",
          },
          { status: 400 },
        );
      }

      if (!student.profile_photo) {
        return NextResponse.json(
          {
            success: false,
            error: "Student profile photo not found. Please upload a profile photo first.",
          },
          { status: 400 },
        );
      }

      // Check if a punch-in exists today and verify time window
      const punchInToday = await Punch.findOne({
        student_id: student._id,
        punch_type: "in",
        punch_time: { $gte: todayStart },
      }).sort({ punch_time: -1 });

      if (!punchInToday || !punchInToday.timetable_id) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot find a valid punch-in to match with for punch-out.",
          },
          { status: 400 },
        );
      }

      const TimeTable = (await import("@/models/TimeTable")).default;
      const scheduledClass = await TimeTable.findById(punchInToday.timetable_id);

      if (!scheduledClass) {
        return NextResponse.json(
          {
            success: false,
            error: "The scheduled class for your punch-in could not be found.",
          },
          { status: 404 },
        );
      }

      // Verify time window
      // const currentTimeObj = new Date();
      // const currentMinutes = currentTimeObj.getHours() * 60 + currentTimeObj.getMinutes();
      // const end = new Date(scheduledClass.end_time);
      // const endMinutes = end.getHours() * 60 + end.getMinutes();

      // if (currentMinutes < (endMinutes - 15) || currentMinutes > (endMinutes + 5)) {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "You can only punch out between 15 minutes before and 5 minutes after class ends.",
      //       details: {
      //         class_end_time: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      //       }
      //     },
      //     { status: 403 },
      //   );
      // }

      // Step 7: Match Faces directly with the provided base64 string
      const matchResult = await MatchFaces(student.profile_photo, image_base64);
      
      if (!matchResult.status) {
         return NextResponse.json(
          {
            success: false,
            error: "Face match failed. Cannot punch out.",
            details: matchResult
          },
          { status: 403 },
        );
      }

      // Step 8: Write punch-out to MongoDB using the base64 image
      const punch = await Punch.create({
        student_id: student._id,
        scanner_id: "MANUAL_APP",
        punch_type: "out",
        punch_time: new Date(),
        location: "",
        verified: true,
        punch_photo: image_base64,
        timetable_id: punchInToday.timetable_id,
        course_id: punchInToday.course_id,
      });

      await punch.populate(
        "student_id",
        "enroll_number name course year section",
      );

      // Step 10: Both punch-in and punch-out exist for today → mark attendance
      const now = new Date();
      let attendanceMarked = false;
        const attendanceDate = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        const dateString = attendanceDate.toISOString().split("T")[0];

        // Upsert: create or update the attendance record
        const existing = await AttendanceRecord.findOne({
          enroll_number,
        });

        if (!existing) {
          await AttendanceRecord.create({
            enroll_number,
            present_dates: [attendanceDate],
          });
          attendanceMarked = true;
        } else {
          const alreadyMarked = existing.present_dates.some(
            (d: Date) => d.toISOString().split("T")[0] === dateString,
          );

          if (!alreadyMarked) {
            existing.present_dates.push(attendanceDate);
            await existing.save();
            attendanceMarked = true;
          }
        }

      return NextResponse.json(
        {
          success: true,
          data: {
            punch,
            punch_type: "out",
            student: {
              enroll_number: student.enroll_number,
              name: student.name,
            },
            attendance_marked: attendanceMarked,
            message: attendanceMarked
              ? "Punched out successfully. Attendance marked for today."
              : "Punched out successfully. No punch-in found today — attendance NOT marked.",
          },
        },
        { status: 201 },
      );
    }

    // Should never reach here
    return NextResponse.json(
      { success: false, error: "Invalid punch_type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[ManualPunch] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process punch",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
