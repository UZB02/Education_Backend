import mongoose from "mongoose";

const roomScheduleSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Virtual field (hozirgi dars aktivligini tekshirish)
roomScheduleSchema.virtual("isActive").get(function () {
  const now = new Date();

  // 🔑 Uzbekistan vaqt zonasi bo‘yicha hafta kuni olish
  const options = { weekday: "long", timeZone: "Asia/Tashkent" };
  const today = new Intl.DateTimeFormat("en-US", options).format(now); // Masalan: "Tuesday"

  // Agar kun mos kelmasa -> false
  if (today !== this.dayOfWeek) return false;

  // Guruhni populate qilingan deb hisoblaymiz
  if (!this.groupId?.startTime || !this.groupId?.endTime) return false;

  // 🔑 Hozirgi vaqt (soat:daqiqa formatida)
  const nowTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tashkent",
  });

  // 🔑 Guruhning vaqtlari bilan solishtirish
  return this.groupId.startTime <= nowTime && nowTime <= this.groupId.endTime;
});

export default mongoose.model("RoomSchedule", roomScheduleSchema);
