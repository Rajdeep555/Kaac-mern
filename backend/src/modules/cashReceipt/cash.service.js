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
    limit = 80,
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


// ─── Pending Receipts ─────────────────────────────────────────────────────────
// A "pending" receipt is one whose counterfoilNo has NOT been used in any Challan

export const getPendingReceipts = async (userId, role) => {
    try {
        // Step 1: collect every counterfoilNo already linked to a Challan
        const linked = await prisma.challan.findMany({
            where: { counterfoilNo: { not: null } },
            select: { counterfoilNo: true },
        });

        const linkedNos = linked.map((c) => c.counterfoilNo);

        // Step 2: return receipts NOT in that list, scoped to cashier if needed
        const receipts = await prisma.cashReceipt.findMany({
            where: {
                isActive: true,
                ...(role === "CASHIER" && { cashierId: userId }),
                counterfoilNo: {
                    notIn: linkedNos.length > 0 ? linkedNos : ["__none__"],
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return receipts;
    } catch (error) {
        logger.error("Get Pending Receipts Error:", error);
        throw error;
    }
}

export const getPendingReceiptsCount = async (userId, role) => {
    try {
        const linked = await prisma.challan.findMany({
            where: { counterfoilNo: { not: null } },
            select: { counterfoilNo: true },
        });

        const linkedNos = linked.map((c) => c.counterfoilNo);

        const count = await prisma.cashReceipt.count({
            where: {
                isActive: true,
                ...(role === "CASHIER" && { cashierId: userId }),
                counterfoilNo: {
                    notIn: linkedNos.length > 0 ? linkedNos : ["__none__"],
                },
            },
        });

        return count;
    } catch (error) {
        logger.error("Get Pending Receipts Count Error:", error);
        throw error;
    }
}

export const getCashReceiptTotal = async ({ filterType, fy, month, userId, role }) => {
    // ── Build date range ──────────────────────────────────────────────────────
    const fyYear = Number(fy);
    let from, to;

    if (filterType === "fy") {
        // Full financial year: April 1 of fyYear  →  March 31 of fyYear+1
        from = new Date(fyYear, 3, 1);       // April  = month index 3
        to = new Date(fyYear + 1, 2, 31);  // March  = month index 2
    } else {
        // Single month inside the FY
        // FY months: Apr(4)–Dec(12) belong to fyYear, Jan(1)–Mar(3) belong to fyYear+1
        const monthNum = Number(month);
        const calendarYear = monthNum >= 4 ? fyYear : fyYear + 1;
        from = new Date(calendarYear, monthNum - 1, 1);
        // Last day of the month: day 0 of next month
        to = new Date(calendarYear, monthNum, 0);
    }

    // ── Prisma where clause ───────────────────────────────────────────────────
    const where = {
        isActive: true,
        date: { gte: from, lte: to },
        ...(role === "CASHIER" && { cashierId: userId }),
    };

    // ── Fetch matching receipts ───────────────────────────────────────────────
    const receipts = await prisma.cashReceipt.findMany({
        where,
        select: { rupeesInCash: true },
    });

    // rupeesInCash is stored as String — parse and sum
    const total = receipts.reduce((sum, r) => {
        const val = parseFloat(r.rupeesInCash?.replace(/,/g, "") ?? "0");
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return {
        total: parseFloat(total.toFixed(2)),
        count: receipts.length,
        from: from.toISOString(),
        to: to.toISOString(),
    };
};