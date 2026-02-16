import Router from "express";
import { create, edit, getAll } from "./opening.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js"
import { ROLES } from "../../constrants/roles.js";
import authorize from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.CASHIER), create)
router.get("/", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getAll)
router.put("/update/:id", authMiddleware, authorize(ROLES.CASHIER), edit)

export default router;