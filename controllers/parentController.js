import jwt from "jsonwebtoken";
import Student from "../models/studentModel.js";
import Payment from "../models/PaymentModel.js";
import Attendance from "../models/attendanceModel.js";

// 1️⃣ Ota-ona login (telefon raqami orqali farzandlarni topish)
export const parentLogin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Telefon raqam kiritilmadi" });
    }

    const students = await Student.find({ parentPhone: phone }).populate(
      "groupId"
    );

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "Bu raqamga farzand topilmadi" });
    }

    // 🔑 JWT token (portalga kirishda saqlab olish uchun)
    const token = jwt.sign({ phone, role: "parent" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      parentPhone: phone,
      students,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2️⃣ Farzandning to‘lovlari
export const getStudentPayments = async (req, res) => {
  try {
    const studentId = req.params.id;

    const payments = await Payment.find({ studentId }) // ✅ to‘g‘rilandi
      .sort({ paidAt: -1 })
      .populate("studentId", "name lastname"); // ✅ to‘g‘ri field nomi

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 3️⃣ Farzandning davomatlari
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.id;

    const attendance = await Attendance.find({ studentId }) // ✅ to‘g‘rilandi
      .sort({ date: -1 })
      .populate("studentId", "name lastname") // ✅ to‘g‘ri nom
      .populate("groupId", "name");

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4️⃣ Ota-onaning barcha farzandlari (guruh va o‘qituvchi bilan)
export const getChildren = async (req, res) => {
  try {
    const phone = req.parent?.phone;

    if (!phone) {
      return res.status(401).json({ message: "Parent login qilmagan" });
    }

    const students = await Student.find({ parentPhone: phone })
      .populate({
        path: "groupId",
        select: "name scheduleType days monthlyFee teacher", // ✅ teacher
        populate: {
          path: "teacher", // ✅ to‘g‘ri field nomi
          select: "name lastname science phone",
        },
      })
      .sort({ createdAt: -1 });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "Farzandlar topilmadi" });
    }

    // 🔄 Obyektni formatlash
    const response = students.map((student) => ({
      id: student._id,
      name: student.name,
      lastname: student.lastname,
      groups: student.groupId
        ? {
            group: {
              name: student.groupId.name,
              scheduleType: student.groupId.scheduleType,
              days: student.groupId.days,
              monthlyFee: student.groupId.monthlyFee,
              teacher: student.groupId.teacher
                ? {
                    name: student.groupId.teacher.name,
                    lastname: student.groupId.teacher.lastname,
                    science: student.groupId.teacher.science,
                    phone: student.groupId.teacher.phone,
                  }
                : null,
            },
          }
        : null,
    }));

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getChildGroups = async (req, res) => {
  try {
    const studentId = req.params.id;

    // 1️⃣ O‘quvchini topamiz
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "O‘quvchi topilmadi" });
    }

    // 2️⃣ Shu bola bilan bir xil ism/familiya va parentPhone bo‘yicha hamma hujjatlarni topamiz
    const siblings = await Student.find({
      name: student.name,
      lastname: student.lastname,
      parentPhone: student.parentPhone,
    }).populate({
      path: "groupId",
      populate: {
        path: "teacher",
        select: "name lastname science phone",
      },
    });

    // 3️⃣ Hamma guruhlarni yig‘ib chiqamiz
    let groups = siblings.map((s) => s.groupId).filter((g) => g); // null bo‘lsa tashlaymiz

    // 4️⃣ Unikal qilish (group._id bo‘yicha)
    const uniqueGroups = [];
    const seen = new Set();

    for (const group of groups) {
      if (!seen.has(group._id.toString())) {
        seen.add(group._id.toString());
        uniqueGroups.push(group);
      }
    }

    if (uniqueGroups.length === 0) {
      return res.json({
        id: student._id,
        name: student.name,
        lastname: student.lastname,
        groups: [],
        message: "Farzand hali hech qaysi guruhga biriktirilmagan",
      });
    }

    // 5️⃣ Javobni formatlab yuboramiz
    res.json({
      id: student._id,
      name: student.name,
      lastname: student.lastname,
      groups: uniqueGroups.map((group) => ({
        id: group._id,
        name: group.name,
        scheduleType: group.scheduleType,
        days: group.days,
        monthlyFee: group.monthlyFee,
        teacher: group.teacher
          ? {
              name: group.teacher.name,
              lastname: group.teacher.lastname,
              science: group.teacher.science,
              phone: group.teacher.phone,
            }
          : null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
