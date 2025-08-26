// routes/roomRoutes.js
import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  assignSchedule,
  getRoomSchedule,
} from "../controllers/roomController.js";

const router = express.Router();

// Room CRUD
router.post("/", createRoom);
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

// Schedule
router.post("/schedule", assignSchedule);
router.get("/:roomId/schedule", getRoomSchedule);

export default router;
