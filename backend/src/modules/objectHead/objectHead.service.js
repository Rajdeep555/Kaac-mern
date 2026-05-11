import prisma from "../../config/database.js";

export const getObjectHead = async () => {
    return prisma.objectHead.findMany({
        select: {
            id: true,
            name: true,
            sector: true,
            isActive: true,
        },
        orderBy: { id: "asc" }
    });
};

export const createObjectHead = async (data) => {
    const existing = await prisma.objectHead.findFirst({
        where: { name: { equals: data.name, mode: "insensitive" } }
    });
    if (existing) throw new Error("Object Head already exists");

    return prisma.objectHead.create({
        data: {
            name: data.name,
            sector: data.sector,
            isActive: data.isActive ?? true,
        }
    });
};

export const updateObjectHead = async (id, data) => {
    return prisma.objectHead.update({
        where: { id: Number(id) },
        data: {
            name: data.name,
            ...(data.sector !== undefined ? { sector: data.sector } : {}),
        },
        select: { id: true, name: true, sector: true, isActive: true }
    });
};

export const toggleObjectHeadStatus = async (id) => {
    const existing = await prisma.objectHead.findUnique({
        where: { id: Number(id) }
    });
    if (!existing) throw new Error("Object Head not found");

    return prisma.objectHead.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: { id: true, name: true, sector: true, isActive: true }
    });
};