import prisma from "../../config/database.js";

export const createPlanNonPlan = async (data) => {
    const { name, sector } = data;

    if (!name || !sector) {
        throw new Error("Name and sector are required");
    }

    const existingPlanNonPlan = await prisma.planNonPlan.findFirst({
        where: {
            name,
            sector,
            isActive: true,
        },
    });

    if (existingPlanNonPlan) {
        throw new Error("Plan / Non-Plan already exists");
    }

    return prisma.planNonPlan.create({
        data: {
            name,
            sector,
            isActive: true,
        },
    });
};

export const getAllPlanNonPlans = async () => {
    return prisma.planNonPlan.findMany({
        select: {
            id: true,
            name: true,
            sector: true,
            isActive: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
