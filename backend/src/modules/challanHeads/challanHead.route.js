import Router from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

import authorize from "../../middlewares/role.middleware.js";

import { ROLES } from "../../constrants/roles.js";

import {
    getAll,
    create,
    getById,
    update,
    remove,
} from "./challanHead.controller.js";

const router = Router();

// ─────────────────────────────────────────────
// Get All Heads
// CASHIER + ADMIN
// ─────────────────────────────────────────────
router.get(
    "/",
    authMiddleware,
    authorize(ROLES.CASHIER, ROLES.ADMIN),
    getAll,
);

// ─────────────────────────────────────────────
// Create Head
// ADMIN ONLY
// ─────────────────────────────────────────────
router.post(
    "/create",
    authMiddleware,
    authorize(ROLES.ADMIN),
    create,
);

// ─────────────────────────────────────────────
// Get Head By ID
// ADMIN ONLY
// ─────────────────────────────────────────────
router.get(
    "/:id",
    authMiddleware,
    authorize(ROLES.ADMIN),
    getById,
);

// ─────────────────────────────────────────────
// Update Head
// ADMIN ONLY
// ─────────────────────────────────────────────
router.put(
    "/update/:id",
    authMiddleware,
    authorize(ROLES.ADMIN),
    update,
);

// ─────────────────────────────────────────────
// Delete Head
// ADMIN ONLY
// ─────────────────────────────────────────────
router.delete(
    "/delete/:id",
    authMiddleware,
    authorize(ROLES.ADMIN),
    remove,
);

export default router;