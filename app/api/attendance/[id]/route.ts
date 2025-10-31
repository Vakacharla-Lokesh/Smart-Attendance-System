import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AttendanceRecord from "@/models/AttendanceRecord";

// GET attendance record by enrollment number
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 }
      );
    }

    await connectDB();

    // const record = await AttendanceRecord.findOne({
    //   enroll_number: id.trim(),
    // })
    //   .lean()
    //   .exec();

    // if (!record) {
    //   return NextResponse.json(
    //     { error: "Attendance record not found" },
    //     { status: 404 }
    //   );
    // }

    // return NextResponse.json({
    //   enroll_number: record.enroll_number,
    //   present_dates: record.present_dates,
    //   total_present: record.present_dates.length,
    // });
    const records = await AttendanceRecord.find({ enroll_number: id });

    if (!records.length) {
      return NextResponse.json({ message: "No record found" }, { status: 404 });
    }

    const record = records[0];

    return NextResponse.json({
      enroll_number: record.enroll_number,
      present_dates: record.present_dates,
      total_present: record.present_dates.length,
    });
  } catch (error) {
    console.error("Error fetching attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE attendance record
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid enrollment number" },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedRecord = await AttendanceRecord.findOneAndDelete({
      enroll_number: id.trim(),
    }).exec();

    if (!deletedRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
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
      { status: 500 }
    );
  }
}
