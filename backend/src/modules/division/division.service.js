import prisma from "../../config/database.js"
import logger from "../../utils/logger.js";

export const createDivison = async (data) => {
    logger.info("Creating division", data);
    if (!data?.divisionCode) throw new Error("divisionCode is required");
    if (!data?.divisionName) throw new Error("divisionName is required");
    // checking division already exists
    const existingDivision = await prisma.division.findUnique({
        where: {
            divisionCode: data.divisionCode
        }
    })

    if (existingDivision) {
        logger.info("Division already exists");
        throw new Error("Division already exists");
    }

    return prisma.division.create({
        data: {
            divisionName: data.divisionName,
            divisionCode: data.divisionCode,
            sector: data.sector?.toUpperCase()
        }
    })
}