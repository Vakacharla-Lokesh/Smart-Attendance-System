// app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import { withAdmin, AdminRequest } from "@/lib/admin-auth";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import TimeTable from "@/models/TimeTable";

/**
 * GET /api/admin/courses/[id]
 * Get a specific course by ID
 */
export const GET = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const { id } = request.params as { id: string };
    const course = await Course.findById(id).lean().exec();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 },
    );
  }
});

/**
 * PUT /api/admin/courses/[id]
 * Update a specific course
 */
export const PUT = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const { id } = request.params as { id: string };
    const body = await request.json();
    const {
      course_code,
      course_name,
      department,
      credits,
      instructor_name,
      instructor_email,
      year,
      semester,
      is_active,
    } = body;

    // Find existing course
    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for duplicate course_code (if changed)
    if (course_code && course_code.toUpperCase() !== course.course_code) {
      const duplicate = await Course.findOne({
        course_code: course_code.toUpperCase(),
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Course code already exists" },
          { status: 409 },
        );
      }
    }

    // Update fields
    if (course_code) course.course_code = course_code.toUpperCase();
    if (course_name) course.course_name = course_name;
    if (department) course.department = department;
    if (credits !== undefined) {
      const creditsNum = parseInt(credits);
      if (creditsNum < 1 || creditsNum > 10) {
        return NextResponse.json(
          { error: "Credits must be between 1 and 10" },
          { status: 400 },
        );
      }
      course.credits = creditsNum;
    }
    if (instructor_name !== undefined) course.instructor_name = instructor_name;
    if (instructor_email !== undefined)
      course.instructor_email = instructor_email;
    if (year !== undefined) {
      const yearNum = parseInt(year);
      if (yearNum < 1 || yearNum > 5) {
        return NextResponse.json(
          { error: "Year must be between 1 and 5" },
          { status: 400 },
        );
      }
      course.year = yearNum;
    }
    if (semester !== undefined) {
      const semesterNum = parseInt(semester);
      if (semesterNum < 1 || semesterNum > 8) {
        return NextResponse.json(
          { error: "Semester must be between 1 and 8" },
          { status: 400 },
        );
      }
      course.semester = semesterNum;
    }
    if (is_active !== undefined) course.is_active = is_active;

    await course.save();

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error: any) {
    console.error("Update course error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Course code already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
});

/**
 * DELETE /api/admin/courses/[id]
 * Delete a specific course
 */
export const DELETE = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const { id } = request.params as { id: string };

    // Check if course exists
    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course has associated timetables
    const timetableCount = await TimeTable.countDocuments({
      course_id: id,
    });

    if (timetableCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete course: ${timetableCount} timetable(s) are associated with this course`,
          timetable_count: timetableCount,
        },
        { status: 409 },
      );
    }

    // Delete course
    await Course.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
});
