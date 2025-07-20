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

    const students = await Student.find({ admin: adminId }).populate("groupId");
    res.status(200).json(students);
  } catch (error) {
    console.error("Talabalar olishda xatolik:", error);
    res.status(500).json({ message: "Xatolik yuz berdi", error });
  }
};
