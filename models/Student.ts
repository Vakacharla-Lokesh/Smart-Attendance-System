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
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    rfid_tag: {
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
  },
  {
    timestamps: true,
  },
);

studentSchema.index({ enroll_number: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ rfid_tag: 1 });
studentSchema.index({ course: 1, year: 1, section: 1 });

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
