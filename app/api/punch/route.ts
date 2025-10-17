import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PunchRecord from "@/models/PunchRecord";
import Student from "@/models/Student";

// POST: create a punch record
// Body: { card_number?: string, enroll_number?: string, date?: string (YYYY-MM-DD) }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { card_number, date, enroll_number: bodyEnroll } = body;

    // require either card_number or enroll_number
    if (
      (!card_number || typeof card_number !== "string") &&
      (!bodyEnroll || typeof bodyEnroll !== "string")
    ) {
      return NextResponse.json(
        { error: "card_number or enroll_number is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine enroll_number
    let enroll_number = "";
    if (bodyEnroll && typeof bodyEnroll === "string" && bodyEnroll.trim()) {
      enroll_number = bodyEnroll.trim();
    } else if (card_number && typeof card_number === "string") {
      const student = (await Student.findOne({ card_number })
        .lean()
        .exec()) as { enroll_number: string } | null;

      if (!student) {
        return NextResponse.json(
          { error: "Student not found for provided card_number" },
          { status: 404 }
        );
      }

      enroll_number = student.enroll_number;
    }

    // Determine record date — default to today's date
    let recordDate: Date;
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      recordDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      recordDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
    }

    const newRecord = await PunchRecord.create({
      enroll_number,
      card_number: card_number || "",
      date: recordDate,
    });

    return NextResponse.json({
      message: "Punch recorded",
      record: newRecord.toJSON(),
    });
  } catch (error) {
    console.error("Punch POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: ?date=YYYY-MM-DD (optional)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    const filter: any = {};
    if (dateParam) {
      const [year, month, day] = dateParam.split("-").map(Number);
      const start = new Date(Date.UTC(year, month - 1, day));
      const end = new Date(Date.UTC(year, month - 1, day + 1));
      filter.date = { $gte: start, $lt: end };
    }

    const records = await PunchRecord.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    // Format output dates to YYYY-MM-DD
    const out = records.map((r) => ({
      ...r,
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : null,
    }));

    return NextResponse.json(out);
  } catch (error) {
    console.error("Punch GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
