import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

const PLA_AMOUNT_TYPES = [
    "Earnest Money",
    "Professional Tax",
    "Car Loan",
    "Building Loan",
    "House Rent",
    "Security Deposits",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
    "Advance Payment",
    "Other Deductions",
];

const CASH_AMOUNT_TYPES = [
    "CGST",
    "SGST",
    "IGST",
    "ITAX",
    "MDRRF",
    "DMFT",
    "Labour Cess",
    "IT Forest Royalty",
    "VAT",
    "CPF Council Share",
    "CPF Contribution",
    "CPF Advance",
];

// ─────────────────────────────────────────────────────────────
// NEW — COUNCIL Receipt side, Treasury PLA Column: in addition to
// COUNCIL's own ChallanFromBill rows, also pull ChallanFromBill rows
// where sector = STATE and amountType is one of these 4 treasury
// types, and surface them under COUNCIL's receipt Treasury PLA
// column. STATE's own output (cfbStateRows below) is completely
// unchanged — these are the SAME underlying records also being
// shown a second time under COUNCIL. See dedup note at the bottom
// of this file for why that matters for CONSOLIDATED.
// ─────────────────────────────────────────────────────────────
const COUNCIL_STATE_TREASURY_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// ─────────────────────────────────────────────────────────────
// NEW — Counterfoil carry-forward balance logic.
//
// A CashReceipt (e.g. counterfoilNo "C725") is a lump sum collected in
// cash. Over time, Challan rows sharing that SAME counterfoilNo get
// posted, depositing pieces of that lump sum into treasury. Whatever
// hasn't yet been deposited is still "sitting in cash" and needs to
// keep showing up on the receipt (DR) side's cash column, in every
// subsequent period's cashbook, until the balance nets to zero.
//
// Rule used here (see chat for the explicit assumptions):
//   balance(counterfoilNo, asOf) =
//       SUM(CashReceipt.rupeesInCash WHERE counterfoilNo = X AND date <= asOf)
//     - SUM(Challan.amount          WHERE counterfoilNo = X AND challanDate <= asOf)
//
// A synthetic row is added to a period's cashbook for counterfoil X
// only if:
//   - X's CashReceipt originated BEFORE this period's `from` (so the
//     original entry isn't already shown in full by the normal
//     CashReceipt pull for this same period — avoids double counting)
//   - balance(X, to) > CF_BALANCE_THRESHOLD (i.e. not yet fully
//     deposited/closed out)
// ─────────────────────────────────────────────────────────────
const CF_BALANCE_THRESHOLD = 0.01;

const computeCounterfoilCarryForwards = async (sector, from, to) => {
    const isConsolidated = sector === "CONSOLIDATED";

    // Same scoping convention used everywhere else in this file:
    // CONSOLIDATED = no sector/type filter (i.e. STATE + COUNCIL summed
    // in a single query), never two merged per-sector calls — this is
    // what keeps CONSOLIDATED from double-counting a counterfoil.
    const cashReceiptSectorFilter = !isConsolidated ? { sector } : {};
    const challanTypeFilter = !isConsolidated ? { challanType: sector } : {};

    // Pull every CashReceipt / Challan row sharing a counterfoilNo, up
    // through the END of this period (`to`) — we need full history
    // (not just this period's window) to compute the true cumulative
    // balance.
    const [allCashReceipts, allChallans] = await Promise.all([
        prisma.cashReceipt.findMany({
            where: {
                isActive: true,
                date: { lte: to },
                counterfoilNo: { not: null },
                ...cashReceiptSectorFilter,
            },
            select: { counterfoilNo: true, rupeesInCash: true, date: true },
        }),
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanDate: { lte: to },
                counterfoilNo: { not: null },
                ...challanTypeFilter,
            },
            select: { counterfoilNo: true, amount: true },
        }),
    ]);

    // Group CashReceipts by counterfoilNo: total originally received
    // (cumulative), and the EARLIEST date that counterfoil was ever
    // received on — used to decide whether it originates in a prior
    // period (and therefore needs a carry-forward row) or in this one
    // (already shown via the normal CashReceipt pull, so skip here).
    const receiptsByCounterfoil = new Map();
    allCashReceipts.forEach((r) => {
        const key = (r.counterfoilNo ?? "").trim();
        if (!key || key === "0") return;

        const amt = r.rupeesInCash ? parseFloat(r.rupeesInCash) : 0;
        const existing = receiptsByCounterfoil.get(key) ?? {
            total: 0,
            earliestDate: null,
        };
        existing.total += amt;
        if (!existing.earliestDate || (r.date && r.date < existing.earliestDate)) {
            existing.earliestDate = r.date;
        }
        receiptsByCounterfoil.set(key, existing);
    });

    // Group Challans by counterfoilNo: cumulative amount deposited to
    // treasury against that counterfoil, through `to`.
    const challansByCounterfoil = new Map();
    allChallans.forEach((c) => {
        const key = (c.counterfoilNo ?? "").trim();
        if (!key || key === "0") return;

        const amt = c.amount ? parseFloat(c.amount) : 0;
        challansByCounterfoil.set(
            key,
            (challansByCounterfoil.get(key) ?? 0) + amt
        );
    });

    const carryForwardRows = [];

    for (const [counterfoilNo, { total, earliestDate }] of receiptsByCounterfoil.entries()) {
        // Skip counterfoils whose original CashReceipt falls INSIDE this
        // period — that row is already shown in full by the normal DR-side
        // CashReceipt pull (Condition 1 below). Only counterfoils carried
        // over from an earlier period get a synthetic balance row here.
        const originatesBeforePeriod = earliestDate && earliestDate < from;
        if (!originatesBeforePeriod) continue;

        const challanTotal = challansByCounterfoil.get(counterfoilNo) ?? 0;
        const balance = total - challanTotal;

        if (balance <= CF_BALANCE_THRESHOLD) continue;

        const row = createEmptyRow();
        row.id = `CF-${sector ?? "CONSOLIDATED"}-${counterfoilNo}`;
        row.receiptDate = formatDisplayDate(to);
        row.receiptDateKey = sortableDateKey(to);
        row.receiptCounterfoilNo = counterfoilNo;
        row.receiptParticulars = `Balance carried forward - ${counterfoilNo}`;
        row.receiptCashAmount = parseFloat(balance.toFixed(2));
        row.receiptPlaColumn = null;
        row.receiptClassification = null;
        carryForwardRows.push(row);
    }

    logger.info(`[CASHBOOK] Counterfoil carry-forward rows computed`, {
        sector,
        to: to?.toISOString?.().slice(0, 10),
        counterfoilsConsidered: receiptsByCounterfoil.size,
        carryForwardRowsAdded: carryForwardRows.length,
    });

    return carryForwardRows;
};

// function getFyRange(year) {
//     const from = new Date(Date.UTC(year, 3, 1, 0, 0, 0, 0));
//     const to = new Date(Date.UTC(year + 1, 2, 31, 23, 59, 59, 999));
//     return { from, to };
// }

// Format a Date as dd-mm-yyyy for display. A separate sortable
// yyyy-mm-dd key (sortableDateKey below) is stored alongside every
// row's display date, since sorting/grouping by "dd-mm-yyyy" strings
// directly is wrong (e.g. "31-03-2026" would sort before "01-04-2025").
const formatDisplayDate = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
};

// Sortable yyyy-mm-dd key, independent of display format
const sortableDateKey = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
};

function createEmptyRow() {
    return {
        rowType: "data", // "data" | "dayTotal" — see day-total rows below
        id: null,
        receiptDate: null,
        receiptDateKey: null,
        receiptItemNo: null,
        receiptCounterfoilNo: null,
        receiptParticulars: null,
        receiptCashAmount: null,
        receiptPlaColumn: null,
        receiptClassification: null,
        disbursementDate: null,
        disbursementDateKey: null,
        voucherNo: null,
        disbursementCounterfoilNo: null,
        disbursementDetails: null,
        disbursementCashAmount: null,
        chequeNo: null,
        plaColumnPayment: null,
        treasuryClassification: null,
    };
}

// Joins only truthy, non-blank parts with "-"
const buildClassification = (...parts) =>
    parts
        .filter(
            (p) =>
                p != null &&
                String(p).trim() !== "" &&
                String(p).trim() !== "0"
        )
        .join("-") || null;




// Builds day-total marker row(s) for a given date. Returns an array of
// 0–2 rows: a DR-side total row if that date has receipt rows, and/or
// a CR-side total row if that date has disbursement rows — kept
// single-sided (like every other row here) so each one lands cleanly
// in only ONE of drRows/crRows when the frontend splits by side,
// instead of duplicating into both.
const buildDayTotalRows = (dateKey, displayDate, dayRows) => {
    const results = [];

    const drRowsForDay = dayRows.filter((r) => r.receiptDateKey === dateKey);
    const crRowsForDay = dayRows.filter((r) => r.disbursementDateKey === dateKey);

    if (drRowsForDay.length > 0) {
        const row = createEmptyRow();
        row.rowType = "dayTotal";
        row.id = `DAYTOTAL-DR-${dateKey}`;
        row.receiptDate = displayDate;
        row.receiptDateKey = dateKey;
        row.receiptParticulars = "Total for the day";
        row.receiptCashAmount = drRowsForDay.reduce(
            (s, r) => s + (r.receiptCashAmount ?? 0),
            0
        );
        row.receiptPlaColumn = drRowsForDay.reduce(
            (s, r) => s + (r.receiptPlaColumn ?? 0),
            0
        );
        results.push(row);
    }

    if (crRowsForDay.length > 0) {
        const row = createEmptyRow();
        row.rowType = "dayTotal";
        row.id = `DAYTOTAL-CR-${dateKey}`;
        row.disbursementDate = displayDate;
        row.disbursementDateKey = dateKey;
        row.disbursementDetails = "Total for the day";
        row.disbursementCashAmount = crRowsForDay.reduce(
            (s, r) => s + (r.disbursementCashAmount ?? 0),
            0
        );
        row.plaColumnPayment = crRowsForDay.reduce(
            (s, r) => s + (r.plaColumnPayment ?? 0),
            0
        );
        results.push(row);
    }

    return results;
};

// Inserts day-total row(s) immediately after the last data row of each
// calendar day, for BOTH the DR date sequence and the CR date sequence
// independently.
const insertDayTotals = (rows) => {
    const dataRows = rows.filter((r) => r.rowType === "data");

    const allDateKeys = new Set();
    dataRows.forEach((r) => {
        if (r.receiptDateKey) allDateKeys.add(r.receiptDateKey);
        if (r.disbursementDateKey) allDateKeys.add(r.disbursementDateKey);
    });

    const sortedDateKeys = [...allDateKeys].sort();

    const result = [];
    for (const dateKey of sortedDateKeys) {
        const orderedRowsForThisDate = dataRows.filter(
            (r) => r.receiptDateKey === dateKey || r.disbursementDateKey === dateKey
        );

        result.push(...orderedRowsForThisDate);

        const displayDate = formatDisplayDate(new Date(`${dateKey}T00:00:00.000Z`));
        result.push(...buildDayTotalRows(dateKey, displayDate, orderedRowsForThisDate));
    }

    return result;
};


export const getCashbookRowsByDateRange = async (fromDate, toDate, sector) => {
    try {
        // Normalize incoming date strings/values to full-day UTC bounds,
        // same shape getFyRange used to produce.
        const from = new Date(fromDate);
        from.setUTCHours(0, 0, 0, 0);

        const to = new Date(toDate);
        to.setUTCHours(23, 59, 59, 999);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            const err = new Error("Invalid from/to date");
            err.status = 400;
            throw err;
        }
        if (from > to) {
            const err = new Error("`from` date must be before or equal to `to` date");
            err.status = 400;
            throw err;
        }

        const isStateSector = sector === "STATE";
        const isConsolidated = sector === "CONSOLIDATED";
        const isCouncilSector = sector === "COUNCIL";

        logger.info(`Cashbook fetch started`, {
            sector,
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
        });

        // For models that have a sector field, filter by it unless CONSOLIDATED
        const sectorFilter = !isConsolidated ? { sector } : {};

        // Challan uses challanType instead of sector
        const challanSectorFilter = !isConsolidated ? { challanType: sector } : {};

        const [
            cashReceipts,
            challans,
            challanFromBills,
            challanTwoRows,
            expenditures,
            stateChallans,
            councilCrossStateTreasuryRows, // ← NEW
            counterfoilCarryForwardRows, // ← NEW
        ] = await Promise.all([
            // ── CashReceipt: has sector field (default COUNCIL) ─────
            // Filter by sector unless CONSOLIDATED
            prisma.cashReceipt.findMany({
                where: {
                    date: { gte: from, lte: to },
                    isActive: true,
                    ...(isConsolidated ? {} : { sector }),
                },
                orderBy: { date: "asc" },
            }),

            // ── Challan: has challanType as sector field ─────────────
            prisma.challan.findMany({
                where: {
                    challanDate: { gte: from, lte: to },
                    isActive: true,
                    ...challanSectorFilter,
                },
                orderBy: { challanDate: "asc" },
            }),

            // ── ChallanFromBill: has sector field ────────────────────
            prisma.challanFromBill.findMany({
                where: {
                    voucharDate: { gte: from, lte: to },
                    isActive: true,
                    amountType: { in: [...PLA_AMOUNT_TYPES, ...CASH_AMOUNT_TYPES] },
                    ...sectorFilter,
                },
                orderBy: { voucharDate: "asc" },
            }),

            // ── ChallanTwo: has sector field ─────────────────────────
            prisma.challanTwo.findMany({
                where: {
                    kaacChallanDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { kaacChallanDate: "asc" },
            }),

            // ── Expenditure: has sector field ────────────────────────
            prisma.expenditure.findMany({
                where: {
                    voucherDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { voucherDate: "asc" },
            }),

            // ── StateChallan: only for STATE or CONSOLIDATED ─────────
            isStateSector || isConsolidated
                ? prisma.stateChallan.findMany({
                    where: {
                        challanDate: { gte: from, lte: to },
                        sector: "STATE",
                    },
                    orderBy: { challanDate: "asc" },
                })
                : Promise.resolve([]),

            // ── NEW: STATE-sector ChallanFromBill treasury rows, ─────
            // pulled in ONLY when sector = COUNCIL, to be shown under
            // COUNCIL's receipt Treasury PLA column. STATE's own
            // fetch/handling (above, and cfbStateRows below) is
            // untouched — this is a second, independent read of the
            // same table with a different sector filter.
            isCouncilSector
                ? prisma.challanFromBill.findMany({
                    where: {
                        voucharDate: { gte: from, lte: to },
                        isActive: true,
                        sector: "STATE",
                        amountType: { in: COUNCIL_STATE_TREASURY_TYPES },
                    },
                    orderBy: { voucharDate: "asc" },
                })
                : Promise.resolve([]),

            // ── NEW: counterfoil carry-forward balances (cash column,
            // receipt side), scoped consistently with `sector` — see
            // computeCounterfoilCarryForwards for the CONSOLIDATED
            // double-count-avoidance rule.
            computeCounterfoilCarryForwards(sector, from, to),
        ]);

        logger.info(`[CASHBOOK] Raw fetch counts`, {
            cashReceipts: cashReceipts.length,
            challans: challans.length,
            challanFromBills: challanFromBills.length,
            challanTwoRows: challanTwoRows.length,
            expenditures: expenditures.length,
            stateChallans: stateChallans.length,
            councilCrossStateTreasuryRows: councilCrossStateTreasuryRows.length,
            counterfoilCarryForwardRows: counterfoilCarryForwardRows.length,
        });

        const challansWithoutCounterfoil = challans.filter(
            (c) => !c.counterfoilNo || c.counterfoilNo.trim() === ""
        );
        const challansWithCounterfoil = challans.filter(
            (c) => c.counterfoilNo && c.counterfoilNo.trim() !== ""
        );

        // STATE-sector challanFromBill rows have no cash-column activity:
        // every amountType (all 23 types — the old PLA_AMOUNT_TYPES +
        // CASH_AMOUNT_TYPES combined) posts to the receipt PLA column,
        // and to the disbursement PLA column too EXCEPT "Advance
        // Payment", which is receipt-side only.
        // Non-STATE (COUNCIL) rows keep the original split: PLA types go
        // to the receipt PLA column only, cash types go to both cash
        // columns.
        const cfbStateRows = challanFromBills.filter(
            (cfb) => cfb.sector === "STATE"
        );
        const cfbNonStateRows = challanFromBills.filter(
            (cfb) => cfb.sector !== "STATE"
        );

        const cfbPlaRows = cfbNonStateRows.filter((cfb) =>
            PLA_AMOUNT_TYPES.includes(cfb.amountType)
        );
        const cfbCashRows = cfbNonStateRows.filter((cfb) =>
            CASH_AMOUNT_TYPES.includes(cfb.amountType)
        );

        const rows = [];

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 1: CashReceipt
        // ════════════════════════════════════════════════════════
        cashReceipts.forEach((r) => {
            const row = createEmptyRow();
            row.id = `R-${r.id}`;
            row.receiptDate = formatDisplayDate(r.date);
            row.receiptDateKey = sortableDateKey(r.date);
            row.receiptCounterfoilNo = r.counterfoilNo ?? null;
            const parts = [
                r.receivedFrom,
                r.letterNo ? `Letter No: ${r.letterNo}` : null,
                r.letterDate
                    ? `Letter Date: ${new Date(r.letterDate).toLocaleDateString()}`
                    : null,
            ].filter(Boolean);
            row.receiptParticulars = parts.join(" | ") || null;
            row.receiptCashAmount = r.rupeesInCash
                ? parseFloat(r.rupeesInCash)
                : null;
            row.receiptPlaColumn = null;
            row.receiptClassification = null;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 1B (NEW): Counterfoil carry-forward
        // balances — the still-undeposited portion of an earlier
        // period's CashReceipt, keyed by counterfoilNo, shown in this
        // period's cash column until it nets to zero.
        // ════════════════════════════════════════════════════════
        counterfoilCarryForwardRows.forEach((row) => rows.push(row));

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 2: Challan WITHOUT counterfoilNo
        // ════════════════════════════════════════════════════════
        challansWithoutCounterfoil.forEach((c) => {
            const row = createEmptyRow();
            row.id = `C-DR-${c.id}`;
            row.receiptDate = formatDisplayDate(c.challanDate);
            row.receiptDateKey = sortableDateKey(c.challanDate);
            row.receiptItemNo = c.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = c.remarks ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn = c.amount
                ? parseFloat(c.amount.toString())
                : null;
            row.receiptClassification = buildClassification(
                c.majorHead,
                c.subMajorHead,
                c.minorHead,
                c.subHead,
                c.subSubHead,
                c.detailHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3A: ChallanFromBill (PLA types) — own sector
        // ════════════════════════════════════════════════════════
        cfbPlaRows.forEach((cfb) => {
            const row = createEmptyRow();
            row.id = `CFB-DR-PLA-${cfb.id}`;
            row.receiptDate = formatDisplayDate(cfb.voucharDate);
            row.receiptDateKey = sortableDateKey(cfb.voucharDate);
            row.receiptItemNo = cfb.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = cfb.amountType ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;
            row.receiptClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3A-2 (NEW): ChallanFromBill treasury rows
        // from STATE sector, surfaced under COUNCIL's receipt Treasury
        // PLA column.
        // ════════════════════════════════════════════════════════
        councilCrossStateTreasuryRows.forEach((cfb) => {
            const row = createEmptyRow();
            row.id = `CFB-DR-STATE-FOR-COUNCIL-${cfb.id}`;
            row.receiptDate = formatDisplayDate(cfb.voucharDate);
            row.receiptDateKey = sortableDateKey(cfb.voucharDate);
            row.receiptItemNo = cfb.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = cfb.amountType ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;
            row.receiptClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3B: ChallanFromBill (Cash types)
        // ════════════════════════════════════════════════════════
        cfbCashRows.forEach((cfb) => {
            const row = createEmptyRow();
            row.id = `CFB-DR-CASH-${cfb.id}`;
            row.receiptDate = formatDisplayDate(cfb.voucharDate);
            row.receiptDateKey = sortableDateKey(cfb.voucharDate);
            row.receiptItemNo = cfb.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = cfb.amountType ?? null;
            row.receiptCashAmount = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;
            row.receiptPlaColumn = null;
            row.receiptClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR + CR SIDE — CONDITION 3C: ChallanFromBill (STATE-sector rows)
        // ════════════════════════════════════════════════════════
        cfbStateRows.forEach((cfb) => {
            const cfbDateKey = sortableDateKey(cfb.voucharDate);
            const cfbDate = formatDisplayDate(cfb.voucharDate);
            const classification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            const amount = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;

            // Receipt side — always, for every STATE amountType
            const drRow = createEmptyRow();
            drRow.id = `CFB-DR-STATE-${cfb.id}`;
            drRow.receiptDate = cfbDate;
            drRow.receiptDateKey = cfbDateKey;
            drRow.receiptItemNo = cfb.challanNo ?? null;
            drRow.receiptCounterfoilNo = null;
            drRow.receiptParticulars = cfb.amountType ?? null;
            drRow.receiptCashAmount = null;
            drRow.receiptPlaColumn = amount;
            drRow.receiptClassification = classification;
            rows.push(drRow);

            // Disbursement side — every STATE amountType EXCEPT
            // "Advance Payment"
            if (cfb.amountType !== "Advance Payment") {
                const crRow = createEmptyRow();
                crRow.id = `CFB-CR-STATE-${cfb.id}`;
                crRow.disbursementDate = cfbDate;
                crRow.disbursementDateKey = cfbDateKey;
                crRow.voucherNo = cfb.challanNo ?? null;
                crRow.disbursementCounterfoilNo = null;
                crRow.disbursementDetails = cfb.amountType ?? null;
                crRow.disbursementCashAmount = null;
                crRow.chequeNo = cfb.chequeNo ?? null;
                crRow.plaColumnPayment = amount;
                crRow.treasuryClassification = classification;
                rows.push(crRow);
            }
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 4: Challan WITH counterfoilNo (DR + CR pair)
        // ════════════════════════════════════════════════════════
        challansWithCounterfoil.forEach((c) => {
            const challanDateKey = sortableDateKey(c.challanDate);
            const challanDate = formatDisplayDate(c.challanDate);

            const fullClassification = buildClassification(
                c.majorHead,
                c.subMajorHead,
                c.minorHead,
                c.subHead,
                c.subSubHead,
                c.detailHead
            );

            const drRow = createEmptyRow();
            drRow.id = `C-DR-CF-${c.id}`;
            drRow.receiptDate = challanDate;
            drRow.receiptDateKey = challanDateKey;
            drRow.receiptItemNo = c.challanNo ?? null;
            drRow.receiptCounterfoilNo = c.counterfoilNo ?? null;
            drRow.receiptParticulars = c.remarks ?? null;
            drRow.receiptCashAmount = null;
            drRow.receiptPlaColumn = c.amount
                ? parseFloat(c.amount.toString())
                : null;
            drRow.receiptClassification = fullClassification;
            rows.push(drRow);

            const crRow = createEmptyRow();
            crRow.id = `C-CR-CF-${c.id}`;
            crRow.disbursementDate = challanDate;
            crRow.disbursementDateKey = challanDateKey;
            crRow.voucherNo = c.challanNo ?? null;
            crRow.disbursementCounterfoilNo = c.counterfoilNo ?? null;
            crRow.disbursementDetails = c.remarks ?? null;
            crRow.disbursementCashAmount = c.amount
                ? parseFloat(c.amount.toString())
                : null;
            crRow.chequeNo = null;
            crRow.plaColumnPayment = null;
            crRow.treasuryClassification = fullClassification;
            rows.push(crRow);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 5: ChallanTwo
        // ════════════════════════════════════════════════════════
        challanTwoRows.forEach((ct) => {
            const row = createEmptyRow();
            row.id = `CT-DR-${ct.id}`;
            row.receiptDate = formatDisplayDate(ct.kaacChallanDate);
            row.receiptDateKey = sortableDateKey(ct.kaacChallanDate);
            row.receiptItemNo = ct.kaacChallanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = ct.remarks ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn = ct.amount
                ? parseFloat(ct.amount.toString())
                : null;
            row.receiptClassification = buildClassification(
                ct.majorHead,
                ct.subMajor,
                ct.minorHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 6: StateChallan (STATE or CONSOLIDATED only)
        // ════════════════════════════════════════════════════════
        stateChallans.forEach((sc) => {
            const row = createEmptyRow();
            row.id = `SC-DR-${sc.id}`;
            row.receiptDate = formatDisplayDate(sc.challanDate);
            row.receiptDateKey = sortableDateKey(sc.challanDate);
            row.receiptItemNo = sc.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = sc.remarks ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn =
                sc.totalAmount != null
                    ? parseFloat((sc.totalAmount).toFixed(2))
                    : null;
            row.receiptClassification = buildClassification(
                sc.majorHead,
                sc.subMajorHead,
                sc.minorHead,
                sc.subHead,
                sc.subSubHead,
                sc.detailHead,
                sc.subDetailHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 2: Expenditure
        // ════════════════════════════════════════════════════════
        expenditures.forEach((e) => {
            const row = createEmptyRow();
            row.id = `E-CR-${e.id}`;
            row.disbursementDate = formatDisplayDate(e.voucherDate);
            row.disbursementDateKey = sortableDateKey(e.voucherDate);
            row.voucherNo = e.voucherNo ?? null;
            row.disbursementCounterfoilNo = null;
            row.disbursementDetails = e.remarks ?? null;
            row.disbursementCashAmount = null;
            row.chequeNo = e.chequeNo ?? e.chequeBookNo ?? null;
            row.plaColumnPayment = e.grossAmount
                ? parseFloat(e.grossAmount.toString())
                : null;
            row.treasuryClassification = buildClassification(
                e.majorHead,
                e.subMajorHead,
                e.minorHead,
                e.subHead,
                e.subSubHead,
                e.detailHead,
                e.subDetailHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 3: ChallanFromBill (Cash types)
        // ════════════════════════════════════════════════════════
        cfbCashRows.forEach((cfb) => {
            const row = createEmptyRow();
            row.id = `CFB-CR-${cfb.id}`;
            row.disbursementDate = formatDisplayDate(cfb.voucharDate);
            row.disbursementDateKey = sortableDateKey(cfb.voucharDate);
            row.voucherNo = cfb.challanNo ?? null;
            row.disbursementCounterfoilNo = null;
            row.disbursementDetails = cfb.amountType ?? null;
            row.disbursementCashAmount = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;
            row.chequeNo = cfb.chequeNo ?? null;
            row.plaColumnPayment = null;
            row.treasuryClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // SORT all data rows by date (using the sortable key, not the
        // dd-mm-yyyy display string)
        // ════════════════════════════════════════════════════════
        rows.sort((a, b) => {
            const dateA = a.receiptDateKey || a.disbursementDateKey || "";
            const dateB = b.receiptDateKey || b.disbursementDateKey || "";
            return dateA.localeCompare(dateB);
        });

        // ════════════════════════════════════════════════════════
        // ASSIGN running item numbers on DR side (before day-totals
        // are inserted, so numbering only covers real data rows)
        // ════════════════════════════════════════════════════════
        let itemCounter = 1;
        rows.forEach((row) => {
            if (row.receiptDate && !row.receiptItemNo) {
                row.receiptItemNo = String(itemCounter).padStart(3, "0");
                itemCounter++;
            }
        });

        // ════════════════════════════════════════════════════════
        // INSERT day-wise total rows (rowType: "dayTotal") after each
        // day's data rows, for both DR and CR dates.
        // ════════════════════════════════════════════════════════
        const rowsWithDayTotals = insertDayTotals(rows);

        // ── Final summary ─────────────────────────────────────────
        const drRows = rows.filter((r) => r.receiptDate);
        const crRows = rows.filter((r) => r.disbursementDate);

        logger.info(`[CASHBOOK] Final summary`, {
            totalRows: rowsWithDayTotals.length,
            drRows: drRows.length,
            crRows: crRows.length,
            drCashTotal: drRows.reduce(
                (s, r) => s + (r.receiptCashAmount ?? 0),
                0
            ),
            drPlaTotal: drRows.reduce(
                (s, r) => s + (r.receiptPlaColumn ?? 0),
                0
            ),
            crCashTotal: crRows.reduce(
                (s, r) => s + (r.disbursementCashAmount ?? 0),
                0
            ),
            crPlaTotal: crRows.reduce(
                (s, r) => s + (r.plaColumnPayment ?? 0),
                0
            ),
        });

        return rowsWithDayTotals;
    } catch (error) {
        logger.error(`Cashbook service error`, {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};


export const saveCashbookSummary = async ({
    sector,
    month,
    year,
    financialYear,
    fromDate,
    toDate,
    receiptCashColumn,
    receiptTreasuryPla,
    disbursementCashColumn,
    disbursementTreasuryPla,
}) => {
    try {
        await prisma.cashbookInformations.updateMany({
            where: { sector: sector ?? undefined, isActive: true },
            data: { isActive: false },
        });

        const parsedFromDate = fromDate ? new Date(fromDate) : null;
        const parsedToDate = toDate ? new Date(toDate) : null;

        const createData = {
            sector: sector ?? null,
            month: month ?? null,
            year: year ?? null,
            financialYear: financialYear ?? null,
            fromDate: parsedFromDate,
            toDate: parsedToDate,
            receiptCashColumn: receiptCashColumn ?? 0,
            receiptTreasuryPla: receiptTreasuryPla ?? 0,
            disbursementCashColumn: disbursementCashColumn ?? 0,
            disbursementTreasuryPla: disbursementTreasuryPla ?? 0,
            isActive: true,
        };

        const newEntry = await prisma.cashbookInformations.create({
            data: createData,
        });

        return newEntry;
    } catch (error) {
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────
// DEDUP NOTE — read before relying on CONSOLIDATED totals
//
// If your frontend still calls this service twice (once "COUNCIL",
// once "STATE") and merges client-side rather than calling it once
// with sector = "CONSOLIDATED":
//   • The 4-type STATE treasury ChallanFromBill rows will appear
//     TWICE when merged (see the original note this replaces) unless
//     you filter out one prefix before combining.
//   • The NEW counterfoil carry-forward rows will NOT double-count in
//     that merge scenario, because each per-sector call only sums
//     CashReceipts/Challans belonging to that same sector — a given
//     counterfoilNo's CashReceipt.sector determines which single call
//     produces its carry-forward row.
//   • Day-total rows still won't merge into one combined total per
//     date across two separate calls — that logic would need to move
//     to the frontend after merging, same as before.
//
// If instead you call this service ONCE with sector = "CONSOLIDATED",
// all three concerns above are avoided by construction: every filter
// in this file (including the new carry-forward logic) drops its
// sector/challanType scoping and sums across both sectors in a single
// query, matching the pattern already used by CONSOLIDATED elsewhere
// in this codebase.
// ─────────────────────────────────────────────────────────────