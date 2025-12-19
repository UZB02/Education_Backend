import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";
import { calculatePaymentStatus } from "../helpers/paymentHelper.js";

/* =========================
   ⏱ Time helper
========================= */
const to24HourFormat = (time) => {
  if (!time) return null;

  // 24h format: HH:mm
  const match24 = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (match24) return time;

  // 12h format: hh:mm AM/PM
  const match12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match12) return null;

  let hours = parseInt(match12[1], 10);
  const minutes = match12[2];
  const period = match12[3].toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

/* =========================
   GET all groups (by admin)
========================= */
export const getAllGroups = async (req, res) => {
  try {
    const { adminId } = req.query;
    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const groups = await Group.find({ admin: adminId }).populate("teachers");

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
    console.error("❌ getAllGroups error:", error);
    res.status(500).json({ message: "Error fetching groups" });
  }
};

/* =========================
   GET group by ID
========================= */
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const group = await Group.findOne({
      _id: id,
      admin: adminId,
    }).populate("teachers");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const students = await Student.find({ groupId: id });

    const studentsWithPaymentStatus = await Promise.all(
      students.map(async (student) => {
        const status = await calculatePaymentStatus(student, group);
        return {
          ...student.toObject(),
          paymentStatus: status,
        };
      })
    );

    res.json({
      ...group.toObject(),
      students: studentsWithPaymentStatus,
    });
  } catch (error) {
    console.error("❌ getGroupById error:", error);
    res.status(500).json({ message: "Error fetching group" });
  }
};

/* =========================
   CREATE group
========================= */
export const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      teachers,
      monthlyFee,
      adminId,
      scheduleType = "custom",
      days,
      startTime,
      endTime,
    } = req.body;

    if (!name || !monthlyFee || !adminId || !startTime || !endTime) {
      return res.status(400).json({
        message: "name, monthlyFee, adminId, startTime, endTime majburiy",
      });
    }

    if (teachers && !Array.isArray(teachers)) {
      return res.status(400).json({
        message: "teachers must be an array",
      });
    }

    const finalStartTime = to24HourFormat(startTime);
    const finalEndTime = to24HourFormat(endTime);

    if (!finalStartTime || !finalEndTime) {
      return res.status(400).json({
        message: "startTime yoki endTime noto‘g‘ri formatda",
      });
    }

    let finalDays = [];
    if (scheduleType === "toq") {
      finalDays = ["Dushanba", "Chorshanba", "Juma"];
    } else if (scheduleType === "juft") {
      finalDays = ["Seshanba", "Payshanba", "Shanba"];
    } else if (scheduleType === "custom") {
      if (!days || !Array.isArray(days) || days.length === 0) {
        return res.status(400).json({
          message: "Custom schedule uchun days array majburiy",
        });
      }
      finalDays = days;
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description || "",
      teachers: teachers || [],
      monthlyFee,
      admin: adminId,
      scheduleType,
      days: finalDays,
      startTime: finalStartTime,
      endTime: finalEndTime,
      createdAtCustom: new Date(),
      updatedAtCustom: new Date(),
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    console.error("❌ createGroup error:", error);
    res.status(500).json({ message: "Error creating group" });
  }
};

/* =========================
   UPDATE group
========================= */
export const updateGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      teachers,
      monthlyFee,
      adminId,
      scheduleType,
      days,
      startTime,
      endTime,
    } = req.body;

    const { id } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    if (teachers && !Array.isArray(teachers)) {
      return res.status(400).json({ message: "teachers must be an array" });
    }

    const finalStartTime = to24HourFormat(startTime);
    const finalEndTime = to24HourFormat(endTime);

    if (!finalStartTime || !finalEndTime) {
      return res.status(400).json({
        message: "startTime yoki endTime noto‘g‘ri formatda",
      });
    }

    let finalDays = [];
    if (scheduleType === "toq") {
      finalDays = ["Dushanba", "Chorshanba", "Juma"];
    } else if (scheduleType === "juft") {
      finalDays = ["Seshanba", "Payshanba", "Shanba"];
    } else if (scheduleType === "custom") {
      if (!days || !Array.isArray(days) || days.length === 0) {
        return res.status(400).json({
          message: "Custom schedule requires days array",
        });
      }
      finalDays = days;
    }

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: id, admin: adminId },
      {
        name,
        description,
        teachers,
        monthlyFee,
        scheduleType,
        days: finalDays,
        startTime: finalStartTime,
        endTime: finalEndTime,
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
    console.error("❌ updateGroup error:", error);
    res.status(500).json({ message: "Error updating group" });
  }
};

/* =========================
   DELETE group
========================= */
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
    console.error("❌ deleteGroup error:", error);
    res.status(500).json({ message: "Error deleting group" });
  }
};
