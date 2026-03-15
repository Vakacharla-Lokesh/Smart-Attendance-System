import { Schema, model, models, Document, Types } from "mongoose";

// Define the interface for the TimeTable document
interface ITimeTable extends Document {
  room_id: Types.ObjectId;
  course_id: Types.ObjectId;
  day: string;
  start_time: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;
}

const TimeTableSchema = new Schema<ITimeTable>(
  {
    room_id: {
      type: Schema.Types.ObjectId,
      required: [true, "Room ID is required"],
      ref: "Room",
    },
    course_id: {
      type: Schema.Types.ObjectId,
      required: [true, "Course ID is required"],
      ref: "Course",
    },
    day: {
      type: String,
      required: [true, "Day is required"],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    start_time: {
      type: Date,
      required: [true, "Start time is required"],
    },
    end_time: {
      type: Date,
      required: [true, "End time is required"],
    },
  },
  {
    timestamps: true,
    collection: "TimeTable",
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

TimeTableSchema.index({ room_id: 1, day: 1 });
TimeTableSchema.index({ course_id: 1 });

const TimeTable =
  models.TimeTable || model<ITimeTable>("TimeTable", TimeTableSchema);

export default TimeTable;
