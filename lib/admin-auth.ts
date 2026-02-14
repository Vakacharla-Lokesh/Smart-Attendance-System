// lib/admin-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import connectDB from "./mongodb";
import Student from "@/models/Student";

export interface AdminRequest extends NextRequest {
  user?: JWTPayload & {
    is_admin: boolean;
  };
}

/**
 * Middleware to check if user is an admin
 * Add is_admin field to Student model to designate admins
 */
export async function requireAdmin(
  request: AdminRequest,
): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Get user from database to check admin status
    await connectDB();
    const user = await Student.findOne({
      enroll_number: decoded.enroll_no,
    }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Type assertion for lean document
    const userData = user as any;

    // Check if user is admin
    if (!userData.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Attach user info to request
    request.user = {
      ...decoded,
      is_admin: true,
    };

    return null; // No error, user is authenticated admin
  } catch (error) {
    console.error("Admin authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 },
    );
  }
}

/**
 * Helper function to wrap admin route handlers
 */
export function withAdmin(
  handler: (request: AdminRequest) => Promise<NextResponse>,
) {
  return async (request: AdminRequest) => {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    return handler(request);
  };
}
