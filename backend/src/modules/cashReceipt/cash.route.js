import Router from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { create, getAll, getByCounterfoilNo, getById, getPending, getPendingCount, update } from "./cash.controller.js";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.CASHIER), create)
router.put("/update/:id", authMiddleware, authorize(ROLES.CASHIER), update)
router.get("/get/:id", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getById)
router.get("/pending/count", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getPendingCount);
router.get("/pending", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getPending);
router.get("/", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getAll)
router.get("/counterfoilNo/:counterfoilNo", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getByCounterfoilNo)


export default router;