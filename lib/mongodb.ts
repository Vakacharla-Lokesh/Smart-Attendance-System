import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

async function connectDB() {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI);
    return connection;
  } catch (error) {
    throw error;
  }
}

export default connectDB;
