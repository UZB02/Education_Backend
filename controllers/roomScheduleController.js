// controllers/roomScheduleController.js
import Group from "../models/groupModel.js";
import RoomSchedule from "../models/roomScheduleModel.js";

// Uzbek → English kunlar xaritasi
const dayMap = {
  Dushanba: "Monday",
  Seshanba: "Tuesday",
  Chorshanba: "Wednesday",
  Payshanba: "Thursday",
  Juma: "Friday",
  Shanba: "Saturday",
  Yakshanba: "Sunday",
};


// ✅ Vaqtlarni stringdan "HH:MM" -> daqiqaga aylantiramiz
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// ✅ Guruhni xonaga biriktirish
export const assignGroupToRoom = async (req, res) => {
  try {
    const { roomId, groupId, userId } = req.body;

    if (!userId) return res.status(400).json({ message: "❌ userId kerak" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "❌ Guruh topilmadi" });

    // 1. Avval to‘liq tekshiruv
    for (let uzDay of group.days) {
      const enDay = dayMap[uzDay];

      const existingSchedules = await RoomSchedule.find({
        roomId,
        dayOfWeek: enDay,
        userId,
      }).populate("groupId", "name startTime endTime");

      for (let sch of existingSchedules) {
        const newStart = toMinutes(group.startTime);
        const newEnd = toMinutes(group.endTime);
        const existingStart = toMinutes(sch.groupId.startTime);
        const existingEnd = toMinutes(sch.groupId.endTime);

        // 1) Shu guruh allaqachon biriktirilgan bo‘lsa
        if (sch.groupId._id.toString() === groupId) {
          return res.status(400).json({
            message: `❌ ${uzDay} kuni guruh allaqachon ${
              sch.roomId?.name || "xona"
            }ga biriktirilgan`,
          });
        }

        // 2) Vaqtlar kesishsa
        if (newStart < existingEnd && newEnd > existingStart) {
          return res.status(400).json({
            message: `❌ ${uzDay} kuni ${sch.roomId?.name || "xona"} band: ${
              sch.groupId.name
            } (${sch.groupId.startTime} - ${sch.groupId.endTime})`,
          });
        }
      }
    }

    // 2. Agar hammasi yaxshi bo‘lsa — yozamiz
    const schedules = await Promise.all(
      group.days.map((uzDay) => {
        const enDay = dayMap[uzDay];
        return RoomSchedule.create({
          roomId,
          groupId,
          dayOfWeek: enDay,
          userId,
        });
      })
    );

    res.status(201).json({ message: "✅ Guruh jadvali qo‘shildi", schedules });
  } catch (error) {
    res
      .status(500)
      .json({ message: "❌ Server xatoligi", error: error.message });
  }
};




// ✅ Bitta xona jadvalini olish
export const getRoomSchedule = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ message: "❌ userId kerak" });

    const schedules = await RoomSchedule.find({ roomId, userId })
      .populate("roomId", "name capacity")
      .populate({
        path: "groupId",
        populate: {
          path: "teachers",
          select: "name lastname phone", // faqat kerakli maydonlar
        },
      })
      .sort({ dayOfWeek: 1 }); // vaqt endi Group dan olinadi

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({
      message: "❌ Xona jadvalini olishda xato",
      error: error.message,
    });
  }
};

// ✅ Barcha xonalar jadvalini olish
export const getAllSchedules = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ message: "❌ userId kerak" });

    const schedules = await RoomSchedule.find({ userId })
      .populate("roomId", "name capacity")
      .populate({
        path: "groupId",
        populate: {
          path: "teachers",
          select: "name lastname phone", // faqat kerakli maydonlar
        },
      });

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({
      message: "❌ Barcha jadvallarni olishda xato",
      error: error.message,
    });
  }
};

// ✅ Jadvalni o‘chirish
export const deleteGroupFromRoom = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;

    const result = await RoomSchedule.deleteMany({ roomId, groupId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "❌ Bu guruh xonaga biriktirilmagan" });
    }

    res.json({ message: "✅ Guruh xonadan olib tashlandi" });
  } catch (error) {
    res.status(500).json({
      message: "❌ Guruhni xonadan olib tashlashda xato",
      error: error.message,
    });
  }
};


