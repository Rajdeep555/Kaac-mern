import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../config/database.js";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,

                canViewAllEntries: true,
                canEditAllEntries: true,
                canDeleteAllEntries: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account disabled",
            });
        }


        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,

            role: user.role.toUpperCase(),

            permissions: {
                canViewAllEntries: user.canViewAllEntries,
                canEditAllEntries: user.canEditAllEntries,
                canDeleteAllEntries: user.canDeleteAllEntries,
            },
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
};