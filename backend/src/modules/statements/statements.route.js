import Router from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";
import { getStatement1, getStatement2, getStatement3Debt, getStatement3WaysAndMeans, getStatement4, getStatement5, getStatement6, getStatement7 } from "./statements.controller.js";

const router = Router();

router.get("/statement7", authMiddleware, authorize(ROLES.ADMIN), getStatement7)
router.get("/statement6", authMiddleware, authorize(ROLES.ADMIN), getStatement6)
router.get("/statement5", authMiddleware, authorize(ROLES.ADMIN), getStatement5)
router.get("/statement4", authMiddleware, authorize(ROLES.ADMIN), getStatement4)
router.get("/statement2", authMiddleware, authorize(ROLES.ADMIN), getStatement2)

router.get("/statement3/debt", authMiddleware, authorize(ROLES.ADMIN), getStatement3Debt)
router.get("/statement3/ways-and-means", authMiddleware, authorize(ROLES.ADMIN), getStatement3WaysAndMeans)

router.get("/statement1", authMiddleware, authorize(ROLES.ADMIN), getStatement1)


export default router;