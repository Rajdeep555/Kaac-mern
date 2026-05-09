import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import prisma from "../../config/database.js";

export const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user || !user.isActive) {
        logger.error("Invalid credintials");
        throw new Error("Invalid credintials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        logger.error("Invalid credintials");
        throw new Error("Invalid credintials");
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
    );
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        }
    }
}



export const refreshTokenService = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
    );

    return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
};
