import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AttendanceRecord from "@/models/AttendanceRecord";

// GET attendance record by enrollment number — returns dates + computed stats
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 },
      );
    }

    await connectDB();

    const record = await AttendanceRecord.findOne({
      enroll_number: id.trim(),
    })
      .lean()
      .exec();

    if (!record) {
      // Return empty stats instead of 404 — student exists but has no attendance yet
      return NextResponse.json({
        enroll_number: id,
        present_dates: [],
        od_dates: [],
        total_present: 0,
        stats: {
          attendance_percentage: 0,
          present_days: 0,
          absent_days: 0,
          total_days: 0,
        },
      });
    }

    const rec = record as any as {
      enroll_number: string;
      present_dates: Date[];
      od_dates?: Date[];
    };

    const present_dates: Date[] = rec.present_dates || [];
    const od_dates: Date[] = rec.od_dates || [];

    // Calculate stats
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    let totalWeekdays = 0;
    const cursor = new Date(yearStart);
    while (cursor <= now) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) totalWeekdays++; // exclude Sat/Sun
      cursor.setDate(cursor.getDate() + 1);
    }

    const present_days = present_dates.length;
    const absent_days = Math.max(
      totalWeekdays - present_days - od_dates.length,
      0,
    );
    const attendance_percentage =
      totalWeekdays > 0
        ? Math.round(
            ((present_days + od_dates.length) / totalWeekdays) * 10000,
          ) / 100
        : 0;

    return NextResponse.json({
      enroll_number: rec.enroll_number,
      present_dates: present_dates.map((d) =>
        d instanceof Date ? d.toISOString() : d,
      ),
      od_dates: od_dates.map((d) => (d instanceof Date ? d.toISOString() : d)),
      total_present: present_days,
      stats: {
        attendance_percentage,
        present_days,
        absent_days,
        total_days: totalWeekdays,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE attendance record
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 },
      );
    }

    await connectDB();

    const deletedRecord = await AttendanceRecord.findOneAndDelete({
      enroll_number: id.trim(),
    }).exec();

    if (!deletedRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Attendance record deleted successfully",
      deletedRecord: {
        enroll_number: deletedRecord.enroll_number,
        total_dates: deletedRecord.present_dates.length,
      },
    });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
