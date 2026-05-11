import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { create, getAll, update, toggleStatus } from "./user.controller.js";
import { ROLES } from "../../constrants/roles.js";

const router = express.Router();

router.post("/", authMiddleware, authorize(ROLES.ADMIN), create);
router.get("/", authMiddleware, authorize(ROLES.ADMIN), getAll);
router.put("/:id", authMiddleware, authorize(ROLES.ADMIN), update);
router.put("/:id/toggle", authMiddleware, authorize(ROLES.ADMIN), toggleStatus);

export default router;