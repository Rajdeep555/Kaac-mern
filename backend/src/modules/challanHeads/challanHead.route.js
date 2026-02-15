import Router from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { getAll } from "./challanHead.controller.js";

const router = Router();

router.get("/", authMiddleware, authorize(ROLES.CASHIER), getAll)

export default router;