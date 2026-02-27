import Router from "express"
import { createStateChallan, deleteStateChallan, getAllStateChallan, getStateChallanById, updateStateChallan } from "./stateChallan.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js"
const router = Router();

router.post("/", authMiddleware, createStateChallan);
router.get("/", authMiddleware, getAllStateChallan);
router.get("/:id", authMiddleware, getStateChallanById);
router.put("/:id", authMiddleware, updateStateChallan);
router.delete("/:id", authMiddleware, deleteStateChallan);

export default router;