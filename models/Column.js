import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // har bir foydalanuvchining ustuni
});

export default mongoose.model("Column", columnSchema);
