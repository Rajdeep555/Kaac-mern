import { Router } from "express";
import { create, fetchNextVoucherNo, getAdminExpenditures, getById, getCashierExpenditures, remove, update } from "./expenditure.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

// POST routes
router.post("/create", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), create);

// Specific GET routes FIRST (before /:id)
router.get("/next", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), fetchNextVoucherNo);
router.get("/cashier", authMiddleware, authorize(ROLES.ADMIN, ROLES.CASHIER), getCashierExpenditures);
router.get("/admin", authMiddleware, authorize(ROLES.ADMIN), getAdminExpenditures);

// Generic /:id route LAST
router.get("/:id", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getById);

// PUT routes
router.put("/:id", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), update);
router.delete("/:id", authMiddleware, authorize(ROLES.CASHIER), remove);


export default router;