import express from "express";
import { login } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});

export default router;