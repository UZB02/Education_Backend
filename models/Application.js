import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  name: String,
  lastname: String,
  phone: String,
  location: String,
  gurup: String,
  status: String,
  description: String,
  admin: String,
  createdAt: { type: Date, default: Date.now },
  columnId: { type: mongoose.Schema.Types.ObjectId, ref: "Column" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // kim qo'shgan
});

export default mongoose.model("Application", applicationSchema);
