import prisma from "../../config/database.js"
import logger from "../../utils/logger.js"

export const createCashReceipt = async (data) => {
    try {
        const receipt = await prisma.cashReceipt.create({
            data: {
                cashierId: data.cashierId,
                counterfoilNo: data.counterfoilNo,
                date: data.date ? new Date(data.date) : null,
                receivedFrom: data.receivedFrom,
                letterNo: data.letterNo,
                letterDate: data.letterDate
                    ? new Date(data.letterDate)
                    : null,
                rupeesInCash: data.rupeesInCash
                    ? data.rupeesInCash.replace(/,/g, "")
                    : null,
                byChequeBank: data.byChequeBank,
            },
            include: {
                user: true
            }
        })

        return receipt;
    } catch (error) {
        logger.error("Failed to fetch expenditure", error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updateCashReceipt = async (id, data, userId, role) => {
    try {
        const existing = await prisma.cashReceipt.findFirst({
            where: {
                id: Number(id),
                isActive: true,
                ...(role === "CASHIER" && { cashierId: userId })
            }
        })

        if (!existing) {
            logger.error("Receipt not found or access denied");
            throw new Error("Receipt not found or access denied")
        }

        const updated = await prisma.cashReceipt.update({
            where: {
                id: Number(id)
            },
            data: {
                counterfoilNo: data.counterfoilNo,
                date: data.date ? new Date(data.date) : null,
                receivedFrom: data.receivedFrom,
                letterNo: data.letterNo,
                letterDate: data.letterDate
                    ? new Date(data.letterDate)
                    : null,
                rupeesInCash: data.rupeesInCash
                    ? data.rupeesInCash.replace(/,/g, "")
                    : null,
                byChequeBank: data.byChequeBank,
            },

            include: {
                user: true
            }
        })

        return updated;
    } catch (error) {
        logger.error("Failed to update", error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getCashReceiptById = async (id, userId, role) => {
    try {
        const receipt = await prisma.cashReceipt.findFirst({
            where: {
                id: Number(id),
                isActive: true,

                //Restricting cashier
                ...(role === "CASHIER" && { cashierId: userId })
            },
            include: {
                user: true
            }
        })

        if (!receipt) {
            logger.error("Receipt not found or access denied");
            throw new Error("Receipt not found or access denied")
        }

        return receipt;
    } catch (error) {
        logger.error("Get CashReceipt By ID Error:", error);
        throw error; c
    }
}

export const getAllCashReceipts = async ({
    page = 1,
    limit = 10,
    userId,
    role,
}) => {
    try {
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,

            // restricting cashier to own records
            ...(role === "CASHIER" && { cashierId: userId })
        }

        const [receipts, total] = await prisma.$transaction([
            prisma.cashReceipt.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    user: true
                }
            }),
            prisma.cashReceipt.count({
                where
            })
        ]);

        return {
            data: receipts,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };

    } catch (error) {
        logger.error("Get All CashReceipts Error:", error);
        throw error;
    }
}

export const getCashReceiptByCounterfoilNo = async (counterfoilNo, userId, role) => {
    const receipt = await prisma.cashReceipt.findFirst({
        where: {
            counterfoilNo,
            isActive: true,
            ...(role === "CASHIER" && { cashierId: userId }),
        }
    })
    return receipt;
}