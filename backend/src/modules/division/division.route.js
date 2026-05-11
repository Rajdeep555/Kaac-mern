import { Router } from "express";
import { create, getAll, update, toggleStatus } from "./division.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.ADMIN), create);
router.get("/", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), getAll);
router.put("/:id", authMiddleware, authorize(ROLES.ADMIN), update);
router.put("/:id/toggle", authMiddleware, authorize(ROLES.ADMIN), toggleStatus);

export default router;