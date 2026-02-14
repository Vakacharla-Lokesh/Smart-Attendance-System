// Type definitions for the Smart Attendance System

export interface Student {
  _id: string;
  enroll_number: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  year: number;
  section: string;
  rfid_tag?: string;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentFormData {
  enroll_number: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  year: number;
  section: string;
  rfid_tag: string;
  is_active: boolean;
}

export interface Punch {
  _id: string;
  student_id: {
    _id: string;
    enroll_number: string;
    name: string;
    email?: string;
    phone?: string;
    course: string;
    year?: number;
    section?: string;
  } | string;
  scanner_id: string;
  punch_type: "in" | "out";
  punch_time: Date | string;
  location?: string;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Stats {
  totalStudents: number;
  activeStudents: number;
  todayPunches: number;
  currentlyInside: number;
}

export interface Filters {
  studentId: string;
  punchType: string;
  dateFrom: string;
  dateTo: string;
  startDate: string;
  endDate: string;
}
