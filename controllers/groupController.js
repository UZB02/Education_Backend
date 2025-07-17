import Group from "../models/groupModel.js";
import Application from "../models/Application.js";

// GET: get all groups by adminId (from query)
export const getAllGroups = async (req, res) => {
  try {
    const adminId = req.query.adminId;
    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    // 1. Barcha guruhlarni olamiz
    const groups = await Group.find({ admin: adminId }).populate("teacher");

    // 2. Har bir guruh uchun groupId asosida applicationsni qo‘shamiz
    const groupsWithApplications = await Promise.all(
      groups.map(async (group) => {
        const applications = await Application.find({ groupId: group._id });
        return {
          ...group.toObject(), // group ni oddiy JS objectga aylantiramiz
          applications, // qo‘shamiz
        };
      })
    );

    res.json(groupsWithApplications);
  } catch (error) {
    console.error("❌ getAllGroups xatolik:", error);
    res.status(500).json({ message: "Error fetching groups", error });
  }
};

// GET: get one group by ID and adminId
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const group = await Group.findOne({ _id: id, admin: adminId })
      .populate("teacher")
      .populate("students");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: "Error fetching group", error });
  }
};

// POST: create group with adminId (from body)
export const createGroup = async (req, res) => {
  try {
    const { name, description, students, teacher, adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const newGroup = new Group({
      name,
      description,
      students,
      teacher,
      admin: adminId,
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
    const { name, description, students, teacher, adminId } = req.body;
    const { id } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required" });
    }

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: id, admin: adminId },
      {
        name,
        description,
        students,
        teacher,
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
