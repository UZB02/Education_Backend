import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lastname: String,
  phone: String,
  location: String,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  description: String,
  admin: String,
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Student", studentSchema);
