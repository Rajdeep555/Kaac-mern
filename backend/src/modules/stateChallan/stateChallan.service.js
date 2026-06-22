import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

const parseAmount = (amount) =>
    amount ? parseFloat(String(amount).replace(/,/g, "")) : null;

/**
 * Atomically generate the next challan number for the current year.
 * Format: STATE-YYYY-NN  (e.g. STATE-2026-01)
 *
 * Runs inside a serializable transaction + raw query with FOR UPDATE
 * so two simultaneous inserts cannot grab the same sequence number.
 */
const generateChallanNo = async (tx) => {
    const currentYear = new Date().getFullYear();
    const prefix = `STATE-${currentYear}-`;

    // Lock all rows whose challanNo starts with this year's prefix.
    // prisma.$queryRaw executes inside the same transaction (tx).
    const rows = await tx.$queryRaw`
        SELECT "challanNo"
        FROM "state_challans"
        WHERE "challanNo" LIKE ${prefix + "%"}
        ORDER BY "challanNo" DESC
        LIMIT 1
        FOR UPDATE
    `;

    let nextSeq = 1;
    if (rows.length > 0) {
        // Extract the numeric suffix after the last "-"
        const last = rows[0].challanNo; // e.g. "STATE-2026-07"
        const parts = last.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    // Zero-pad to at least 2 digits (01, 02 … 99, 100, …)
    const padded = String(nextSeq).padStart(2, "0");
    return `${prefix}${padded}`;
};

// ── Create ─────────────────────────────────────────────────────────────────
export const createStateChallanService = async (data) => {
    try {
        const { userId, ...rest } = data;
        logger.info(`Creating state challan for user: ${userId}`);

        // Run inside a serializable transaction so the sequence is atomic
        const challan = await prisma.$transaction(
            async (tx) => {
                const challanNo = await generateChallanNo(tx);

                return tx.stateChallan.create({
                    data: {
                        ...rest,
                        challanNo,                          // ← DB-assigned, not from client
                        totalAmount: parseAmount(rest.totalAmount),
                        challanDate: rest.challanDate
                            ? new Date(rest.challanDate)
                            : null,
                        sanctionLetterDate: rest.sanctionLetterDate
                            ? new Date(rest.sanctionLetterDate)
                            : null,
                        treasuryChallanDate: rest.treasuryChallanDate
                            ? new Date(rest.treasuryChallanDate)
                            : null,
                        user: { connect: { id: userId } },
                    },
                });
            },
            {
                isolationLevel: "Serializable", // prevents phantom reads / race condition
                timeout: 10000,
            }
        );

        logger.info(`State challan created: ${challan.id} → ${challan.challanNo}`);
        return challan;
    } catch (error) {
        logger.error(`Error creating state challan: ${error.message}`);
        throw error;
    }
};

// ── Get All ────────────────────────────────────────────────────────────────
export const getAllStateChallanService = async () => {
    return await prisma.stateChallan.findMany({
        orderBy: { createdAt: "desc" },
    });
};

// ── Get By ID ──────────────────────────────────────────────────────────────
export const getStateChallanByIdService = async (id) => {
    const challan = await prisma.stateChallan.findUnique({ where: { id } });
    if (!challan) throw new Error("State Challan not found");
    return challan;
};

// ── Update ─────────────────────────────────────────────────────────────────
// challanNo is intentionally excluded from update — it must never change.
export const updateStateChallanService = async (id, data) => {
    const existing = await prisma.stateChallan.findUnique({ where: { id } });
    if (!existing) throw new Error("State Challan not found");

    // Destructure out challanNo so it can never be overwritten via update
    const { challanNo: _ignored, ...safeData } = data;

    return await prisma.stateChallan.update({
        where: { id },
        data: {
            ...safeData,
            totalAmount: safeData.totalAmount
                ? parseAmount(safeData.totalAmount)
                : undefined,
            challanDate: safeData.challanDate
                ? new Date(safeData.challanDate)
                : undefined,
            sanctionLetterDate: safeData.sanctionLetterDate
                ? new Date(safeData.sanctionLetterDate)
                : undefined,
            treasuryChallanDate: safeData.treasuryChallanDate
                ? new Date(safeData.treasuryChallanDate)
                : undefined,
        },
    });
};

// ── Delete ─────────────────────────────────────────────────────────────────
export const deleteStateChallanService = async (id) => {
    const existing = await prisma.stateChallan.findUnique({ where: { id } });
    if (!existing) throw new Error("State Challan not found");
    return await prisma.stateChallan.delete({ where: { id } });
};