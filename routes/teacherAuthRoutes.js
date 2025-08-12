import express from "express";
import { loginTeacher } from "../controllers/teacherAuthController.js";

const router = express.Router();

router.post("/login", loginTeacher);

export default router;
