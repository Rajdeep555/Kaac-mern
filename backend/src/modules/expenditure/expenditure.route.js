import { Router } from "express";
import { create } from "./expenditure.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.CASHIER), create);

export default router;