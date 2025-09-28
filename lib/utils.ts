import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextResponse } from "next/server";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Error handling utility
export function handleError(error: unknown) {
  console.error("API Error:", error);

  // Handle mongoose validation errors
  if (
    error instanceof Error &&
    "name" in error &&
    error.name === "ValidationError"
  ) {
    return NextResponse.json(
      { error: "Validation error: Please check your input data" },
      { status: 400 }
    );
  }

  // Handle duplicate key errors
  if (error instanceof Error && "code" in error && error.code === 11000) {
    return NextResponse.json(
      { error: "Duplicate entry: Resource already exists" },
      { status: 409 }
    );
  }

  // Handle cast errors (invalid ObjectId, etc.)
  if (error instanceof Error && "name" in error && error.name === "CastError") {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEnrollmentNumber(enrollNo: string): boolean {
  // Basic validation - adjust regex based on your enrollment number format
  const enrollRegex = /^[A-Za-z0-9]{3,20}$/;
  return enrollRegex.test(enrollNo);
}
