import prisma from "../../config/database.js"
import logger from "../../utils/logger.js";

export const createDDO = async (data) => {
    //checking ddo if already exists
    const existingDDO = await prisma.dDO.findUnique({
        where: {
            ddoCode: data.ddoCode
        }
    })
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
    })
}


export const getAllDDOs = async () => {
    return prisma.dDO.findMany({
        where: { isActive: true },
        select: {
            id: true,
            ddoName: true,
            ddoCode: true,
            ddoPhone: true,
            ddoEmail: true,
        },
        orderBy: {
            ddoName: "asc"
        }
    })
}