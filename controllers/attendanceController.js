import Attendance from "../models/attendanceModel.js";
import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";

// ✅ O‘qituvchining guruhidagi o‘quvchilar
export const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // O'qituvchiga biriktirilgan barcha guruhlarni olish
    const groups = await Group.find({ teacher: teacherId });

    if (!groups.length) {
      return res
        .status(404)
        .json({ message: "Sizga biriktirilgan guruhlar topilmadi" });
    }

    // Guruhlar bo‘yicha o‘quvchilarni olish
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

    // Guruhni tekshirish — guruh o‘qituvchiga tegishlimi
    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res.status(404).json({ message: "Guruh topilmadi yoki sizga tegishli emas" });
    }

    // Guruhdagi o‘quvchilarni olish
    const students = await Student.find({ groupId });

    res.json({
      ...group.toObject(),
      students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// ✅ Davomat belgilash
export const markAttendance = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { date, records, groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: "Guruh ID kiritilmadi" });
    }

    // Sana yaroqliligini tekshirish
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Yaroqli sana kiritilmadi" });
    }

    // Guruhni o'qituvchiga tegishli ekanligini tekshirish
    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res.status(404).json({ message: "Guruh topilmadi yoki sizga tegishli emas" });
    }

    const saved = [];

    for (const rec of records) {
      // Bir xil sanada va guruhda o'quvchi uchun davomat borligini tekshirish
      const existing = await Attendance.findOne({
        studentId: rec.studentId,
        groupId: groupId,
        date: dateObj,
      });

      if (existing) {
        existing.status = rec.status;
        await existing.save();
        saved.push(existing);
      } else {
        const att = new Attendance({
          studentId: rec.studentId,
          groupId,
          teacherId,
          date: dateObj,
          status: rec.status,
        });
        saved.push(await att.save());
      }
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error("markAttendance error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Davomat tarixi
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

export const getAttendanceHistoryByGroupId = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const groupId = req.params.groupId;

    // Avvalo guruh o'qituvchiga tegishli ekanligini tekshirish
    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res
        .status(404)
        .json({ message: "Guruh topilmadi yoki sizga tegishli emas" });
    }

    // Guruh bo‘yicha davomatlarni olish
    const records = await Attendance.find({ teacherId, groupId })
      .populate("studentId", "name lastname")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

