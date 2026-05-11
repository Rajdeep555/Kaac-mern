import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createDivison = async (data) => {
    logger.info("Creating division", data);
    if (!data?.divisionCode) throw new Error("divisionCode is required");
    if (!data?.divisionName) throw new Error("divisionName is required");

    const existingDivision = await prisma.division.findUnique({
        where: { divisionCode: data.divisionCode }
    });
    if (existingDivision) {
        throw new Error("Division already exists");
    }

    return prisma.division.create({
        data: {
            divisionName: data.divisionName,
            divisionCode: data.divisionCode,
            sector: data.sector?.toUpperCase(),
            isActive: data.isActive ?? true,
        }
    });
};

export const getAllDivisions = async () => {
    return prisma.division.findMany({
        select: {
            id: true,
            divisionCode: true,
            divisionName: true,
            sector: true,
            isActive: true,
        },
        orderBy: { divisionName: "asc" }
    });
};

export const updateDivision = async (id, data) => {
    return prisma.division.update({
        where: { id: Number(id) },
        data: {
            divisionName: data.divisionName,
            ...(data.sector ? { sector: data.sector } : {}),
        },
        select: {
            id: true,
            divisionCode: true,
            divisionName: true,
            sector: true,
            isActive: true,
        }
    });
};

export const toggleDivisionStatus = async (id) => {
    const existing = await prisma.division.findUnique({
        where: { id: Number(id) }
    });
    if (!existing) throw new Error("Division not found");

    return prisma.division.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: {
            id: true,
            divisionCode: true,
            divisionName: true,
            sector: true,
            isActive: true,
        }
    });
};