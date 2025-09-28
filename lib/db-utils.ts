// lib/db-utils.ts
import { Document, Types } from "mongoose";

// Generic type for lean documents
export type LeanDocument<T> = T extends Document
  ? Omit<T, keyof Document> & { _id: Types.ObjectId }
  : T & { _id: Types.ObjectId };

// Type-safe lean query helper
export function toLean<T extends Document>(
  doc: T | null
): LeanDocument<T> | null {
  return doc as LeanDocument<T> | null;
}

// Type-safe lean query helper for arrays
export function toLeanArray<T extends Document>(docs: T[]): LeanDocument<T>[] {
  return docs as LeanDocument<T>[];
}

// Convert ObjectId to string safely
export function objectIdToString(id: Types.ObjectId | string): string {
  return typeof id === "string" ? id : id.toString();
}

// Format document for API response (removes sensitive fields)
export function formatUserResponse(user: any) {
  return {
    id: objectIdToString(user._id),
    email_id: user.email_id,
    enroll_no: user.enroll_no,
    created_at: user.createdAt || user.created_at,
    updated_at: user.updatedAt || user.updated_at,
  };
}

export function formatStudentResponse(student: any) {
  return {
    id: objectIdToString(student._id),
    enroll_number: student.enroll_number,
    name: student.name,
    card_number: student.card_number,
    created_at: student.createdAt || student.created_at,
    updated_at: student.updatedAt || student.updated_at,
  };
}

export function formatAdminResponse(admin: any) {
  return {
    id: objectIdToString(admin._id),
    enroll_number: admin.enroll_number,
    name: admin.name,
    created_at: admin.createdAt || admin.created_at,
    updated_at: admin.updatedAt || admin.updated_at,
  };
}

// Validation helpers
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export function validateRequiredFields(
  obj: Record<string, any>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === "string" && !obj[field].trim())) {
      return `${field} is required`;
    }
  }
  return null;
}
