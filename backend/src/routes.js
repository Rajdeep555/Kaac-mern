import express from "express"
import authRoutes from "./modules/auth/auth.routes.js"
import userRoutes from "./modules/users/user.routes.js"
import divisonRoutes from "./modules/division/division.route.js"
import ddoRoutes from "./modules/ddo/ddo.routes.js"
import cashierRoutes from "./modules/cashier/cashier.routes.js"
import expenditureTypeRoutes from "./modules/expenditureType/expenditureType.routes.js"
import planNonPlanRoutes from "./modules/planNonPlan/planNonPlan.routes.js"
import departmentRoutes from "./modules/department/department.routes.js"
import headRoutes from "./modules/heads/head.route.js"
import generateChallanNoRoutes from "./modules/generateChallanNo/generate.route.js"
import expenditureRoutes from "./modules/expenditure/expenditure.route.js"
import objectHeadRoutes from "./modules/objectHead/objectHead.route.js"
import grantRoutes from "./modules/grants/grant.route.js"
import challanRoutes from "./modules/challan/challan.routes.js"
import cashReceiptRoutes from "./modules/cashReceipt/cash.route.js"
import challanHeadRoutes from "./modules/challanHeads/challanHead.route.js"
import openingBalaceRoutes from "./modules/openingBalance/opening.route.js"
import treasuryPlaRoutes from "./modules/treasuryPla/treasurypla.route.js"
import formOneRoutes from "./modules/formOne/formOne.route.js"
import challanBillRoutes from "./modules/challanBill/challanBill.route.js"
import formRoutes from "./modules/forms/forms.route.js"
import statementsRoutes from "./modules/statements/statements.route.js"
import stateChallanRoutes from "./modules/stateChallan/stateChallan.route.js"
import dashboardRoutes from "./modules/personnelStats/personnelStats.route.js"

const router = express.Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/division", divisonRoutes);
router.use("/v1/ddo", ddoRoutes);
router.use("/v1/cashier", cashierRoutes);
router.use("/v1/expenditureType", expenditureTypeRoutes);
router.use("/v1/planNonPlan", planNonPlanRoutes);
router.use("/v1/department", departmentRoutes)
router.use("/v1/heads", headRoutes);
router.use("/v1/challan", generateChallanNoRoutes);
router.use("/v1/expenditure", expenditureRoutes);
router.use("/v1/objectHead", objectHeadRoutes);
router.use("/v1/grants", grantRoutes);
router.use("/v1/challan", challanRoutes);
router.use("/v1/cashReceipt", cashReceiptRoutes);
router.use("/v1/challanHeads", challanHeadRoutes)
router.use("/v1/openingBalance", openingBalaceRoutes);
router.use("/v1/treasuryPla", treasuryPlaRoutes);
router.use("/v1/formOne", formOneRoutes);
router.use("/v1/challanFromBill", challanBillRoutes);
router.use("/v1/forms", formRoutes)
router.use("/v1/statements", statementsRoutes);
router.use("/v1/state-challan", stateChallanRoutes)
router.use("/v1/dashboard", dashboardRoutes)

// router.all(/.*/, (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: "Route not found",
//     });
// });


export default router;