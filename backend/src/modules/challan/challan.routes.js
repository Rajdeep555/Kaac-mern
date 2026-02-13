import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

import {
    createChallanController,
    updateChallanController,
    getAllChallansController,
    getChallanByIdController,
} from "./challan.controller.js";

const router = Router();

/**
 * CREATE CHALLAN
 * Only Cashier
 */
router.post(
    "/create",
    authMiddleware,
    authorize(ROLES.CASHIER),
    createChallanController
);

/**
 * UPDATE CHALLAN
 * Only Cashier
 */
router.put(
    "/:id",
    authMiddleware,
    authorize(ROLES.CASHIER),
    updateChallanController
);

/**
 * GET ALL CHALLANS
 * Cashier & Admin
 */
router.get(
    "/",
    authMiddleware,
    authorize(ROLES.CASHIER, ROLES.ADMIN),
    getAllChallansController
);

/**
 * GET CHALLAN BY ID
 * Cashier & Admin
 */
router.get(
    "/:id",
    authMiddleware,
    authorize(ROLES.CASHIER, ROLES.ADMIN),
    getChallanByIdController
);

export default router;
