import prisma from "../../config/database.js";

export const createPlanNonPlan = async (data) => {
    const { name, sector } = data;

    const existingPlanNonPlan = await prisma.planNonPlan.findFirst({
        where: { name, sector, isActive: true },
    });
    if (existingPlanNonPlan) throw new Error("Plan / Non-Plan already exists");

    return prisma.planNonPlan.create({
        data: { name, sector, isActive: true }
    });
};

export const getAllPlanNonPlans = async () => {
    return prisma.planNonPlan.findMany({
        select: { id: true, name: true, sector: true, isActive: true },
        orderBy: { createdAt: "desc" }
    });
};

// ✅ NEW
export const updatePlanNonPlan = async (id, data) => {
    return prisma.planNonPlan.update({
        where: { id: Number(id) },
        data: {
            name: data.name,
            ...(data.sector ? { sector: data.sector } : {}),
        },
        select: { id: true, name: true, sector: true, isActive: true }
    });
};

// ✅ NEW
export const togglePlanNonPlanStatus = async (id) => {
    const existing = await prisma.planNonPlan.findUnique({
        where: { id: Number(id) }
    });
    if (!existing) throw new Error("Plan / Non-Plan not found");

    return prisma.planNonPlan.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: { id: true, name: true, sector: true, isActive: true }
    });
};