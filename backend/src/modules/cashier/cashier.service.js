import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createCashier = async (data) => {
    // check existing cashier
    const existingCashier = await prisma.cashier.findUnique({
        where: {
            cashierCode: data.cashierCode
        }
    })
    if (existingCashier) {
        logger.info("Cashier already exists");
        throw new Error("Cashier already exists");
    }
    return prisma.cashier.create({
        data: {
            name: data.name,
            email: data.email,
            cashierCode: data.cashierCode,
            phone: data.phone,
            password: data.password,
            divisionId: data.divisionId,
            ddoId: data.ddoId,
            isActive: data.isActive,
        }
    })
}

export const getCashiers = async () => {
    return prisma.cashier.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            division: {
                select: { id: true, divisionName: true }
            },
            ddo: {
                select: { id: true, ddoName: true, ddoCode: true }
            }
        }
    });
}

export const updateCashierById = async (id, data) => {
    return prisma.cashier.update({
        where: { id: Number(id) },
        data: {
            name: data.name,
            email: data.email,
            cashierCode: data.cashierCode,
            phone: data.phone,
            divisionId: data.divisionId !== undefined ? Number(data.divisionId) : undefined,
            ddoId: data.ddoId !== undefined ? Number(data.ddoId) : undefined,
            isActive: data.isActive,
        },
        include: {
            division: { select: { id: true, divisionName: true } },
            ddo: { select: { id: true, ddoName: true, ddoCode: true } }
        }

    })
}

export const deactivateCashierById = async (id) => {
    return prisma.cashier.update({
        where: { id: Number(id) },
        data: {
            isActive: false
        },
        include: {
            division: { select: { id: true, divisionName: true } },
            ddo: { select: { id: true, ddoName: true, ddoCode: true } },
        }
    })
}