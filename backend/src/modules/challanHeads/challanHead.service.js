import prisma from "../../config/database.js"

export const getAllChallanHeads = async () => {
    return prisma.challanHeads.findMany({
        where: { isActive: true },
    })
}