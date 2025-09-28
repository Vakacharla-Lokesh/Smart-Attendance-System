// types/mongoose.ts
import { Types } from "mongoose";

// Base interface for all documents
export interface BaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// User document interface
export interface IUserDocument extends BaseDocument {
  email_id: string;
  password: string;
  enroll_no: string;
}

// Student document interface
export interface IStudentDocument extends BaseDocument {
  enroll_number: string;
  name: string;
  card_number: string;
}

// Admin document interface
export interface IAdminDocument extends BaseDocument {
  enroll_number: string;
  name: string;
}

// Course document interface
export interface ICourseDocument extends BaseDocument {
  name: string;
  course_id: string;
}

// TimeTable document interface
export interface ITimeTableDocument extends BaseDocument {
  course_id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  start_time: string;
  end_time: string;
  room_number: string;
}

// Lean document types (without mongoose methods)
export type UserLean = Omit<IUserDocument, never>;
export type StudentLean = Omit<IStudentDocument, never>;
export type AdminLean = Omit<IAdminDocument, never>;
export type CourseLean = Omit<ICourseDocument, never>;
export type TimeTableLean = Omit<ITimeTableDocument, never>;

// API response types
export interface UserResponse {
  id: string;
  email_id: string;
  enroll_no: string;
  created_at: Date;
  updated_at: Date;
}

export interface StudentResponse {
  id: string;
  enroll_number: string;
  name: string;
  card_number: string;
  created_at: Date;
  updated_at: Date;
}

export interface AdminResponse {
  id: string;
  enroll_number: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourseResponse {
  id: string;
  name: string;
  course_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TimeTableResponse {
  id: string;
  course_id: string;
  day: string;
  start_time: string;
  end_time: string;
  room_number: string;
  created_at: Date;
  updated_at: Date;
}
