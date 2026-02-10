import { Router } from "express";
import { create, getAll } from "./planNonPlan.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.post('/create', authMiddleware, authorize(ROLES.ADMIN), create)
router.get('/', authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), getAll)

export default router;