import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createDDO = async (data) => {
    logger.info("Creating DDO with data:", data);
    const existingDDO = await prisma.dDO.findUnique({
        where: { ddoCode: data.ddoCode }
    });
    if (existingDDO) {
        logger.info("DDO already exists");
        throw new Error("DDO already exists");
    }
    return prisma.dDO.create({
        data: {
            ddoName: data.ddoName,
            ddoCode: data.ddoCode,
            ddoEmail: data.ddoEmail,
            ddoPhone: data.ddoPhone,
            ddoPassword: data.ddoPassword,
            isActive: data.isActive,
            divisionId: data.divisionId
        }
    });
};

export const getAllDDOs = async () => {
    // ✅ FIX: Remove `where: { isActive: true }` to fetch all records
    return prisma.dDO.findMany({
        select: {
            id: true,
            ddoName: true,
            ddoCode: true,
            ddoPhone: true,
            ddoEmail: true,
            isActive: true,
        },
        orderBy: { ddoName: "asc" }
    });
};

// ✅ FIX: Add updateDDO service
export const updateDDO = async (id, data) => {
    return prisma.dDO.update({
        where: { id: Number(id) },
        data: {
            ddoName: data.ddoName,
            ddoEmail: data.ddoEmail,
            ddoPhone: data.ddoPhone,
            divisionId: data.divisionId,
        },
        select: {
            id: true,
            ddoName: true,
            ddoCode: true,
            ddoPhone: true,
            ddoEmail: true,
            isActive: true,
        }
    });
};

// ✅ FIX: Add deactivateDDO service (toggles isActive)
export const deactivateDDO = async (id) => {
    const existing = await prisma.dDO.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new Error("DDO not found");

    return prisma.dDO.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: {
            id: true,
            ddoName: true,
            ddoCode: true,
            ddoPhone: true,
            ddoEmail: true,
            isActive: true,
        }
    });
};