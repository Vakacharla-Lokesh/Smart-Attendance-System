import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email_id: string;
    enroll_no: string;
  };
}

export async function authenticateUser(request: AuthRequest) {
  try {
    const headersList = headers();
    const token = (await headersList).get("authorization")?.split(" ")[1];

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as {
      id: string;
      email_id: string;
      enroll_no: string;
    };

    request.user = decoded;
    return null;
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid authentication token" }),
      { status: 401 }
    );
  }
}
