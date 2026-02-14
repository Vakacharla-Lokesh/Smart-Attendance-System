import mongoose from "mongoose";

const punchSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    scanner_id: {
      type: String,
      required: true,
      trim: true,
    },
    punch_type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    punch_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    location: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes only once here - DO NOT use index: true in schema definition
punchSchema.index({ student_id: 1, punch_time: -1 });
punchSchema.index({ scanner_id: 1, punch_time: -1 });
punchSchema.index({ punch_time: -1 });

const Punch = mongoose.models.Punch || mongoose.model("Punch", punchSchema);

export default Punch;
