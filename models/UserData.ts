// models/UserData.ts
import { Schema, model, models, Document, Types } from "mongoose";

export interface IUser {
  email_id: string;
  password: string;
  enroll_no: string;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email_id: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    enroll_no: {
      type: String,
      required: [true, "Enrollment number is required"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "UserData",
  }
);

UserSchema.index({ email_id: 1 }, { unique: true });
UserSchema.index({ enroll_no: 1 }, { unique: true });

const UserData =
  models.UserData || model<IUserDocument>("UserData", UserSchema);

export default UserData;
