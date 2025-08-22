import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admin",
    },
    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },
    // 📌 yangi maydonlar
    scheduleType: {
      type: String,
      enum: ["toq", "juft", "custom"],
      default: "custom",
    },
    days: [
      {
        type: String,
        enum: [
          "Dushanba",
          "Seshanba",
          "Chorshanba",
          "Payshanba",
          "Juma",
          "Shanba",
          "Yakshanba",
        ],
      },
    ],

    createdAtCustom: {
      type: Date,
      default: Date.now,
    },
    updatedAtCustom: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
