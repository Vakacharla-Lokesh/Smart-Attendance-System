import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AttendanceRecord from "@/models/AttendanceRecord";

// GET all attendance records or filter by enrollment number
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const enrollNumber = url.searchParams.get("enroll_number");

    let records;
    if (enrollNumber) {
      records = await AttendanceRecord.find({ enroll_number: enrollNumber });

      if (!records.length) {
        return NextResponse.json(
          { message: "No record found" },
          { status: 404 }
        );
      }

      const record = records[0];

      return NextResponse.json({
        enroll_number: record.enroll_number,
        present_dates: record.present_dates,
        total_present: record.present_dates.length,
      });
    }

    records = await AttendanceRecord.find({}).lean().exec();

    const formatted = records.map((r) => ({
      enroll_number: r.enroll_number,
      present_dates: r.present_dates,
      total_present: r.present_dates.length,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST mark attendance for students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enroll_numbers, date } = body;

    if (!enroll_numbers || !Array.isArray(enroll_numbers)) {
      return NextResponse.json(
        { error: "enroll_numbers array is required" },
        { status: 400 }
      );
    }

    // Determine the date to mark
    let attendanceDate: Date;
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      attendanceDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      attendanceDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
    }

    await connectDB();

    const results = [];

    for (const enrollNo of enroll_numbers) {
      // Find existing record or create new one
      let record = await AttendanceRecord.findOne({
        enroll_number: enrollNo,
      }).exec();

      if (!record) {
        // Create new record
        record = await AttendanceRecord.create({
          enroll_number: enrollNo,
          present_dates: [attendanceDate],
        });
        results.push({ enroll_number: enrollNo, status: "created" });
      } else {
        // Check if date already exists
        const dateExists = record.present_dates.some(
          (d : any) =>
            d.toISOString().split("T")[0] ===
            attendanceDate.toISOString().split("T")[0]
        );

        if (!dateExists) {
          record.present_dates.push(attendanceDate);
          await record.save();
          results.push({ enroll_number: enrollNo, status: "updated" });
        } else {
          results.push({ enroll_number: enrollNo, status: "already_marked" });
        }
      }
    }

    return NextResponse.json({
      message: "Attendance marked successfully",
      date: attendanceDate.toISOString().split("T")[0],
      results,
    });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
