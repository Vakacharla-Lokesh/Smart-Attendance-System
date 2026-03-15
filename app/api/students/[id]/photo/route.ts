import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import { uploadImageToS3 } from "@/lib/s3";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: studentId } = params;
    
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return NextResponse.json(
        { success: false, error: "image_base64 is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Upload image to S3
    const fileName = `${student.enroll_number}-${Date.now()}`;
    const s3Url = await uploadImageToS3(image_base64, "profiles", fileName);

    // Update student document
    student.profile_photo = s3Url;
    await student.save();

    return NextResponse.json(
      {
        success: true,
        message: "Profile photo updated successfully",
        data: {
          profile_photo: student.profile_photo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ProfilePhotoUpdate] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile photo",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
