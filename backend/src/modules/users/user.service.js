import bcrypt from "bcrypt";
import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";
import { UserRole } from "@prisma/client";

export const createUser = async (data) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: UserRole[data.role],
        }
    });
};

// ✅ NEW
export const getAllUsers = async () => {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" }
    });
};

// ✅ NEW
export const updateUser = async (id, data) => {
    const updateData = {
        name: data.name,
        email: data.email,
        role: UserRole[data.role],
    };

    // Only update password if provided
    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
        }
    });
};

// ✅ NEW
export const toggleUserStatus = async (id) => {
    const existing = await prisma.user.findUnique({
        where: { id: Number(id) }
    });
    if (!existing) throw new Error("User not found");

    return prisma.user.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
        }
    });
};