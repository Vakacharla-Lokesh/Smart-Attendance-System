import { Schema, model, models, Document } from "mongoose";

interface IRoom extends Document {
  room_number: string;
  building: string;
  floor: string;
  scanner_id: string; // IoT device ID for this room
  latitude: number;
  longitude: number;
  geofence_radius: number; // in meters
  created_at: Date;
  updated_at: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    room_number: {
      type: String,
      required: [true, "Room number is required"],
      unique: true,
      trim: true,
    },
    building: {
      type: String,
      required: [true, "Building is required"],
      trim: true,
    },
    floor: {
      type: String,
      required: [true, "Floor is required"],
      trim: true,
    },
    scanner_id: {
      type: String,
      required: [true, "Scanner ID is required"],
      unique: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      validate: {
        validator: (v: number) => v >= -90 && v <= 90,
        message: "Latitude must be between -90 and 90",
      },
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      validate: {
        validator: (v: number) => v >= -180 && v <= 180,
        message: "Longitude must be between -180 and 180",
      },
    },
    geofence_radius: {
      type: Number,
      required: [true, "Geofence radius is required"],
      default: 50, // 50 meters by default
      validate: {
        validator: (v: number) => v > 0,
        message: "Geofence radius must be positive",
      },
    },
  },
  {
    timestamps: true,
    collection: "Room",
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
  }
);

// Create geospatial index for location queries
RoomSchema.index({ latitude: "2d", longitude: "2d" });
RoomSchema.index({ scanner_id: 1 }, { unique: true });

const Room = models.Room || model<IRoom>("Room", RoomSchema);

export default Room;