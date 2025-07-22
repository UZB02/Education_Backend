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
    ref: "Group",
    default: null,
  },
  status: {
    type: String,
    enum: ["new", "active"], // faqat ushbu qiymatlar qabul qilinadi
    default: "new", // ixtiyoriy: standart qiymat
  },
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
