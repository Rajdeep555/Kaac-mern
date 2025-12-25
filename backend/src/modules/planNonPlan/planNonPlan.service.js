import prisma from "../../config/database.js"

export const createPlanNonPlan = async (data) => {
    //check if already exists
    const existingPlanNonPlan = await prisma.planNonPlan.findUnique({
        where: {
            name: data.name
        }
    })
    if (existingPlanNonPlan) {
        throw new Error("Plan non plan already exists")
    }
    return prisma.planNonPlan.create({
        data: {
            name: data.name,
            sector: data.sector,
            isActive: data.isActive
        }
    })
}