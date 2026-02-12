import Router from "express";
import { getAll } from "./grant.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";


const router = Router();

router.use("/", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), getAll)

export default router;