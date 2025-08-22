import Attendance from "../models/attendanceModel.js";
import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";

// ✅ O‘qituvchining guruhidagi o‘quvchilar
export const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const groups = await Group.find({ teacher: teacherId });

    if (!groups.length) {
      return res
        .status(404)
        .json({ message: "Sizga biriktirilgan guruhlar topilmadi" });
    }

    const result = await Promise.all(
      groups.map(async (group) => {
        const students = await Student.find({ groupId: group._id });
        return {
          ...group.toObject(),
          students,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Guruh ID bo‘yicha guruh va o‘quvchilarni olish
export const getByGroupId = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const groupId = req.params.groupId;

    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res
        .status(404)
        .json({ message: "Guruh topilmadi yoki sizga tegishli emas" });
    }

    const students = await Student.find({ groupId });

    res.json({
      ...group.toObject(),
      students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Davomat belgilash (bulkWrite bilan optimallashtirilgan)
export const markAttendance = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { date, records, groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: "Guruh ID kiritilmadi" });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Yaroqli sana kiritilmadi" });
    }

    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res
        .status(404)
        .json({ message: "Guruh topilmadi yoki sizga tegishli emas" });
    }

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: {
          studentId: rec.studentId,
          groupId,
          date: dateObj,
        },
        update: {
          $set: {
            status: rec.status,
            teacherId,
            date: dateObj,
          },
        },
        upsert: true, // mavjud bo‘lmasa yaratadi
      },
    }));

    const result = await Attendance.bulkWrite(bulkOps);
    res.status(201).json({ message: "Davomat saqlandi", result });
  } catch (error) {
    console.error("markAttendance error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Davomat tarixi (o‘qituvchi bo‘yicha)
export const getAttendanceHistory = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const records = await Attendance.find({ teacherId })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Davomat tarixi guruh bo‘yicha
export const getAttendanceHistoryByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "groupId kiritilishi shart" });
    }

    // Guruhdagi barcha o‘quvchilarni olish
    const students = await Student.find({ groupId }).select("_id");
    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) {
      return res
        .status(404)
        .json({ message: "Ushbu guruhda o‘quvchi topilmadi" });
    }

    // Davomat tarixini olish
    const records = await Attendance.find({
      studentId: { $in: studentIds },
    })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error("❌ Davomat tarixini olishda xatolik:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Guruh ID bo‘yicha attendance (agar individual student kerak bo‘lsa)
export const getAttendanceHistoryByGroupId = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const groupId = req.params.groupId;

    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res
        .status(404)
        .json({ message: "Guruh topilmadi yoki sizga tegishli emas" });
    }

    const records = await Attendance.find({ teacherId, groupId })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
