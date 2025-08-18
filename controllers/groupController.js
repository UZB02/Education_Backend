import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";
import { calculatePaymentStatus } from "../helpers/paymentHelper.js";

// GET: get all groups by adminId (from query)
export const getAllGroups = async (req, res) => {
  try {
    const adminId = req.query.adminId;
    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // 1. Barcha guruhlarni olamiz
    const groups = await Group.find({ admin: adminId }).populate("teacher");

    // 2. Har bir guruh uchun groupId asosida studentlarni qo‘shamiz
    const groupsWithStudents = await Promise.all(
      groups.map(async (group) => {
        const students = await Student.find({ groupId: group._id });
        return {
          ...group.toObject(),
          students,
        };
      })
    );

    res.json(groupsWithStudents);
  } catch (error) {
    console.error("❌ getAllGroups xatolik:", error);
    res.status(500).json({ message: "Error fetching groups", error });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // Guruhni topamiz
    const group = await Group.findOne({ _id: id, admin: adminId }).populate(
      "teacher"
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Shu guruhdagi studentlarni olamiz
    const students = await Student.find({ groupId: id });

    // Har bir student uchun paymentStatus hisoblaymiz
    const studentsWithPaymentStatus = await Promise.all(
      students.map(async (student) => {
        const status = await calculatePaymentStatus(student, group);
        return {
          ...student.toObject(),
          paymentStatus: status,
        };
      })
    );

    // Natijani qaytaramiz
    res.json({
      ...group.toObject(),
      students: studentsWithPaymentStatus,
    });
  } catch (error) {
    console.error("getGroupById error:", error);
    res.status(500).json({ message: "Error fetching group", error });
  }
};



// POST: create group with adminId (from body)
export const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      teacher,
      monthlyFee,
      adminId,
      scheduleType,
      days,
    } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // Agar custom bo‘lsa -> days kerak
    if (scheduleType === "custom" && (!days || days.length === 0)) {
      return res
        .status(400)
        .json({ message: "Custom schedule requires days array" });
    }

    // Agar toq/juft bo‘lsa -> avtomatik belgilaymiz
    let finalDays = days;
    if (scheduleType === "toq") {
      finalDays = ["Dushanba", "Chorshanba", "Juma"];
    } else if (scheduleType === "juft") {
      finalDays = ["Seshanba", "Payshanba", "Shanba"];
    }

    const newGroup = new Group({
      name,
      monthlyFee,
      description,
      teacher,
      admin: adminId,
      scheduleType,
      days: finalDays,
      createdAtCustom: new Date(),
      updatedAtCustom: new Date(),
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(400).json({ message: "Error creating group", error });
  }
};

// PUT: update group only if adminId matches
export const updateGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      teacher,
      monthlyFee,
      adminId,
      scheduleType,
      days,
    } = req.body;
    const { id } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // scheduleType asosida finalDays
    let finalDays = days;
    if (scheduleType === "toq") {
      finalDays = ["Dushanba", "Chorshanba", "Juma"];
    } else if (scheduleType === "juft") {
      finalDays = ["Seshanba", "Payshanba", "Shanba"];
    } else if (scheduleType === "custom" && (!days || days.length === 0)) {
      return res
        .status(400)
        .json({ message: "Custom schedule requires days array" });
    }

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: id, admin: adminId },
      {
        name,
        monthlyFee,
        description,
        teacher,
        scheduleType,
        days: finalDays,
        updatedAtCustom: new Date(),
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res
        .status(404)
        .json({ message: "Group not found or access denied" });
    }

    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: "Error updating group", error });
  }
};

// DELETE: delete group only if adminId matches
export const deleteGroup = async (req, res) => {
  try {
    const { adminId } = req.query;
    const { id } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const deletedGroup = await Group.findOneAndDelete({
      _id: id,
      admin: adminId,
    });

    if (!deletedGroup) {
      return res
        .status(404)
        .json({ message: "Group not found or access denied" });
    }

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting group", error });
  }
};
