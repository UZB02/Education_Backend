import express from "express";
import {
  getByAdmin,
  addApplication,
  updateColumn,
} from "../controllers/applicationController.js";

const router = express.Router();

router.get("/:adminId", getByAdmin);
router.post("/", addApplication);
router.put("/:id/move", updateColumn);

export default router;
