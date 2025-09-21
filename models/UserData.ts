import { Schema, model, models, Document } from "mongoose";

interface IUser extends Document {
  email_id: string;
  password: string;
  enroll_no: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
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
    toJSON: {
      virtuals: true,
      transform: function (_, ret: Record<string, unknown>) {
        const id = ret._id;
        if (id && typeof id === "string") {
          ret.id = id;
          delete ret._id;
        }
        delete ret.password;
        return ret;
      },
    },
  }
);

UserSchema.index({ email_id: 1 }, { unique: true });
UserSchema.index({ enroll_no: 1 }, { unique: true });

const UserData = models.UserData || model<IUser>("UserData", UserSchema);

export default UserData;
