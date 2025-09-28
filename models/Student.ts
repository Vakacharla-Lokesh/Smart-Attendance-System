// models/Student.ts
import { Schema, model, models, Document, Types } from "mongoose";

export interface IStudent {
  enroll_number: string;
  name: string;
  card_number: string;
}

export interface IStudentDocument extends IStudent, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudentDocument>(
  {
    enroll_number: {
      type: String,
      required: [true, "Enrollment number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    card_number: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "Student",
  }
);

StudentSchema.index({ enroll_number: 1 }, { unique: true });

const Student =
  models.Student || model<IStudentDocument>("Student", StudentSchema);

export default Student;