import { Router } from "express"
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { create, getAll, getHierarchy } from "./head.controller.js";
const router = Router();

router.post("/create", authMiddleware, authorize(ROLES.ADMIN), create);
router.get("/", getAll);
router.get("/hierarchy", authMiddleware, getHierarchy)

export default router;