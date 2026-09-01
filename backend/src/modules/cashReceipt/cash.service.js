import prisma from "../../config/database.js"
import logger from "../../utils/logger.js"
// 🔸 ADJUST THIS PATH if it lives elsewhere relative to this file
import { isPerpetualCounterfoil } from "../../constrants/perpetualCounterfoils.js";

// A cashier is restricted to their own entries UNLESS the relevant granular
// permission flag is true. ADMIN (or any non-CASHIER role) is never
// restricted by cashierId, regardless of these flags.
const isRestricted = (role, hasPermission) =>
    role === "CASHIER" && !hasPermission;

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
        logger.error("Failed to create cash receipt", error);
        throw error;
    }
}

export const updateCashReceipt = async (id, data, userId, role, canEditAllEntries) => {
    try {
        const existing = await prisma.cashReceipt.findFirst({
            where: {
                id: Number(id),
                isActive: true,
                ...(isRestricted(role, canEditAllEntries) && { cashierId: userId })
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
        throw error;
    }
}

export const getCashReceiptById = async (id, userId, role, canViewAllEntries) => {
    try {
        const receipt = await prisma.cashReceipt.findFirst({
            where: {
                id: Number(id),
                isActive: true,

                //Restricting cashier
                ...(isRestricted(role, canViewAllEntries) && { cashierId: userId })
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
        throw error;
    }
}

export const getAllCashReceipts = async ({
    page = 1,
    limit = 80,
    userId,
    role,
    canViewAllEntries,
}) => {
    try {
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,

            // restricting cashier to own records — unless canViewAllEntries is granted
            ...(isRestricted(role, canViewAllEntries) && { cashierId: userId })
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

export const getCashReceiptByCounterfoilNo = async (counterfoilNo, userId, role, canViewAllEntries, excludeChallanId) => {
    const receipt = await prisma.cashReceipt.findFirst({
        where: {
            counterfoilNo,
            isActive: true,
            ...(isRestricted(role, canViewAllEntries) && { cashierId: userId }),
        }
    })

    if (!receipt) {
        return null;
    }

    const perpetual = isPerpetualCounterfoil(counterfoilNo);

    // Every Challan ever linked to this counterfoilNo, most recent last.
    // For non-perpetual counterfoils we only actually need the first one
    // (to preserve the old "already inserted" behavior), but fetching the
    // full list costs nothing extra and lets perpetual counterfoils show
    // their whole history.
    const linkedChallans = await prisma.challan.findMany({
        where: {
            counterfoilNo,
            ...(excludeChallanId && { id: { not: Number(excludeChallanId) } }),
        },
        select: { id: true, challanNo: true, amount: true, challanDate: true },
        orderBy: { challanDate: "asc" },
    });

    return {
        ...receipt,
        // ✅ Perpetual counterfoils (C725) are always re-usable — never
        // block insertion just because a Challan already exists against it.
        alreadyInserted: perpetual ? false : linkedChallans.length > 0,
        linkedChallanNo: !perpetual ? (linkedChallans[0]?.challanNo ?? null) : null,
        // ✅ Full Challan history — populated only for perpetual
        // counterfoils, so the frontend can show "details properly"
        // (which Challans have drawn against this receipt and when).
        linkedChallans: perpetual ? linkedChallans : [],
    };
}


// ─── Pending Receipts ─────────────────────────────────────────────────────────
// A "pending" receipt is one whose counterfoilNo has NOT been used in any Challan
// — EXCEPT for perpetual counterfoils (C725), which always stay pending
// regardless of how many Challans have been raised against them.

export const getPendingReceipts = async (userId, role, canViewAllEntries) => {
    try {
        // Step 1: collect every counterfoilNo already linked to a Challan
        const linked = await prisma.challan.findMany({
            where: { counterfoilNo: { not: null } },
            select: { counterfoilNo: true },
        });

        // ✅ Perpetual counterfoils never count as "linked" for this
        // purpose — they must never be excluded from the pending list.
        const linkedNos = linked
            .map((c) => c.counterfoilNo)
            .filter((no) => !isPerpetualCounterfoil(no));

        // Step 2: return receipts NOT in that list, scoped to cashier if needed
        const receipts = await prisma.cashReceipt.findMany({
            where: {
                isActive: true,
                ...(isRestricted(role, canViewAllEntries) && { cashierId: userId }),
                counterfoilNo: {
                    notIn: linkedNos.length > 0 ? linkedNos : ["__none__"],
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // ✅ For any perpetual-counterfoil receipts in this result, attach
        // the full history of Challans raised against them (challanNo,
        // amount, date) so the frontend can display it alongside the
        // receipt's current (already-decremented) rupeesInCash balance.
        const perpetualCounterfoilNos = [
            ...new Set(
                receipts
                    .map((r) => r.counterfoilNo)
                    .filter((no) => isPerpetualCounterfoil(no))
            ),
        ];

        let challansByCounterfoil = {};
        if (perpetualCounterfoilNos.length > 0) {
            const challans = await prisma.challan.findMany({
                where: { counterfoilNo: { in: perpetualCounterfoilNos } },
                select: {
                    id: true,
                    challanNo: true,
                    challanDate: true,
                    amount: true,
                    counterfoilNo: true,
                },
                orderBy: { challanDate: "asc" },
            });

            challansByCounterfoil = challans.reduce((acc, c) => {
                (acc[c.counterfoilNo] ||= []).push(c);
                return acc;
            }, {});
        }

        return receipts.map((r) =>
            isPerpetualCounterfoil(r.counterfoilNo)
                ? { ...r, linkedChallans: challansByCounterfoil[r.counterfoilNo] ?? [] }
                : r
        );
    } catch (error) {
        logger.error("Get Pending Receipts Error:", error);
        throw error;
    }
}

export const getPendingReceiptsCount = async (userId, role, canViewAllEntries) => {
    try {
        const linked = await prisma.challan.findMany({
            where: { counterfoilNo: { not: null } },
            select: { counterfoilNo: true },
        });

        // ✅ Same perpetual-counterfoil exclusion as getPendingReceipts, so
        // the count always matches what the list endpoint returns.
        const linkedNos = linked
            .map((c) => c.counterfoilNo)
            .filter((no) => !isPerpetualCounterfoil(no));

        const count = await prisma.cashReceipt.count({
            where: {
                isActive: true,
                ...(isRestricted(role, canViewAllEntries) && { cashierId: userId }),
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

export const getCashReceiptTotal = async ({ filterType, fy, month, day, userId, role, canViewAllEntries }) => {
    const fyYear = Number(fy);
    const monthNum = Number(month);
    const dayNum = Number(day);

    let from, to;

    if (filterType === "fy") {
        // Full financial year: 1 Apr fyYear 00:00:00  →  31 Mar fyYear+1 23:59:59
        from = new Date(fyYear, 3, 1, 0, 0, 0, 0);   // April 1
        to = new Date(fyYear + 1, 2, 31, 23, 59, 59, 999); // March 31

    } else if (filterType === "monthly") {
        // Full month: months Apr–Dec belong to fyYear, Jan–Mar belong to fyYear+1
        const calendarYear = monthNum >= 4 ? fyYear : fyYear + 1;
        const lastDay = new Date(calendarYear, monthNum, 0).getDate(); // day 0 of next month
        from = new Date(calendarYear, monthNum - 1, 1, 0, 0, 0, 0);
        to = new Date(calendarYear, monthNum - 1, lastDay, 23, 59, 59, 999);

    } else {
        // Daily: exact day 00:00:00 → 23:59:59  (ignores the time component in DB)
        const calendarYear = monthNum >= 4 ? fyYear : fyYear + 1;
        from = new Date(calendarYear, monthNum - 1, dayNum, 0, 0, 0, 0);
        to = new Date(calendarYear, monthNum - 1, dayNum, 23, 59, 59, 999);
    }

    const where = {
        isActive: true,
        date: { gte: from, lte: to },
        ...(isRestricted(role, canViewAllEntries) && { cashierId: userId }),
    };

    const receipts = await prisma.cashReceipt.findMany({
        where,
        select: { rupeesInCash: true },
    });

    // rupeesInCash is stored as String — strip commas, parse, sum
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