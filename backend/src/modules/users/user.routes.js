import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { create } from "./user.controller.js";
import { ROLES } from "../../constrants/roles.js";

const router = express.Router();

router.post("/", authMiddleware, authorize(ROLES.ADMIN), create)

export default router;