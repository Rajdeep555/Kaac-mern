import Router from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { getNextCounterfoilNo } from "./checkCounterfoil.controller.js";


const router = Router();

router.get("/generate", authMiddleware, authorize(ROLES.CASHIER), getNextCounterfoilNo);

export default router;