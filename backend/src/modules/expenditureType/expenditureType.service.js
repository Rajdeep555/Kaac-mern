import prisma from "../../config/database.js";

export const createExpenditureType = async (data) => {
    const existing = await prisma.expenditureType.findFirst({
        where: { name: data.name }
    });
    if (existing) throw new Error("Expenditure type already exists");

    return prisma.expenditureType.create({
        data: {
            name: data.name,
            sector: data.sector,
            isActive: data.isActive ?? true,
        }
    });
};

export const getAllExpenditureTypes = async () => {
    return prisma.expenditureType.findMany({
        select: {
            id: true,
            name: true,
            sector: true,
            isActive: true,
        },
        orderBy: { name: "asc" }
    });
};

export const updateExpenditureType = async (id, data) => {
    return prisma.expenditureType.update({
        where: { id: Number(id) },
        data: {
            name: data.name,
            ...(data.sector !== undefined ? { sector: data.sector } : {}),
        },
        select: { id: true, name: true, sector: true, isActive: true }
    });
};

export const toggleExpenditureTypeStatus = async (id) => {
    const existing = await prisma.expenditureType.findUnique({
        where: { id: Number(id) }
    });
    if (!existing) throw new Error("Expenditure type not found");

    return prisma.expenditureType.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: { id: true, name: true, sector: true, isActive: true }
    });
};