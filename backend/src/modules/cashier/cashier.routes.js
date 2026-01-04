import { Router } from "express";
import { create, deactivate, getData, update } from "./cashier.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.ADMIN), create)
router.get("/", authMiddleware, authorize(ROLES.ADMIN), getData)
router.put("/:id", authMiddleware, authorize(ROLES.ADMIN), update);
router.put("/:id/deactivate", authMiddleware, authorize(ROLES.ADMIN), deactivate);

export default router;