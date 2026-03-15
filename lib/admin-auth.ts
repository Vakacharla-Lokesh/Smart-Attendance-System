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
 * Checks the is_admin flag in the JWT token, then cross-checks with Student record
 */
export async function requireAdmin(
  request: NextRequest,
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

    // Fast-path: check is_admin from JWT payload
    if (decoded.is_admin) {
      return null; // Token says admin — allow
    }

    // Fallback: verify against database
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
  handler: (request: NextRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    return handler(request);
  };
}
