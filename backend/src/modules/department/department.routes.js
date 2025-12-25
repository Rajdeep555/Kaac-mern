import { Router } from "express";
import { create } from "./department.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.ADMIN), create)

export default router;