import Router from "express"
import { getChallansByCashier } from "./challanBill.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.get("/", authMiddleware, authorize(ROLES.CASHIER, ROLES.ADMIN), getChallansByCashier)

export default router;