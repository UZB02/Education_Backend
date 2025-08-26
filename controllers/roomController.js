// controllers/roomController.js
import Room from "../models/roomModel.js";
import RoomSchedule from "../models/roomScheduleModel.js";

// ---------------- CREATE ROOM ----------------
export const createRoom = async (req, res) => {
  try {
    const { name, capacity, description, userId } = req.body;

    if (!name || !capacity || !userId) {
      return res.status(400).json({
        message: "❌ Name, capacity va userId majburiy maydonlar",
      });
    }

    const room = new Room({ name, capacity, description, userId });
    await room.save();

    res.status(201).json({ message: "✅ Room created successfully", room });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to create room",
      error: error.message,
    });
  }
};

// ---------------- GET ALL ROOMS (faqat admin xonalari) ----------------
export const getRooms = async (req, res) => {
  try {
    const { adminId } = req.query; // frontenddan yuboriladi

    if (!adminId) {
      return res.status(400).json({ message: "❌ adminId talab qilinadi" });
    }

    const rooms = await Room.find({ userId: adminId }).populate(
      "userId",
      "name email"
    );

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch rooms",
      error: error.message,
    });
  }
};

// ---------------- GET ROOM BY ID (faqat admin o‘z xonasini ko‘rsin) ----------------
export const getRoomById = async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ message: "❌ adminId talab qilinadi" });
    }

    const room = await Room.findOne({
      _id: req.params.id,
      userId: adminId,
    }).populate("userId", "name email");

    if (!room) {
      return res
        .status(404)
        .json({ message: "❌ Room not found or access denied" });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch room",
      error: error.message,
    });
  }
};

// ---------------- UPDATE ROOM ----------------
export const updateRoom = async (req, res) => {
  try {
    const { name, capacity, description } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { name, capacity, description },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "❌ Room not found" });
    }

    res.status(200).json({ message: "✅ Room updated successfully", room });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to update room",
      error: error.message,
    });
  }
};

// ---------------- DELETE ROOM ----------------
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "❌ Room not found" });
    }

    res.status(200).json({ message: "✅ Room deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to delete room",
      error: error.message,
    });
  }
};

// ---------------- ASSIGN SCHEDULE TO ROOM ----------------
export const assignSchedule = async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, subject, teacher } = req.body;

    if (!roomId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "❌ roomId, date, startTime va endTime majburiy maydonlar",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "❌ Room not found" });
    }

    const schedule = new RoomSchedule({
      roomId,
      date,
      startTime,
      endTime,
      subject,
      teacher,
    });

    await schedule.save();

    res.status(201).json({
      message: "✅ Schedule assigned successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to assign schedule",
      error: error.message,
    });
  }
};

// ---------------- GET ROOM SCHEDULE ----------------
export const getRoomSchedule = async (req, res) => {
  try {
    const { roomId } = req.params;

    const schedules = await RoomSchedule.find({ roomId }).populate(
      "roomId",
      "name capacity description"
    );

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch schedules",
      error: error.message,
    });
  }
};
