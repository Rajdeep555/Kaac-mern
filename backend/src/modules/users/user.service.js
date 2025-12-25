import bcrypt from "bcrypt";
import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";
import { UserRole } from "@prisma/client";

export const createUser = async (data) => {
    // === checks user already exists ===
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

    if (existingUser) {
        logger.info("User already exists");
        throw new Error("User already exists");
    }

    // === hasing pass ===
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: UserRole[data.role]
        }
    })

}