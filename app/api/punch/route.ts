import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PunchRecord from "@/models/PunchRecord";
import Student from "@/models/Student";

// POST: create a punch record
// Body: { card_number: string, date?: string (ISO YYYY-MM-DD) }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { card_number, date } = body;

    if (!card_number || typeof card_number !== "string") {
      return NextResponse.json({ error: "card_number is required" }, { status: 400 });
    }

    await connectDB();

  // Find student by card number (return full document so TS knows fields)
  const student = await Student.findOne({ card_number }).exec();

  const enroll_number = student ? student.enroll_number : "";

    // Use provided date or today's date (UTC, start of day)
    const recordDate = date ? new Date(date) : new Date();
    // normalize to date-only (set time to 00:00:00 UTC)
    const normalized = new Date(Date.UTC(recordDate.getUTCFullYear(), recordDate.getUTCMonth(), recordDate.getUTCDate()));

    const newRecord = await PunchRecord.create({
      enroll_number,
      card_number,
      date: normalized,
    });

    return NextResponse.json({ message: "Punch recorded", record: newRecord.toJSON() });
  } catch (error) {
    console.error("Punch POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: query param ?date=YYYY-MM-DD (optional)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    const filter: any = {};
    if (dateParam) {
      const d = new Date(dateParam);
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
      filter.date = { $gte: start, $lt: end };
    }

    const records = await PunchRecord.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    // serialize date safely
    const out = (records as any[]).map((r) => ({
      ...r,
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : null,
    }));

    return NextResponse.json(out);
  } catch (error) {
    console.error("Punch GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
