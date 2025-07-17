import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    applications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admin", // yoki "User" bo‘lsa o‘sha modelni yozing
    },
    createdAtCustom: { type: Date, default: Date.now },
    updatedAtCustom: { type: Date },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
