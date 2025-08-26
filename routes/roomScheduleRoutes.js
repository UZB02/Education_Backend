import express from "express";
import {
  assignGroupToRoom,
  getRoomSchedule,
  getAllSchedules,
  deleteGroupFromRoom,
} from "../controllers/roomScheduleController.js";

const router = express.Router();

// Guruhni xonaga biriktirish (avtomatik kun/vaqt bilan)
router.post("/assign", assignGroupToRoom);

// Barcha xonalar jadvali
router.get("/", getAllSchedules);

// Bitta xona jadvali
router.get("/:roomId", getRoomSchedule);

// Jadvalni o‘chirish
router.delete("/:roomId/group/:groupId", deleteGroupFromRoom);

export default router;
