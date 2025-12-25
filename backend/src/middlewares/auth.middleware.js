import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        })
    }

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.sign(token, process.env.JWT_SECRET);
        req.user = decoded;

        // all ok 
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
}