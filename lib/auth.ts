import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const JWT_SECRET =
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
  is_admin?: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Extract and verify JWT from request headers.
 * Returns the decoded payload on success, or null on failure.
 * Call getUser() inside route handlers instead of mutating the request object.
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return token || null;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Authenticate a request and return the user payload.
 * Returns { user, error: null } on success or { user: null, error: NextResponse } on failure.
 */
export function getAuthenticatedUser(request: NextRequest): {
  user: JWTPayload | null;
  error: NextResponse | null;
} {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication required - No authorization header" },
        { status: 401 },
      ),
    };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication required - Invalid header format" },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication required - No token provided" },
        { status: 401 },
      ),
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.id || !decoded.email_id || !decoded.enroll_no) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 },
        ),
      };
    }

    return { user: decoded, error: null };
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 },
        ),
      };
    }

    if (error instanceof jwt.TokenExpiredError) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Authentication token expired" },
          { status: 401 },
        ),
      };
    }

    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      ),
    };
  }
}

/**
 * Legacy authenticateUser for backward compatibility.
 * Attaches user to request.user if possible, returns error response or null.
 */
export async function authenticateUser(
  request: AuthRequest,
): Promise<NextResponse | null> {
  const { user, error } = getAuthenticatedUser(request);
  if (error) return error;
  // Attempt property assignment (may silently fail on frozen objects)
  try {
    (request as AuthRequest).user = {
      id: user!.id,
      email_id: user!.email_id,
      enroll_no: user!.enroll_no,
    };
  } catch {
    // NextRequest is immutable in some environments; user is extracted inline
  }
  return null;
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

// AdminRequest interface (also exported from admin-auth.ts for backward compat)
export interface AdminRequest extends NextRequest {
  user?: {
    id: string;
    email_id: string;
    enroll_no: string;
    is_admin?: boolean;
  };
}

// authenticateAdmin function
export async function authenticateAdmin(
  request: AdminRequest,
): Promise<NextResponse | null> {
  const { user, error } = getAuthenticatedUser(request);
  if (error) return error;

  if (!user!.is_admin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  return null;
}
