import Teacher from "../models/teacherModel.js";

// GET: Barcha o'qituvchilarni olish
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ message: "O'qituvchilarni olishda xatolik", error });
  }
};

// POST: Yangi o'qituvchi qo'shish
export const createTeacher = async (req, res) => {
  try {
    const { name, lastname, science } = req.body;

    if (!name || !lastname || !science) {
      return res
        .status(400)
        .json({ message: "Barcha maydonlar to‘ldirilishi shart" });
    }

    const newTeacher = new Teacher({ name, lastname, science });
    await newTeacher.save();

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ message: "O'qituvchini yaratishda xatolik", error });
  }
};

// DELETE: O'qituvchini o'chirish
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    await Teacher.findByIdAndDelete(id);
    res.json({ message: "O'qituvchi o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: "O'chirishda xatolik", error });
  }
};
