import { Router } from "express";
import { getAll, create, update, toggleStatus } from "./grant.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.use(authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER));

router.get("/", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), getAll);
router.post("/", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), create);
router.put("/:id", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), update);
router.patch("/:id/toggle", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), toggleStatus);

export default router;