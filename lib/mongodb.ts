import mongoose, { Types } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;

// Convert ObjectId to string safely
export function objectIdToString(id: Types.ObjectId | string): string {
  return typeof id === "string" ? id : id.toString();
}

// Define interfaces for formatting functions
interface BaseDocumentData {
  _id: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface UserDocumentData extends BaseDocumentData {
  email_id: string;
  enroll_no: string;
}

interface StudentDocumentData extends BaseDocumentData {
  enroll_number: string;
  name: string;
  card_number: string;
}

interface AdminDocumentData extends BaseDocumentData {
  enroll_number: string;
  name: string;
}

// Format document for API response (removes sensitive fields)
export function formatUserResponse(user: UserDocumentData) {
  return {
    id: objectIdToString(user._id),
    email_id: user.email_id,
    enroll_no: user.enroll_no,
    created_at: user.createdAt || user.created_at,
    updated_at: user.updatedAt || user.updated_at,
  };
}

export function formatStudentResponse(student: StudentDocumentData) {
  return {
    id: objectIdToString(student._id),
    enroll_number: student.enroll_number,
    name: student.name,
    card_number: student.card_number,
    created_at: student.createdAt || student.created_at,
    updated_at: student.updatedAt || student.updated_at,
  };
}

export function formatAdminResponse(admin: AdminDocumentData) {
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
  obj: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    const value = obj[field];
    if (!value || (typeof value === "string" && !value.trim())) {
      return `${field} is required`;
    }
  }
  return null;
}
