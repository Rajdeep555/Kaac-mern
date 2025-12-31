import express from "express"
import authRoutes from "./modules/auth/auth.routes.js"
import userRoutes from "./modules/users/user.routes.js"
import divisonRoutes from "./modules/division/division.route.js"
import ddoRoutes from "./modules/ddo/ddo.routes.js"
import cashierRoutes from "./modules/cashier/cashier.routes.js"
import expenditureTypeRoutes from "./modules/expenditureType/expenditureType.routes.js"
import planNonPlanRoutes from "./modules/planNonPlan/planNonPlan.routes.js"
import departmentRoutes from "./modules/department/department.routes.js"

const router = express.Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/division", divisonRoutes);
router.use("/v1/ddo", ddoRoutes);
router.use("/v1/cashier", cashierRoutes);
router.use("/v1/expenditureType", expenditureTypeRoutes);
router.use("/v1/planNonPlan", planNonPlanRoutes);
router.use("/v1/department", departmentRoutes)

// router.all(/.*/, (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: "Route not found",
//     });
// });


export default router;