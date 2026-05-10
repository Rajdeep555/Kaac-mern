import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { fetchPersonnelStats } from "./personnelStats.controller.js";

const router = Router();

router.get("/personnal-stats", authMiddleware, authorize(ROLES.ADMIN), fetchPersonnelStats)

export default router;