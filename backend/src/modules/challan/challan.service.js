import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createChallan = async (data) => {
    // create challan
    const createChallan = await prisma.challan.create({
    })
}
