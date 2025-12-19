import Attendance from "../models/attendanceModel.js";
import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";

// =========================
// 👩‍🏫 O‘qituvchi bo‘yicha guruhdagi o‘quvchilar
// =========================
export const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user._id; // JWT orqali teacher ID olinadi

    const groups = await Group.find({ teachers: teacherId });

    if (!groups.length) {
      return res.status(404).json({
        message: "Sizga biriktirilgan guruhlar topilmadi",
      });
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
    console.error("getMyStudents error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// 👩‍🏫 Guruh ID bo‘yicha guruh va o‘quvchilar
// =========================
export const getByGroupId = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { groupId } = req.params;

    const group = await Group.findOne({ _id: groupId, teachers: teacherId });
    if (!group) {
      return res.status(404).json({
        message: "Guruh topilmadi yoki sizga tegishli emas",
      });
    }

    const students = await Student.find({ groupId });

    res.json({
      ...group.toObject(),
      students,
    });
  } catch (error) {
    console.error("getByGroupId error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// 📌 Davomat belgilash (bulkWrite)
// =========================
export const markAttendance = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { date, records, groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: "Guruh ID kiritilmadi" });
    }

    const group = await Group.findOne({ _id: groupId, teachers: teacherId });
    if (!group) {
      return res.status(404).json({
        message: "Guruh topilmadi yoki sizga tegishli emas",
      });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Yaroqli sana kiritilmadi" });
    }

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: { studentId: rec.studentId, groupId, date: dateObj },
        update: {
          $set: {
            status: rec.status,
            teacherId,
            date: dateObj,
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(bulkOps);

    res.status(201).json({ message: "Davomat saqlandi", result });
  } catch (error) {
    console.error("markAttendance error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// 📄 Davomat tarixi (o‘qituvchi bo‘yicha)
// =========================
export const getAttendanceHistory = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const records = await Attendance.find({ teacherId })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error("getAttendanceHistory error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// 📄 Guruh bo‘yicha davomat tarixi
// =========================
export const getAttendanceHistoryByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "groupId kiritilishi shart" });
    }

    const students = await Student.find({ groupId }).select("_id");
    const studentIds = students.map((s) => s._id);

    if (!studentIds.length) {
      return res
        .status(404)
        .json({ message: "Ushbu guruhda o‘quvchi topilmadi" });
    }

    const records = await Attendance.find({ studentId: { $in: studentIds } })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error("getAttendanceHistoryByGroup error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// 📄 Guruh ID bo‘yicha attendance
// =========================
export const getAttendanceHistoryByGroupId = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { groupId } = req.params;

    const group = await Group.findOne({ _id: groupId, teachers: teacherId });
    if (!group) {
      return res.status(404).json({
        message: "Guruh topilmadi yoki sizga tegishli emas",
      });
    }

    const records = await Attendance.find({ groupId, teacherId })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error("getAttendanceHistoryByGroupId error:", error);
    res.status(500).json({ message: error.message });
  }
};
