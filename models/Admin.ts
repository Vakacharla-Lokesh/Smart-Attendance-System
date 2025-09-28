// models/Admin.ts
import { Schema, model, models, Document, Types } from "mongoose";

export interface IAdmin {
  enroll_number: string;
  name: string;
}

export interface IAdminDocument extends IAdmin, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDocument>(
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
  },
  {
    timestamps: true,
    collection: "Admin",
  }
);

AdminSchema.index({ enroll_number: 1 }, { unique: true });

const Admin = models.Admin || model<IAdminDocument>("Admin", AdminSchema);

export default Admin;
