import { Schema, model, models, Document, Types } from "mongoose";

export interface IAttendanceRecord {
  enroll_number: string;
  present_dates: Date[];
}

export interface IAttendanceRecordDocument extends IAttendanceRecord, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecordDocument>(
  {
    enroll_number: {
      type: String,
      required: [true, "Enrollment number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    present_dates: {
      type: [Date],
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "AttendanceRecord",
  }
);

AttendanceRecordSchema.index({ enroll_number: 1 }, { unique: true });

const AttendanceRecord =
  models.AttendanceRecord ||
  model<IAttendanceRecordDocument>("AttendanceRecord", AttendanceRecordSchema);

export default AttendanceRecord;
