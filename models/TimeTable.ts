import { Schema, model, models, Document } from "mongoose";

// Define the interface for the TimeTable document
interface ITimeTable extends Document {
  course_id: string;
  day: string;
  start_time: string;
  end_time: string;
  room_number: string;
  created_at: Date;
  updated_at: Date;
}

const TimeTableSchema = new Schema<ITimeTable>(
  {
    course_id: {
      type: String,
      required: [true, "Course ID is required"],
      ref: "Course", // Reference to Course model
    },
    day: {
      type: String,
      required: [true, "Day is required"],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    start_time: {
      type: String,
      required: [true, "Start time is required"],
    },
    end_time: {
      type: String,
      required: [true, "End time is required"],
    },
    room_number: {
      type: String,
      required: [true, "Room number is required"],
    },
  },
  {
    timestamps: true,
    collection: "TimeTable",
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

const TimeTable = models.TimeTable || model<ITimeTable>("TimeTable", TimeTableSchema);

export default TimeTable;
