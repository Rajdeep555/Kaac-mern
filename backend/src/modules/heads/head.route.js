import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { create, getAll, getHierarchy, update, deactivate } from "./head.controller.js";

const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.ADMIN), create);
router.get("/", getAll);
router.get("/hierarchy", authMiddleware, getHierarchy);
router.put("/:id", authMiddleware, authorize(ROLES.ADMIN), update);
router.put("/:id/deactivate", authMiddleware, authorize(ROLES.ADMIN), deactivate);

export default router;