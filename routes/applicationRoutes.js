import express from "express";
import {
  getByAdmin,
  addApplication,
  updateColumn,
  updateApplicationStatus
} from "../controllers/applicationController.js";

const router = express.Router();

router.get("/:adminId", getByAdmin);
router.post("/", addApplication);
router.put("/:id/move", updateColumn);
router.put("/:id/status", updateApplicationStatus);

export default router;
