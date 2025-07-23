import Application from "../models/Application.js";
import Student from "../models/studentModel.js";

// Active bo'lgan applicationlarni studentsga qo'shish
export const importActiveApplications = async (req, res) => {
  try {
    const activeApplications = await Application.find({ status: "active" });

    const studentDocs = activeApplications.map((app) => ({
      name: app.name,
      lastname: app.lastname,
      phone: app.phone,
      location: app.location,
      groupId: app.groupId,
      description: app.description,
      admin: app.admin,
      applicationId: app._id,
    }));

    const insertedStudents = await Student.insertMany(studentDocs);

    return res.status(201).json({
      message: `${insertedStudents.length} ta student qo'shildi`,
      data: insertedStudents,
    });
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// Barcha studentlarni olish
export const getAllStudents = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find({ admin: adminId })
        .populate("groupId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Student.countDocuments({ admin: adminId }),
    ]);

    res.status(200).json({
      students,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Studentlarni olishda xatolik:", error);
    res.status(500).json({ message: "Xatolik yuz berdi", error });
  }
};

// Yangi student qo‘shish
export const addStudent = async (req, res) => {
  try {
    const { name, lastname, phone, location, groupId, description, admin, applicationId } = req.body;

    if (!name || !lastname || !groupId || !admin) {
      return res.status(400).json({ message: "Majburiy maydonlar to‘ldirilmagan" });
    }

    const newStudent = await Student.create({
      name,
      lastname,
      phone,
      location,
      groupId,
      description,
      admin,
      // applicationId,
    });

    res.status(201).json({
      message: "O‘quvchi muvaffaqiyatli qo‘shildi",
      student: newStudent,
    });
  } catch (error) {
    console.error("O‘quvchi qo‘shishda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// Studentni o‘chirish
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student topilmadi" });
    }

    res.status(200).json({
      message: "O‘quvchi muvaffaqiyatli o‘chirildi",
      student: deletedStudent,
    });
  } catch (error) {
    console.error("O‘quvchini o‘chirishda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// Studentni yangilash
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      lastname,
      phone,
      location,
      groupId,
      description,
      admin,
    } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        name,
        lastname,
        phone,
        location,
        groupId,
        description,
        admin,
      },
      { new: true } // yangilangan versiyani qaytaradi
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student topilmadi" });
    }

    res.status(200).json({
      message: "O‘quvchi ma'lumotlari yangilandi",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("O‘quvchini yangilashda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};

// ID bo‘yicha bitta studentni olish
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate("groupId");

    if (!student) {
      return res.status(404).json({ message: "Student topilmadi" });
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error("Studentni olishda xatolik:", error);
    res.status(500).json({ message: "Serverda xatolik yuz berdi", error });
  }
};
