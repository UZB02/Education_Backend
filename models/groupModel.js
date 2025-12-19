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
    teachers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Teacher",
        },
      ],
      default: [],
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

    // Guruh dars kunlari
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

    // 📌 Guruh dars vaqti
    startTime: {
      type: String, // masalan: "14:00"
      required: true,
    },
    endTime: {
      type: String, // masalan: "16:00"
      required: true,
    },

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
