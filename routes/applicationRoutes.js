import express from "express";
import {
  getByAdmin,
  addApplication,
  updateColumn,
  updateApplicationStatus,
  updateApplication,
  deleteApplication
} from "../controllers/applicationController.js";

const router = express.Router();

router.get("/:adminId", getByAdmin);
router.post("/", addApplication);
router.delete("/:id", deleteApplication);
router.put("/:id/move", updateColumn);
router.put("/:id/status", updateApplicationStatus);
router.put("/:id", updateApplication);

export default router;
