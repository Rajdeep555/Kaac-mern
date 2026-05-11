import prisma from "../../config/database.js";

export const createDepartment = async (data) => {
    const existingDepartment = await prisma.department.findUnique({
        where: { code: data.code } // ✅ Now data.code is the actual string, not undefined
    });
    if (existingDepartment) {
        throw new Error("Department already exists");
    }
    return prisma.department.create({
        data: {
            name: data.name,
            code: data.code,
            sector: data.sector,
            isActive: data.isActive ?? true,
        }
    });
};

export const getAllDepartment = async ({ type, isAdmin }) => {
    const whereClause = {};

    if (!isAdmin) {
        whereClause.isActive = true;
        if (type && ["COUNCIL", "STATE"].includes(type)) {
            whereClause.sector = type;
        }
    }

    return prisma.department.findMany({
        where: whereClause,
        orderBy: { id: "asc" }
    });
};

export const updateDepartment = async (id, data) => {
    return prisma.department.update({
        where: { id: Number(id) },
        data: {
            name: data.name,
            sector: data.sector,
        }
    });
};

export const toggleDepartmentStatus = async (id) => {
    const existing = await prisma.department.findUnique({
        where: { id: Number(id) }
    });
    if (!existing) throw new Error("Department not found");

    return prisma.department.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive }
    });
};