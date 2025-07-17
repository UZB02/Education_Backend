import mongoose from "mongoose";
import Application from "./Application.js"; // Application modelini import qilish

const columnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Column o'chirilganda unga bog'liq Applicationlar ham o'chadi
columnSchema.pre("findOneAndDelete", async function (next) {
  const columnId = this.getQuery()._id;
  await Application.deleteMany({ columnId });
  next();
});

export default mongoose.model("Column", columnSchema);
