import { Schema, model, models, Document } from "mongoose";

// Define the interface for the Student document
interface IStudent extends Document {
  enroll_number: string;
  name: string;
  card_number: string;
  created_at: Date;
  updated_at: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    enroll_number: {
      type: String,
      required: [true, "Enrollment number is required"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    card_number: {
      type: String,
      required: [true, "Card number is required"],
      unique: true,
    },
  },
  {
    timestamps: true,
    collection: "Student",
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        delete ret._id;
        // delete ret?.__v;
        return ret;
      },
    },
  }
);

// Prevent model recompilation error in development
const Student = models.Student || model<IStudent>("Student", StudentSchema);

export default Student;
