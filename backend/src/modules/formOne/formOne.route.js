// src/modules/cashbook/cashbook.routes.js
import { Router } from "express";
import { getCashbookByFy, postCashbookSummary } from "./formOne.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.get(
    "/",
    authMiddleware,
    authorize(ROLES.ADMIN),
    getCashbookByFy
);

router.post("/cashbook-summary", authMiddleware, authorize(ROLES.ADMIN), postCashbookSummary);

export default router;
