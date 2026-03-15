import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    enroll_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    section: {
      type: String,
      trim: true,
    },
    rfid_tag: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    card_number: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
    profile_photo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);


const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
