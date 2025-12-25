import prisma from "../../config/database.js"

export const createExpenditureType = async (data) => {
    // check 
    const existingExpenditureType = await prisma.expenditureType.findUnique({
        where: {
            name: data.name
        }
    })
    if (existingExpenditureType) {
        logger.info("Expenditure type already exists");
        throw new Error("Expenditure type already exists");
    }
    return prisma.expenditureType.create({
        data: {
            name: data.name,
            sector: data.sector,
            isActive: data.isActive
        }
    })
}