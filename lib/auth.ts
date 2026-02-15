import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email_id: string;
    enroll_no: string;
  };
}

export interface JWTPayload {
  id: string;
  email_id: string;
  enroll_no: string;
  iat?: number;
  exp?: number;
}

export async function authenticateUser(
  request: AuthRequest,
): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required - No authorization header" },
        { status: 401 },
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required - Invalid header format" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required - No token provided" },
        { status: 401 },
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Validate payload structure
    if (!decoded.id || !decoded.email_id || !decoded.enroll_no) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 },
      );
    }

    // Attach user info to request
    request.user = {
      id: decoded.id,
      email_id: decoded.email_id,
      enroll_no: decoded.enroll_no,
    };

    return null; // No error, authentication successful
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 },
      );
    }

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: "Authentication token expired" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 },
    );
  }
}

// Helper function to generate JWT tokens
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "smart-attendance-system",
  });
}

// Helper function to verify tokens without request context
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// Middleware-style auth check
export function requireAuth(
  handler: (request: AuthRequest) => Promise<NextResponse>,
) {
  return async (request: AuthRequest) => {
    const authError = await authenticateUser(request);
    if (authError) return authError;

    return handler(request);
  };
}

// Add this interface
export interface AdminRequest extends NextRequest {
  user?: {
    id: string;
    email_id: string;
    enroll_no: string;
    is_admin?: boolean;
  };
}

// Add this function
export async function authenticateAdmin(
  request: AdminRequest,
): Promise<NextResponse | null> {
  // First authenticate as regular user
  const authError = await authenticateUser(request as AuthRequest);
  if (authError) return authError;

  // Check if user is admin (you need an "is_admin" field in your User model)
  // For now, we'll just check authentication
  // TODO: Add admin role check from database

  return null; // No error, admin authentication successful
}
