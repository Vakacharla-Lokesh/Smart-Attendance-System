import { Schema, model, models, Document } from "mongoose";

// Define the interface for the Admin document
interface IAdmin extends Document {
  enroll_number: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

const AdminSchema = new Schema<IAdmin>(
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
  },
  {
    timestamps: true,
    collection: "Admin",
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

const Admin = models.Admin || model<IAdmin>("Admin", AdminSchema);

export default Admin;
