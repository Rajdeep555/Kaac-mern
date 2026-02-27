import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";
const parseAmount = (amount) =>
    amount ? parseFloat(String(amount).replace(/,/g, "")) : null;

// Create
export const createStateChallanService = async (data) => {
    try {
        const { userId, ...rest } = data;

        logger.info(`Creating state challan for user: ${userId}`);

        const challan = await prisma.stateChallan.create({
            data: {
                ...rest,
                totalAmount: parseAmount(rest.totalAmount),
                challanDate: rest.challanDate ? new Date(rest.challanDate) : null,
                sanctionLetterDate: rest.sanctionLetterDate
                    ? new Date(rest.sanctionLetterDate)
                    : null,
                user: {
                    connect: { id: userId }, // ✅ only connect, no raw userId field
                },
            },
        });

        logger.info(`State challan created: ${challan.id}`);
        return challan;
    } catch (error) {
        logger.error(`Error creating state challan: ${error.message}`);
        throw error;
    }
};



// Get All
export const getAllStateChallanService = async () => {
    return await prisma.stateChallan.findMany({
        orderBy: { createdAt: "desc" },
    });
};

//  Get By ID
export const getStateChallanByIdService = async (id) => {
    const challan = await prisma.stateChallan.findUnique({ where: { id } });
    if (!challan) throw new Error("State Challan not found");
    return challan;
};

//  Update
export const updateStateChallanService = async (id, data) => {
    const existing = await prisma.stateChallan.findUnique({ where: { id } });
    if (!existing) throw new Error("State Challan not found");

    return await prisma.stateChallan.update({
        where: { id },
        data: {
            ...data,
            totalAmount: data.totalAmount ? parseAmount(data.totalAmount) : undefined,
            challanDate: data.challanDate ? new Date(data.challanDate) : undefined,
            sanctionLetterDate: data.sanctionLetterDate
                ? new Date(data.sanctionLetterDate)
                : undefined,
        },
    });
};

// Delete
export const deleteStateChallanService = async (id) => {
    const existing = await prisma.stateChallan.findUnique({ where: { id } });
    if (!existing) throw new Error("State Challan not found");
    return await prisma.stateChallan.delete({ where: { id } });
};
