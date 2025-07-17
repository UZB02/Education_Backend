import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lastname: String,
  phone: String,
  location: String,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group", // <-- asosiy o'zgarish shu
  },
  status: String,
  description: String,
  admin: String,
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Column",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Application", applicationSchema);
