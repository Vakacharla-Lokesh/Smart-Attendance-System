// models/Course.ts
import { Schema, model, models, Document } from "mongoose";

interface ICourse extends Document {
  course_code: string;
  course_name: string;
  department: string;
  credits: number;
  instructor_name?: string;
  instructor_email?: string;
  year: number;
  semester: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    course_code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    course_name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: 1,
      max: 10,
    },
    instructor_name: {
      type: String,
      trim: true,
    },
    instructor_email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: 1,
      max: 5,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: 1,
      max: 8,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "Course",
    toJSON: {
      virtuals: true,
      transform: function (_, ret: Record<string, unknown>) {
        const id = ret._id;
        if (id && typeof id === "string") {
          ret.id = id;
          delete ret._id;
        }
        return ret;
      },
    },
  },
);

// Indexes
CourseSchema.index({ course_code: 1 }, { unique: true });
CourseSchema.index({ department: 1 });
CourseSchema.index({ year: 1, semester: 1 });

const Course = models.Course || model<ICourse>("Course", CourseSchema);

export default Course;
