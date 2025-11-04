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

    console.log("Received punch request:", body);

    // Require either card_number or enroll_number
    if (
      (!card_number || typeof card_number !== "string") &&
      (!bodyEnroll || typeof bodyEnroll !== "string")
    ) {
      return NextResponse.json(
        { error: "Either card_number or enroll_number is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine enroll_number and card_number
    let enroll_number = "";
    let resolvedCardNumber = "";

    // Case 1: enroll_number is provided
    if (bodyEnroll && typeof bodyEnroll === "string" && bodyEnroll.trim()) {
      enroll_number = bodyEnroll.trim();
      resolvedCardNumber = card_number?.trim() || "";

      console.log("Using provided enroll_number:", enroll_number);

      // Optionally validate that the student exists
      try {
        const studentExists = await Student.findOne({
          enroll_number: enroll_number,
        })
          .lean<{ enroll_number: string; card_number?: string }>()
          .exec();

        if (!studentExists) {
          console.warn(
            "Warning: Student with enroll_number not found in database"
          );
          // Continue anyway - we'll still record the punch
        } else if (!resolvedCardNumber && studentExists.card_number) {
          // If card_number wasn't provided, use the one from student record
          resolvedCardNumber = studentExists.card_number;
          // console.log(
          //   "Retrieved card_number from student record:",
          //   resolvedCardNumber
          // );
        }
      } catch (lookupError) {
        console.warn("Error looking up student:", lookupError);
        // Continue anyway
      }
    }
    // Case 2: Only card_number is provided - lookup enroll_number
    else if (card_number && typeof card_number === "string") {
      resolvedCardNumber = card_number.trim();

      console.log("Looking up student by card_number:", resolvedCardNumber);

      try {
        const student = await Student.findOne({
          card_number: resolvedCardNumber,
        })
          .lean<{ enroll_number: string; card_number?: string }>()
          .exec();

        if (!student) {
          console.log("Student not found for card_number:", card_number);
          return NextResponse.json(
            { error: "Student not found for provided card_number" },
            { status: 404 }
          );
        }

        enroll_number = student.enroll_number;
        console.log("Found student with enroll_number:", enroll_number);
      } catch (studentError) {
        console.error("Error finding student:", studentError);
        return NextResponse.json(
          { error: "Error looking up student information" },
          { status: 500 }
        );
      }
    }

    // Validate we have an enrollment number
    if (!enroll_number) {
      return NextResponse.json(
        { error: "Could not determine enrollment number" },
        { status: 400 }
      );
    }

    // Determine record date — default to today's date
    let recordDate: Date;
    if (date) {
      try {
        const [year, month, day] = date.split("-").map(Number);
        recordDate = new Date(Date.UTC(year, month - 1, day));

        // Validate the date is valid
        if (isNaN(recordDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format. Use YYYY-MM-DD" },
            { status: 400 }
          );
        }
      } catch (dateError) {
        console.error("Error parsing date:", dateError);
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
    } else {
      const now = new Date();
      recordDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
    }

    console.log("Creating punch record for:", enroll_number, "on", recordDate);

    // Create the punch record (card_number is optional)
    const newRecord = await PunchRecord.create({
      enroll_number,
      card_number: resolvedCardNumber || "",
      date: recordDate,
    });

    console.log("Punch record created successfully:", newRecord._id);

    return NextResponse.json({
      message: "Punch recorded",
      record: {
        id: newRecord._id.toString(),
        enroll_number: newRecord.enroll_number,
        card_number: newRecord.card_number,
        date: newRecord.date.toISOString().split("T")[0],
        createdAt: newRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("Punch POST error:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
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
      try {
        const [year, month, day] = dateParam.split("-").map(Number);
        const start = new Date(Date.UTC(year, month - 1, day));
        const end = new Date(Date.UTC(year, month - 1, day + 1));
        filter.date = { $gte: start, $lt: end };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (dateError) {
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
    }

    const records = await PunchRecord.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(200)
      .lean<
        {
          _id: unknown;
          enroll_number: string;
          card_number: string;
          date: Date;
          createdAt: Date;
        }[]
      >()
      .exec();

    // Format output dates to YYYY-MM-DD
    const out = records.map((r) => ({
      id:
        typeof r._id === "object" && r._id !== null && "_id" in r._id
          ? String(r._id)
          : String(r._id),
      enroll_number: r.enroll_number,
      card_number: r.card_number,
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : null,
      createdAt: r.createdAt,
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
