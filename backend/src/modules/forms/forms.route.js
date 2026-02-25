import Router from "express"
import { getForm10, getForm11, getForm12, getForm4, getForm5A, getForm5B, getForm5C, getForm5D, getForm5E, getForm6, getForm7, getForm7A, getForm7B, getForm8, getForm9 } from "./forms.controller.js"
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constrants/roles.js";

const router = Router();

router.get("/form4", authMiddleware, authorize(ROLES.ADMIN), getForm4);

router.get("/form5a", authMiddleware, authorize(ROLES.ADMIN), getForm5A);

router.get("/form5b", authMiddleware, authorize(ROLES.ADMIN), getForm5B);

router.get("/form5c", authMiddleware, authorize(ROLES.ADMIN), getForm5C);

router.get("/form5d", authMiddleware, authorize(ROLES.ADMIN), getForm5D);

router.get("/form5e", authMiddleware, authorize(ROLES.ADMIN), getForm5E);

router.get("/form6", authMiddleware, authorize(ROLES.ADMIN), getForm6);

router.get("/form7", authMiddleware, authorize(ROLES.ADMIN), getForm7);

router.get("/form7a", authMiddleware, authorize(ROLES.ADMIN), getForm7A);

router.get("/form7b", authMiddleware, authorize(ROLES.ADMIN), getForm7B);

router.get("/form8", authMiddleware, authorize(ROLES.ADMIN), getForm8);

router.get("/form9", authMiddleware, authorize(ROLES.ADMIN), getForm9);

router.get("/form10", authMiddleware, authorize(ROLES.ADMIN), getForm10);

router.get("/form11", authMiddleware, authorize(ROLES.ADMIN), getForm11);

router.get("/form12", authMiddleware, authorize(ROLES.ADMIN), getForm12);

// router.get("/form5", getForm5);

export default router;