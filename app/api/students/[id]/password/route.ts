import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserData from "@/models/UserData";
import bcrypt from "bcrypt";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await dbConnect();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // We can lookup UserData by enroll_no (which matches id for students)
    // Wait, `id` might be the ObjectId of the Student OR the enroll_number.
    // To be safe, let's allow finding UserData by enroll_no.

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: "New password is required" },
        { status: 400 },
      );
    }

    // Since `id` in the route is usually the enrollment number for student routes,
    // let's assume it's `enroll_no`.
    const user = await UserData.findOne({ enroll_no: id });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return NextResponse.json(
          { success: false, error: "Incorrect current password" },
          { status: 401 },
        );
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update password",
        message: error.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
