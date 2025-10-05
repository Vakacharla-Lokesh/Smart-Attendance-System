import { Schema, model, models, Document, Types } from "mongoose";

interface IPunchRecord {
  enroll_number: string;
  card_number: string;
  date: Date;
}

export interface IPunchRecordDocument extends IPunchRecord, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PunchRecordSchema = new Schema<IPunchRecordDocument>(
  {
    enroll_number: {
      type: String,
      required: [true, "Enrollment number is required"],
      index: true,
    },
    card_number: {
      type: String,
      required: [true, "Card number is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "PunchRecord",
    toJSON: {
      virtuals: true,
      transform: function (_, ret: Record<string, unknown>) {
        if (ret._id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ret as any).id = (ret as any)._id?.toString?.();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const PunchRecord = models.PunchRecord || model<IPunchRecordDocument>("PunchRecord", PunchRecordSchema);

export default PunchRecord;
