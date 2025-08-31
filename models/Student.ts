import { Schema, model } from "mongoose";

const StudentSchema = new Schema({}, { collection: "Student" });

module.exports = model("Student", StudentSchema);
