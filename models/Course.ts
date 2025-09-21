import { Schema, model, models, Document } from "mongoose";

interface ICourse extends Document {
  name: string;
  course_id: string;
  created_at: Date;
  updated_at: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
    },
    course_id: {
      type: String,
      required: [true, "Course ID is required"],
      unique: true,
    },
  },
  {
    timestamps: true,
    collection: "Course",
    toJSON: {
      virtuals: true,
      transform: function (_, ret: Record<string, unknown>) {
        const id = ret._id;
        if (id && typeof id === 'string') {
          ret.id = id;
          delete ret._id;
        }
        return ret;
      },
    },
  }
);

const Course = models.Course || model<ICourse>("Course", CourseSchema);

export default Course;
