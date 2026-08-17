import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// FORM 4 - Register of Remittances to Treasury (PLA)
// Data comes from 4 tables: challan, challanTwo, challanFromBill,
// stateChallan
// (STATE sector: only from StateChallan table — see getForm4Data)
//
// COUNCIL — matches Form 1 (Cashbook) Receipt side Treasury PLA
// column: in addition to COUNCIL's own ChallanFromBill rows, also
// pulls ChallanFromBill rows where sector = STATE and amountType is
// one of the 4 treasury types below — same cross-sector pull as
// councilCrossStateTreasuryRows in cashbookService.js. STATE's own
// fetching/handling is completely untouched.
//
// `year` is optional. When passed, every table is filtered to the
// same financial-year window (April 1 → March 31) that
// getCashbookRowsByFy uses, on the same date field per table
// (challanDate / kaacChallanDate / voucharDate), so COUNCIL's Form 4
// total reconciles against Form 1's COUNCIL Receipt Treasury PLA
// total. If omitted, date filtering is skipped (old all-time
// behavior) for backward compatibility.
// ─────────────────────────────────────────────────────────────

const ALLOWED_AMOUNT_TYPES = [
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

// Same cross-sector addition as cashbookService.js's
// COUNCIL_STATE_TREASURY_TYPES — only applies when sector = COUNCIL.
const COUNCIL_STATE_TREASURY_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// Same financial-year window Cashbook uses (April 1 → March 31).
function getFyRange(year) {
    const from = new Date(Date.UTC(year, 3, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year + 1, 2, 31, 23, 59, 59, 999));
    return { from, to };
}

// Helper — variadic to support any number of head levels
const buildClassification = (...parts) => {
    return (
        parts.filter((part) => part && part.trim() !== "").join(" / ") || "-"
    );
};

// ─────────────────────────────────────────────────────────────

const getForm4ChallanRows = async (sector, dateRange) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.challanType = sector;
    }

    if (dateRange) {
        where.challanDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challan.findMany({ where });

    logger.info(
        `Fetched ${rows.length} rows from Challan table for sector: ${sector ?? "ALL"}`
    );

    return rows.map((row) => ({
        id: `challan-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.challanDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildClassification(
            row.majorHead,
            row.subMajorHead,
            row.minorHead
        ),
        remarks: row.remarks ?? "-",
        sector: row.challanType ?? null,
        source: "challan",
    }));
};

const getForm4ChallanTwoRows = async (sector, dateRange) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
    }

    if (dateRange) {
        where.kaacChallanDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challanTwo.findMany({ where });

    logger.info(
        `Fetched ${rows.length} rows from ChallanTwo table for sector: ${sector ?? "ALL"}`
    );

    return rows.map((row) => ({
        id: `challanTwo-${row.id}`,
        clnNo: row.kaacChallanNo ?? "-",
        date: row.kaacChallanDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead
        ),
        remarks: row.narration ?? "-",
        sector: row.sector ?? null,
        source: "challanTwo",
    }));
};

const getForm4ChallanFromBillRows = async (sector, dateRange) => {
    const where = {
        isActive: true,
        amountType: { in: ALLOWED_AMOUNT_TYPES },
    };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
    }

    if (dateRange) {
        where.voucharDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Fetched ${rows.length} rows from ChallanFromBill table for sector: ${sector ?? "ALL"}`
    );

    return rows.map((row) => ({
        id: `challanFromBill-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.voucharDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead
        ),
        remarks: row.amountType ?? "-",
        sector: row.sector ?? null,
        source: "challanFromBill",
    }));
};

// ─────────────────────────────────────────────────────────────
// ChallanFromBill rows where sector = STATE and amountType is one of
// the 4 treasury types, shown under COUNCIL. Only ever called when
// sector = "COUNCIL". Same row shape as getForm4ChallanFromBillRows;
// distinct id prefix so the source is traceable; `sector` on the row
// stays "STATE" (the record's real sector) rather than "COUNCIL".
// ─────────────────────────────────────────────────────────────
const getForm4CouncilCrossStateTreasuryRows = async (dateRange) => {
    const where = {
        isActive: true,
        sector: "STATE",
        amountType: { in: COUNCIL_STATE_TREASURY_TYPES },
    };

    if (dateRange) {
        where.voucharDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Fetched ${rows.length} STATE-sector treasury rows from ChallanFromBill for COUNCIL's Form 4`
    );

    return rows.map((row) => ({
        id: `challanFromBill-state-for-council-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.voucharDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead
        ),
        remarks: row.amountType ?? "-",
        sector: row.sector ?? null, // "STATE" — the record's real sector
        source: "challanFromBill-stateForCouncil",
    }));
};

// ─────────────────────────────────────────────────────────────
// StateChallan rows (STATE sector) — COMPLETELY UNCHANGED
// Amount is stored in lakhs → multiply by 100000
// Classification spans all 7 head levels
// isActive check: StateChallan has no isActive field in the
// schema above, so we filter by sector = "STATE" only.
// If you add isActive to the model later, add it to `where`.
// No date filter here either — left exactly as it was.
// ─────────────────────────────────────────────────────────────
const getForm4StateChallanRows = async () => {
    const rows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
        },
        orderBy: { challanDate: "asc" },
    });

    logger.info(`Fetched ${rows.length} rows from StateChallan table`);

    return rows.map((row) => ({
        id: `stateChallan-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.challanDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount:
            row.totalAmount != null
                ? parseFloat((row.totalAmount).toFixed(2))
                : 0,
        // Cash Book Item No. = challanNo per spec
        refItemNo: row.challanNo ?? "-",
        classification: buildClassification(
            row.majorHead,
            row.subMajorHead,
            row.minorHead,
            row.subHead,
            row.subSubHead,
            row.detailHead,
            row.subDetailHead
        ),
        remarks: row.remarks ?? "-",
        sector: "STATE",
        source: "stateChallan",
    }));
};

// ─────────────────────────────────────────────────────────────
// Main Form 4 function
//
// SECTOR RULES:
// - sector === "STATE"        → StateChallan ONLY (challan, challanTwo,
//                                 challanFromBill are skipped) — UNCHANGED
// - sector === "COUNCIL"      → Challan + ChallanTwo + ChallanFromBill
//                                 (COUNCIL only), PLUS ChallanFromBill
//                                 rows where sector = STATE and
//                                 amountType is one of the 4 treasury
//                                 types (matches Cashbook's COUNCIL
//                                 Receipt Treasury PLA column)
// - sector === "CONSOLIDATED" → Challan + ChallanTwo + ChallanFromBill
//                                 (all sectors, unfiltered — already
//                                 includes the STATE treasury rows via
//                                 the unfiltered ChallanFromBill fetch,
//                                 so the cross-rows helper does NOT run
//                                 here — no double counting) + StateChallan
// - any other sector          → Challan + ChallanTwo + ChallanFromBill
//                                 (that sector only), no StateChallan
// ─────────────────────────────────────────────────────────────
export const getForm4Data = async (sector, year) => {
    try {
        logger.info(
            `Fetching Form 4 data for sector: ${sector ?? "ALL"}, year: ${year ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        const dateRange = year != null ? getFyRange(year) : null;

        let challanRows = [];
        let challanTwoRows = [];
        let challanFromBillRows = [];
        let stateChallanRows = [];
        let councilCrossStateTreasuryRows = [];

        if (isStateSector) {
            // ── STATE sector: ONLY StateChallan table, UNCHANGED ──
            logger.info(
                `Form4: sector=STATE → skipping Challan, ChallanTwo & ChallanFromBill, using StateChallan only`
            );
            stateChallanRows = await getForm4StateChallanRows();
        } else {
            // ── Non-STATE sectors ─────────────────────────────────
            [challanRows, challanTwoRows, challanFromBillRows, stateChallanRows, councilCrossStateTreasuryRows] =
                await Promise.all([
                    getForm4ChallanRows(sector, dateRange),
                    getForm4ChallanTwoRows(sector, dateRange),
                    getForm4ChallanFromBillRows(sector, dateRange),
                    includeStateChallans
                        ? getForm4StateChallanRows()
                        : Promise.resolve([]),
                    // Only fires for sector = COUNCIL — CONSOLIDATED
                    // already gets these rows via the unfiltered
                    // getForm4ChallanFromBillRows("CONSOLIDATED") call
                    // above, so running this too would double-count.
                    isCouncilSector
                        ? getForm4CouncilCrossStateTreasuryRows(dateRange)
                        : Promise.resolve([]),
                ]);
        }

        const allRows = [
            ...challanRows,
            ...challanTwoRows,
            ...challanFromBillRows,
            ...stateChallanRows,
            ...councilCrossStateTreasuryRows,
        ];

        logger.info(
            `Form4: Rows going into merge — challan: ${challanRows.length}, challanTwo: ${challanTwoRows.length}, ` +
            `challanFromBill: ${challanFromBillRows.length}, stateChallan: ${stateChallanRows.length}, ` +
            `councilCrossStateTreasuryRows: ${councilCrossStateTreasuryRows.length}`
        );

        const sorted = allRows.sort((a, b) => new Date(a.date) - new Date(b.date));

        logger.info(`Form 4 total rows returned: ${sorted.length}`);

        return sorted;
    } catch (error) {
        logger.error(`Error fetching Form 4 data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// FORM 5A - Classified Abstract of Receipts
//
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED. StateChallan ONLY,
//                                 restricted to majorHead in
//                                 [2011, 3999]. Challan and
//                                 ChallanFromBill are skipped.
// - sector === "COUNCIL"      → REPLACED.
//                                 • Challan: rows where challanType =
//                                   COUNCIL AND majorHead numeric value
//                                   is in [1, 16] (was: all COUNCIL
//                                   Challan rows, no majorHead filter).
//                                 • ChallanFromBill: rows where sector
//                                   IS EITHER COUNCIL OR STATE, and
//                                   amountType is one of the 4 treasury
//                                   types — this deliberately pulls in
//                                   STATE's treasury-type
//                                   ChallanFromBill rows and shows them
//                                   under COUNCIL too (was: COUNCIL's
//                                   own rows only).
//                                 • StateChallan: NOT included (same as
//                                   before).
// - sector === "CONSOLIDATED" → Combines STATE's rule (StateChallan,
//                                 majorHead 2011–3999) + COUNCIL's rule
//                                 above. NOTE: this is a behavior change
//                                 from before — CONSOLIDATED previously
//                                 used the FULL, unrestricted
//                                 StateChallan set; it now uses the same
//                                 2011–3999-restricted set sector=STATE
//                                 uses, to stay consistent with "STATE's
//                                 own rule" everywhere else in this file.
// - any other sector          → no rule defined, empty result.
// ─────────────────────────────────────────────────────────────

const FORM5A_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// ─────────────────────────────────────────────────────────────
// StateChallan rows (STATE sector) — UNCHANGED
// Amount stored in lakhs → multiply by 100000
// No isActive field on StateChallan model — filter by sector only
//
// majorHeadRangeOnly: when true, restricts rows to majorHead
// numeric value in [2011, 3999] inclusive. majorHead is stored as
// a string, so we parse to int rather than doing a DB-level string
// range comparison (which would sort lexicographically and give
// wrong results).
// ─────────────────────────────────────────────────────────────
const getForm5AStateChallanRows = async ({ majorHeadRangeOnly = false } = {}) => {
    const rows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
        },
        orderBy: { challanDate: "asc" },
    });

    logger.info(
        `Form5A: Fetched ${rows.length} rows from StateChallan (pre majorHead-range filter)`
    );

    const isInRange = (majorHead) => {
        if (!majorHead) return false;
        const num = parseInt(majorHead, 10);
        return !Number.isNaN(num) && num >= 2011 && num <= 3999;
    };

    const filteredRows = majorHeadRangeOnly
        ? rows.filter((row) => isInRange(row.majorHead))
        : rows;

    if (majorHeadRangeOnly) {
        const excludedCount = rows.length - filteredRows.length;
        logger.info(
            `Form5A: StateChallan rows after majorHead 2011-3999 filter: ${filteredRows.length} (excluded ${excludedCount})`
        );
    }

    return filteredRows.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount:
            row.totalAmount != null
                ? parseFloat((row.totalAmount).toFixed(2))
                : 0,
        sector: "STATE",
        source: "stateChallan",
    }));
};

// ─────────────────────────────────────────────────────────────
// NEW — Challan rows for COUNCIL: challanType = COUNCIL, restricted
// to majorHead numeric value in [1, 16]. Same string→int parsing
// approach as the StateChallan range filter above, since majorHead
// is a string field.
// ─────────────────────────────────────────────────────────────
const isMajorHeadInCouncilRangeForm5A = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 1 && num <= 16;
};

const getForm5ACouncilChallanRows = async () => {
    const rows = await prisma.challan.findMany({
        where: {
            isActive: true,
            challanType: "COUNCIL",
        },
    });

    logger.info(
        `Form5A: Fetched ${rows.length} COUNCIL Challan rows (pre majorHead 1-16 filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInCouncilRangeForm5A(row.majorHead));

    logger.info(
        `Form5A: COUNCIL Challan rows after majorHead 1-16 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        sector: row.challanType ?? null,
        source: "challan",
    }));
};

// ─────────────────────────────────────────────────────────────
// NEW — ChallanFromBill rows for COUNCIL: sector IN [COUNCIL,
// STATE], amountType in the 4 treasury types. This is what
// deliberately cross-includes STATE's treasury-type ChallanFromBill
// rows under COUNCIL's Form 5A.
// ─────────────────────────────────────────────────────────────
const getForm5ACouncilChallanFromBillRows = async () => {
    const rows = await prisma.challanFromBill.findMany({
        where: {
            isActive: true,
            amountType: { in: FORM5A_ALLOWED_AMOUNT_TYPES },
            sector: { in: ["COUNCIL", "STATE"] },
        },
    });

    logger.info(
        `Form5A: Fetched ${rows.length} ChallanFromBill rows for COUNCIL (sector IN COUNCIL, STATE)`
    );

    return rows.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajor ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        sector: row.sector ?? null,
        source: "challanFromBill",
    }));
};

// ─────────────────────────────────────────────────────────────
// Main Form 5A function
// Groups rows by majorHead
// If multiple rows share the same majorHead → show each as detail + total row
// If only one row for a majorHead → show just that row
// ─────────────────────────────────────────────────────────────
export const getForm5AData = async (sector) => {
    try {
        logger.info(`Fetching Form 5A data for sector: ${sector ?? "ALL"}`);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let allRows = [];

        if (isStateSector) {
            // ── STATE sector: ONLY StateChallan, majorHead 2011-3999 ──
            const stateChallanRows = await getForm5AStateChallanRows({
                majorHeadRangeOnly: true,
            });
            allRows = [...stateChallanRows];

            logger.info(
                `Form5A: Rows going into grouping — stateChallan: ${stateChallanRows.length}`
            );
        } else if (isCouncilSector) {
            // ── COUNCIL sector: Challan (majorHead 1-16) + ────────
            // ChallanFromBill (sector IN COUNCIL, STATE)
            const [councilChallanRows, councilChallanFromBillRows] = await Promise.all([
                getForm5ACouncilChallanRows(),
                getForm5ACouncilChallanFromBillRows(),
            ]);
            allRows = [...councilChallanRows, ...councilChallanFromBillRows];

            logger.info(
                `Form5A: Rows going into grouping — councilChallan: ${councilChallanRows.length}, councilChallanFromBill: ${councilChallanFromBillRows.length}`
            );
        } else if (isConsolidated) {
            // ── CONSOLIDATED: STATE's rule + COUNCIL's rule ───────
            const [stateChallanRows, councilChallanRows, councilChallanFromBillRows] =
                await Promise.all([
                    getForm5AStateChallanRows({ majorHeadRangeOnly: true }),
                    getForm5ACouncilChallanRows(),
                    getForm5ACouncilChallanFromBillRows(),
                ]);
            allRows = [
                ...stateChallanRows,
                ...councilChallanRows,
                ...councilChallanFromBillRows,
            ];

            logger.info(
                `Form5A: Rows going into grouping — stateChallan: ${stateChallanRows.length}, councilChallan: ${councilChallanRows.length}, councilChallanFromBill: ${councilChallanFromBillRows.length}`
            );
        } else {
            // Any other sector value: no rule defined
            logger.info(
                `Form5A: no rule defined for sector "${sector}" — returning empty result`
            );
            allRows = [];
        }

        // Group rows by majorHead
        const grouped = allRows.reduce((acc, row) => {
            const key = row.majorHead;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(row);
            return acc;
        }, {});

        // Build final result
        const result = Object.entries(grouped).map(([majorHead, rows]) => {
            const total = rows.reduce((sum, row) => sum + row.amount, 0);
            return {
                majorHead,
                rows,
                total: parseFloat(total.toFixed(2)),
                hasMultiple: rows.length > 1,
            };
        });

        logger.info(`Form 5A total groups returned: ${result.length}`);

        return result;
    } catch (error) {
        logger.error(`Error fetching Form 5A data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// FORM 5B - Classified Abstract of Expenditure
//
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED. No expenditureType filter.
//                                 Expenditure rows where sector = STATE,
//                                 then JS-filtered to majorHead numeric
//                                 range 2011–3999 (string field, so a
//                                 DB-level range compare would sort
//                                 lexicographically and be wrong).
// - sector === "COUNCIL"      → REPLACED. No longer filters by
//                                 expenditureType = "REVENUE" and no
//                                 majorHead restriction. Instead: ALL
//                                 active Expenditure rows where
//                                 sector = COUNCIL, column-mapped as-is
//                                 (payOfficers, payEstablishment, etc.
//                                 come straight from the row — per row,
//                                 only one of these is normally
//                                 populated, matching grossAmount, so
//                                 no override is needed).
// - sector === "CONSOLIDATED" → Combines BOTH rule sets above: STATE's
//                                 majorHead-range rows + COUNCIL's
//                                 unfiltered (all) rows, merged before
//                                 grouping. (The old blanket
//                                 expenditureType = "REVENUE" filter no
//                                 longer applies to COUNCIL, so
//                                 CONSOLIDATED can no longer just query
//                                 "REVENUE across all sectors" — the two
//                                 sectors now use genuinely different
//                                 filter rules.)
// Grouped by majorHead — total row if multiple entries
// ─────────────────────────────────────────────────────────────

// Renamed from isMajorHeadInStateRange → isMajorHeadInStateRangeForm5B
// to avoid a duplicate-identifier collision with Form 5C's helper of
// the same original name in this same forms.service.js file.
const isMajorHeadInStateRangeForm5B = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 2011 && num <= 3999;
};

// ── STATE rows — UNCHANGED logic ────────────────────────────
const getForm5BStateRows = async () => {
    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "STATE",
        },
    });

    logger.info(
        `Form5B: Fetched ${rows.length} STATE rows from Expenditure table (pre majorHead-range filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInStateRangeForm5B(row.majorHead));

    logger.info(
        `Form5B: STATE rows after majorHead 2011-3999 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered;
};

// ── COUNCIL rows — NEW logic: ALL active COUNCIL rows, no ────
// expenditureType filter, no majorHead restriction.
const getForm5BCouncilRows = async () => {
    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "COUNCIL",
        },
    });

    logger.info(
        `Form5B: Fetched ${rows.length} COUNCIL rows from Expenditure table (all, unfiltered by type)`
    );

    return rows;
};

export const getForm5BData = async (sector) => {
    try {
        logger.info(`Fetching Form 5B data for sector: ${sector ?? "ALL"}`);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let rows = [];

        if (isStateSector) {
            rows = await getForm5BStateRows();
        } else if (isCouncilSector) {
            rows = await getForm5BCouncilRows();
        } else if (isConsolidated) {
            const [stateRows, councilRows] = await Promise.all([
                getForm5BStateRows(),
                getForm5BCouncilRows(),
            ]);
            rows = [...stateRows, ...councilRows];
        } else {
            // Any other sector value: no rule defined — return empty
            // rather than silently falling back to the old REVENUE-type
            // filter, since that filter no longer represents COUNCIL and
            // STATE now has its own dedicated rule.
            logger.info(
                `Form5B: no rule defined for sector "${sector}" — returning empty result`
            );
            rows = [];
        }

        // Group rows by majorHead
        const grouped = rows.reduce((acc, row) => {
            const key = row.majorHead ?? "Unknown";
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(row);
            return acc;
        }, {});

        // Build final result per group
        const result = Object.entries(grouped).map(([majorHead, groupRows]) => {
            // Sum each amount column across all rows in this group
            const totals = groupRows.reduce(
                (sum, row) => ({
                    payOfficers: sum.payOfficers + parseFloat(row.payOfficers ?? 0),
                    payEstablishment: sum.payEstablishment + parseFloat(row.payEstablishment ?? 0),
                    allowanceHonorary: sum.allowanceHonorary + parseFloat(row.allowanceHonorary ?? 0),
                    contingencies: sum.contingencies + parseFloat(row.contingencies ?? 0),
                    grantsInAid: sum.grantsInAid + parseFloat(row.grantsInAid ?? 0),
                    works: sum.works + parseFloat(row.works ?? 0),
                    grossAmount: sum.grossAmount + parseFloat(row.grossAmount ?? 0),
                }),
                {
                    payOfficers: 0,
                    payEstablishment: 0,
                    allowanceHonorary: 0,
                    contingencies: 0,
                    grantsInAid: 0,
                    works: 0,
                    grossAmount: 0,
                }
            );

            // Map each row with its head code and amounts
            const mappedRows = groupRows.map((row) => ({
                // Full head code: majorHead-subMajorHead-minorHead
                headCode: [row.majorHead, row.subMajorHead, row.minorHead]
                    .filter((p) => p && p.trim() !== "")
                    .join("-"),
                majorHead: row.majorHead ?? "-",
                subMajorHead: row.subMajorHead ?? "-",
                minorHead: row.minorHead ?? "-",
                payOfficers: parseFloat(row.payOfficers ?? 0),
                payEstablishment: parseFloat(row.payEstablishment ?? 0),
                allowanceHonorary: parseFloat(row.allowanceHonorary ?? 0),
                contingencies: parseFloat(row.contingencies ?? 0),
                grantsInAid: parseFloat(row.grantsInAid ?? 0),
                works: parseFloat(row.works ?? 0),
                grossAmount: parseFloat(row.grossAmount ?? 0),
                sector: row.sector ?? null,
            }));

            return {
                majorHead,
                rows: mappedRows,
                totals,
                // Show total row only if more than one entry for same majorHead
                hasMultiple: groupRows.length > 1,
            };
        });

        logger.info(`Form 5B total groups returned: ${result.length}`);

        return result;
    } catch (error) {
        logger.error(`Error fetching Form 5B data: ${error.message}`);
        throw error;
    }
};



// ─────────────────────────────────────────────────────────────
// FORM 5C - Classified Abstract of Capital Expenditure
//
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED. No expenditureType filter.
//                                 Expenditure rows where sector = STATE,
//                                 then JS-filtered to majorHead numeric
//                                 range 4001–5999 (string field, so a
//                                 DB-level range compare would sort
//                                 lexicographically and be wrong).
// - sector === "COUNCIL"      → REPLACED. No longer filters by
//                                 expenditureType = "CAPITAL". Instead:
//                                 Expenditure rows where sector = COUNCIL
//                                 AND majorHead is EXACTLY one of
//                                 "40", "41", "42", "43". Each row's
//                                 existing amount columns (payOfficers,
//                                 payEstablishment, etc.) are mapped as-is
//                                 — per row, only one of these is
//                                 normally populated, matching grossAmount,
//                                 so no column override is needed.
// - sector === "CONSOLIDATED" → Combines BOTH rule sets above: STATE's
//                                 majorHead-range rows + COUNCIL's
//                                 majorHead-exact rows, merged before
//                                 grouping. (The old blanket
//                                 expenditureType = "CAPITAL" filter no
//                                 longer applies to COUNCIL, so
//                                 CONSOLIDATED can no longer just query
//                                 "CAPITAL across all sectors" — the two
//                                 sectors now use genuinely different
//                                 filter rules.)
// ─────────────────────────────────────────────────────────────

const COUNCIL_MAJOR_HEADS = ["440", "441", "442", "443"];

// Renamed from isMajorHeadInStateRange → isMajorHeadInStateRangeForm5C
// to avoid a duplicate-identifier collision with Form 5B's helper of
// the same original name in this same forms.service.js file.
const isMajorHeadInStateRangeForm5C = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 4001 && num <= 5999;
};

// ── STATE rows — UNCHANGED logic ────────────────────────────
const getForm5CStateRows = async () => {
    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "STATE",
        },
    });

    logger.info(
        `Form5C: Fetched ${rows.length} STATE rows from Expenditure table (pre majorHead-range filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInStateRangeForm5C(row.majorHead));

    logger.info(
        `Form5C: STATE rows after majorHead 4001-5999 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered;
};

// ── COUNCIL rows — NEW logic: exact majorHead match, no ──────
// expenditureType filter at all.
const getForm5CCouncilRows = async () => {
    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "COUNCIL",
            majorHead: { in: COUNCIL_MAJOR_HEADS },
        },
    });

    logger.info(
        `Form5C: Fetched ${rows.length} COUNCIL rows from Expenditure table (majorHead in ${COUNCIL_MAJOR_HEADS.join(", ")})`
    );

    return rows;
};

export const getForm5CData = async (sector) => {
    try {
        logger.info(`Fetching Form 5C data for sector: ${sector ?? "ALL"}`);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let rows = [];

        if (isStateSector) {
            rows = await getForm5CStateRows();
        } else if (isCouncilSector) {
            rows = await getForm5CCouncilRows();
        } else if (isConsolidated) {
            const [stateRows, councilRows] = await Promise.all([
                getForm5CStateRows(),
                getForm5CCouncilRows(),
            ]);
            rows = [...stateRows, ...councilRows];
        } else {
            // Any other sector value: no rule defined — return empty
            // rather than silently falling back to the old CAPITAL-type
            // filter, since that filter no longer represents COUNCIL and
            // STATE now has its own dedicated rule.
            logger.info(
                `Form5C: no rule defined for sector "${sector}" — returning empty result`
            );
            rows = [];
        }

        // Group by majorHead
        const grouped = rows.reduce((acc, row) => {
            const key = row.majorHead ?? "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(row);
            return acc;
        }, {});

        const result = Object.entries(grouped).map(([majorHead, groupRows]) => {
            // Sum each amount column across all rows in this group
            const totals = groupRows.reduce(
                (sum, row) => ({
                    payOfficers: sum.payOfficers + parseFloat(row.payOfficers ?? 0),
                    payEstablishment: sum.payEstablishment + parseFloat(row.payEstablishment ?? 0),
                    allowanceHonorary: sum.allowanceHonorary + parseFloat(row.allowanceHonorary ?? 0),
                    contingencies: sum.contingencies + parseFloat(row.contingencies ?? 0),
                    grantsInAid: sum.grantsInAid + parseFloat(row.grantsInAid ?? 0),
                    works: sum.works + parseFloat(row.works ?? 0),
                    grossAmount: sum.grossAmount + parseFloat(row.grossAmount ?? 0),
                }),
                {
                    payOfficers: 0,
                    payEstablishment: 0,
                    allowanceHonorary: 0,
                    contingencies: 0,
                    grantsInAid: 0,
                    works: 0,
                    grossAmount: 0,
                }
            );

            const mappedRows = groupRows.map((row) => ({
                headCode: [row.majorHead, row.subMajorHead, row.minorHead]
                    .filter((p) => p && p.trim() !== "")
                    .join("-"),
                majorHead: row.majorHead ?? "-",
                subMajorHead: row.subMajorHead ?? "-",
                minorHead: row.minorHead ?? "-",
                payOfficers: parseFloat(row.payOfficers ?? 0),
                payEstablishment: parseFloat(row.payEstablishment ?? 0),
                allowanceHonorary: parseFloat(row.allowanceHonorary ?? 0),
                contingencies: parseFloat(row.contingencies ?? 0),
                grantsInAid: parseFloat(row.grantsInAid ?? 0),
                works: parseFloat(row.works ?? 0),
                grossAmount: parseFloat(row.grossAmount ?? 0),
                sector: row.sector ?? null,
            }));

            return {
                majorHead,
                rows: mappedRows,
                totals,
                hasMultiple: groupRows.length > 1,
            };
        });

        logger.info(`Form 5C total groups returned: ${result.length}`);

        return result;
    } catch (error) {
        logger.error(`Error fetching Form 5C data: ${error.message}`);
        throw error;
    }
};




// ─────────────────────────────────────────────────────────────
// FORM 5D - Register of Loans/Advances & Related Recoveries
//
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED. ChallanFromBill only,
//                                 sector = STATE, amountType in
//                                 FORM5D_STATE_AMOUNT_TYPES (all 23
//                                 types except "Advance Payment").
//                                 Receipt: "Other categories" column
//                                 only. Payment: "Total Payment"
//                                 column only. All other columns nil.
// - sector === "COUNCIL"      → REPLACED. No longer uses ChallanTwo
//                                 or most of Expenditure's fields.
//                                 • Receipt: ChallanFromBill rows,
//                                   sector = COUNCIL, amountType =
//                                   "Building Loan" → H/B Loan column,
//                                   amountType = "Car Loan" → Car Loan
//                                   column. loansGovt, loansOther,
//                                   otherReceipts are nil.
//                                 • Payment: Expenditure rows, sector =
//                                   COUNCIL, where loansAdvances field
//                                   is non-zero → Loans/Advances payment
//                                   column = that row's grossAmount
//                                   (not the loansAdvances field value
//                                   itself). repayGovt, repayOther are
//                                   nil.
// - sector === "CONSOLIDATED" → Combines STATE's rule (unchanged) +
//                                 COUNCIL's new rule above, merged
//                                 before computing totals.
// - any other sector          → no rule defined, empty result.
// ─────────────────────────────────────────────────────────────

// STATE-sector amount types for Form 5D — all 23 challanFromBill
// types EXCEPT "Advance Payment" (excluded from both receipt and
// payment side per spec)
const FORM5D_STATE_AMOUNT_TYPES = [
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
    "Earnest Money",
    "Professional Tax",
    "Car Loan",
    "Building Loan",
    "House Rent",
    "Security Deposits",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
    "Other Deductions",
    // "Advance Payment" — intentionally excluded
];

// COUNCIL-sector receipt amount types — only these two, mapped to
// the H/B Loan and Car Loan columns respectively.
const FORM5D_COUNCIL_RECEIPT_AMOUNT_TYPES = ["Building Loan", "Car Loan"];

const safe = (v) => {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
};

// ════════════════════════════════════════════════════════════
// STATE — UNCHANGED logic, extracted into its own function so
// CONSOLIDATED can call it alongside the new COUNCIL function.
// ════════════════════════════════════════════════════════════
const getForm5DStateRows = async () => {
    const challanFromBillRows = await prisma.challanFromBill.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            amountType: { in: FORM5D_STATE_AMOUNT_TYPES },
        },
        orderBy: { voucharDate: "asc" },
    });

    logger.info(
        `Form5D (STATE): Fetched ${challanFromBillRows.length} rows from ChallanFromBill`
    );

    // ── Receipt rows — "Other categories" column only ────
    const receiptRows = challanFromBillRows.map((row) => {
        const amount = safe(row.amount);
        return {
            id: `CFB-RCPT-${row.id}`,
            source: "challanFromBill",
            cashBookItemNo: row.challanNo ?? "-",
            loansGovt: 0,
            loansOther: 0,
            hbLoan: 0,
            carLoan: 0,
            otherReceipts: amount,
            totalReceipts: amount,
        };
    });

    // ── Payment rows — "Total Payment" column only ───────
    const paymentRows = challanFromBillRows.map((row) => {
        const amount = safe(row.amount);
        return {
            id: `CFB-PMT-${row.id}`,
            vrNo: row.challanNo ?? "-",
            repayGovt: 0,
            repayOther: 0,
            loansAdvances: 0,
            totalPayments: amount,
        };
    });

    return { receiptRows, paymentRows };
};

// ════════════════════════════════════════════════════════════
// NEW — COUNCIL logic.
// Receipt: ChallanFromBill, sector = COUNCIL, amountType in
//   ["Building Loan", "Car Loan"] → H/B Loan / Car Loan columns.
// Payment: Expenditure, sector = COUNCIL, rows where loansAdvances
//   is non-zero → Loans/Advances payment column = grossAmount.
// ════════════════════════════════════════════════════════════
const getForm5DCouncilRows = async () => {
    const [challanFromBillRows, expenditureRows] = await Promise.all([
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: { in: FORM5D_COUNCIL_RECEIPT_AMOUNT_TYPES },
            },
            orderBy: { voucharDate: "asc" },
        }),
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "COUNCIL" },
            select: {
                id: true,
                voucherNo: true,
                voucherDate: true,
                loansAdvances: true,
                grossAmount: true,
            },
            orderBy: { voucherDate: "asc" },
        }),
    ]);

    logger.info(
        `Form5D (COUNCIL): Fetched ${challanFromBillRows.length} ChallanFromBill rows (Building/Car Loan), ${expenditureRows.length} Expenditure rows (pre loansAdvances filter)`
    );

    // ── Receipt rows — H/B Loan / Car Loan only ──────────────
    const receiptRows = challanFromBillRows.map((row) => {
        const amount = safe(row.amount);
        const isBuildingLoan = row.amountType === "Building Loan";

        return {
            id: `CFB-RCPT-COUNCIL-${row.id}`,
            source: "challanFromBill",
            cashBookItemNo: row.challanNo ?? "-",
            loansGovt: 0,
            loansOther: 0,
            hbLoan: isBuildingLoan ? amount : 0,
            carLoan: isBuildingLoan ? 0 : amount,
            otherReceipts: 0,
            totalReceipts: amount,
        };
    });

    // ── Payment rows — Loans/Advances = grossAmount, only for ──
    // rows where loansAdvances field is non-zero
    const paymentRows = expenditureRows
        .map((row) => {
            const hasLoanAdvance = safe(row.loansAdvances) !== 0;
            if (!hasLoanAdvance) return null;

            const amount = safe(row.grossAmount);

            return {
                id: `E-PMT-COUNCIL-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                repayGovt: 0,
                repayOther: 0,
                loansAdvances: amount,
                totalPayments: amount,
            };
        })
        .filter(Boolean);

    logger.info(
        `Form5D (COUNCIL): receiptRows=${receiptRows.length}, paymentRows=${paymentRows.length} (after loansAdvances filter)`
    );

    return { receiptRows, paymentRows };
};

export const getForm5DData = async (sector) => {
    try {
        logger.info(`Fetching Form 5D data for sector: ${sector ?? "ALL"}`);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let receiptRows = [];
        let paymentRows = [];

        if (isStateSector) {
            const stateData = await getForm5DStateRows();
            receiptRows = stateData.receiptRows;
            paymentRows = stateData.paymentRows;
        } else if (isCouncilSector) {
            const councilData = await getForm5DCouncilRows();
            receiptRows = councilData.receiptRows;
            paymentRows = councilData.paymentRows;
        } else if (isConsolidated) {
            const [stateData, councilData] = await Promise.all([
                getForm5DStateRows(),
                getForm5DCouncilRows(),
            ]);
            receiptRows = [...stateData.receiptRows, ...councilData.receiptRows];
            paymentRows = [...stateData.paymentRows, ...councilData.paymentRows];
        } else {
            logger.info(
                `Form5D: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        // ── Column grand totals ──────────────────────────────────
        const receiptTotals = receiptRows.reduce(
            (acc, r) => ({
                loansGovt: acc.loansGovt + r.loansGovt,
                loansOther: acc.loansOther + r.loansOther,
                hbLoan: acc.hbLoan + r.hbLoan,
                carLoan: acc.carLoan + r.carLoan,
                otherReceipts: acc.otherReceipts + r.otherReceipts,
                totalReceipts: acc.totalReceipts + r.totalReceipts,
            }),
            { loansGovt: 0, loansOther: 0, hbLoan: 0, carLoan: 0, otherReceipts: 0, totalReceipts: 0 }
        );

        const paymentTotals = paymentRows.reduce(
            (acc, r) => ({
                repayGovt: acc.repayGovt + r.repayGovt,
                repayOther: acc.repayOther + r.repayOther,
                loansAdvances: acc.loansAdvances + r.loansAdvances,
                totalPayments: acc.totalPayments + r.totalPayments,
            }),
            { repayGovt: 0, repayOther: 0, loansAdvances: 0, totalPayments: 0 }
        );

        logger.info(
            `Form5D done: receiptRows=${receiptRows.length}, paymentRows=${paymentRows.length}, receiptTotal=${receiptTotals.totalReceipts}, paymentTotal=${paymentTotals.totalPayments}`
        );

        return { receiptRows, paymentRows, receiptTotals, paymentTotals };
    } catch (error) {
        logger.error(`Error fetching Form 5D data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// FORM 5E - Classified cum Consolidated Abstract
//           Part II Deposit Fund (Debt-Deposit-Remittances)
//
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED. Extracted verbatim into
//                                 getForm5EStateRows() below.
// - sector === "COUNCIL"      → REBUILT. See getForm5ECouncilRows()
//                                 for the full column-by-column source
//                                 mapping (comments inline there).
// - sector === "CONSOLIDATED" → STATE's rows + COUNCIL's rows, merged
//                                 before computing totals.
// - any other sector          → no rule defined, empty result.
// ─────────────────────────────────────────────────────────────

const FORM5E_TREASURY_TYPES = [
    "Professional Tax",
    "Monopoly",
    "MC Forest Royalty",
    "Forest Royalty",
];

const FORM5E_STATE_DEDUCTION_TYPES = [
    "Security Deposits",
    "Earnest Money",
];

// COUNCIL — CPF-type amountTypes, dual-posted to receipt
// (Recoveries of CPF Subscriptions) AND payment (Payment of CPF
// Advances) from the SAME underlying ChallanFromBill records.
const FORM5E_COUNCIL_CPF_TYPES = [
    "CPF Council Share",
    "CPF Contribution",
    "CPF Advance",
];

// COUNCIL — cross-sector treasury types pulled from STATE's
// ChallanFromBill records and folded into COUNCIL's Remittance to
// Treasury payment column (same pattern used in Form 4 / Form 5A /
// cashbookService.js).
const FORM5E_COUNCIL_STATE_TREASURY_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

const safeForm5E = (v) => {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
};

// ════════════════════════════════════════════════════════════
// STATE — UNCHANGED logic, extracted verbatim into its own
// function so CONSOLIDATED can call it alongside COUNCIL.
// ════════════════════════════════════════════════════════════
const getForm5EStateRows = async () => {
    const [expenditureRows, stateChallanRows, stateDeductionRows] = await Promise.all([
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "STATE" },
            select: {
                id: true,
                voucherNo: true,
                sector: true,
                cpfCouncil: true,
                cpfContribution: true,
                cpfRecovery: true,
                securityDepositsDeduction: true,
                earnestMoneyDeduction: true,
                grossAmount: true,
                securityDeposit: true,
                earnestMoney: true,
                transferPayment: true,
                grantsInAid: true,
                works: true,
            },
            orderBy: { voucherDate: "asc" },
        }),
        prisma.stateChallan.findMany({
            where: { sector: "STATE" },
            select: {
                id: true,
                challanNo: true,
                totalAmount: true,
            },
            orderBy: { challanDate: "asc" },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                amountType: { in: FORM5E_STATE_DEDUCTION_TYPES },
            },
            select: {
                id: true,
                challanNo: true,
                amountType: true,
                amount: true,
            },
            orderBy: { voucharDate: "asc" },
        }),
    ]);

    logger.info(
        `Form5E (STATE): expenditure=${expenditureRows.length}, stateChallan=${stateChallanRows.length}, stateDeduction=${stateDeductionRows.length}`
    );

    // ── Receipt rows ──────────────────────────────────────────
    const receiptFromExpenditure = expenditureRows.map((row) => {
        const cheques = safeForm5E(row.grossAmount);
        if (cheques === 0) return null;

        return {
            id: `E-R-${row.id}`,
            cashBookItemNo: row.voucherNo ?? "-",
            cpfSub: 0,
            securityDep: 0,
            earnestMoney: 0,
            govtDeposit: 0,
            chequesDrawn: cheques,
            totalReceipt: cheques,
        };
    }).filter(Boolean);

    const receiptFromStateChallan = stateChallanRows.map((row) => {
        const govtDep =
            row.totalAmount != null
                ? parseFloat((row.totalAmount).toFixed(2))
                : 0;

        if (govtDep === 0) return null;

        return {
            id: `SC-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            cpfSub: 0,
            securityDep: 0,
            earnestMoney: 0,
            govtDeposit: govtDep,
            chequesDrawn: 0,
            totalReceipt: govtDep,
        };
    }).filter(Boolean);

    const receiptFromStateDeduction = stateDeductionRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        const isSecurityDeposit = row.amountType === "Security Deposits";

        return {
            id: `SD-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            cpfSub: 0,
            securityDep: isSecurityDeposit ? amt : 0,
            earnestMoney: isSecurityDeposit ? 0 : amt,
            govtDeposit: 0,
            chequesDrawn: 0,
            totalReceipt: amt,
        };
    }).filter(Boolean);

    const receiptRows = [
        ...receiptFromExpenditure,
        ...receiptFromStateChallan,
        ...receiptFromStateDeduction,
    ];

    // ── Payment rows ──────────────────────────────────────────
    const paymentFromExpenditure = expenditureRows.map((row) => {
        const transferItems = safeForm5E(row.grossAmount);
        if (transferItems === 0) return null;

        return {
            id: `E-P-${row.id}`,
            vrNo: row.voucherNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems,
            remittanceTreasury: 0,
            totalPayment: transferItems,
        };
    }).filter(Boolean);

    const paymentFromStateChallan = stateChallanRows.map((row) => {
        const remitTreasury =
            row.totalAmount != null
                ? parseFloat((row.totalAmount).toFixed(2))
                : 0;

        if (remitTreasury === 0) return null;

        return {
            id: `SC-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: remitTreasury,
            totalPayment: remitTreasury,
        };
    }).filter(Boolean);

    const paymentFromStateDeduction = stateDeductionRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        const isSecurityDeposit = row.amountType === "Security Deposits";

        return {
            id: `SD-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: isSecurityDeposit ? amt : 0,
            repayEarnest: isSecurityDeposit ? 0 : amt,
            transferItems: 0,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentRows = [
        ...paymentFromExpenditure,
        ...paymentFromStateChallan,
        ...paymentFromStateDeduction,
    ];

    return { receiptRows, paymentRows };
};

// ════════════════════════════════════════════════════════════
// COUNCIL — REBUILT logic. Column-by-column source mapping:
//
// RECEIPT SIDE
//   cpfSub (Recoveries of CPF Subscriptions)
//     → ChallanFromBill, sector=COUNCIL, amountType in
//       FORM5E_COUNCIL_CPF_TYPES. Same records ALSO feed the
//       payment-side cpfAdvances column below (dual-posted).
//   securityDep (Security Deposit)
//     → ChallanFromBill, sector=COUNCIL, amountType="Security Deposits"
//   earnestMoney (Earnest Money Deposit)
//     → ChallanFromBill, sector=COUNCIL, amountType="Earnest Money"
//   govtDeposit (Received in respect of transfer item)
//     → Challan table, majorHead = "017" (no sector filter at all —
//       explicitly requested)
//   chequesDrawn (Cheques Drawn)
//     → Expenditure, sector=COUNCIL, grossAmount, only where
//       chequeNo IS NOT NULL
//
// PAYMENT SIDE
//   cpfAdvances (Payment of CPF Advances)
//     → SAME ChallanFromBill CPF-type records as receipt cpfSub above
//   remitCpf (Remittance CPF to P.O.)
//     → always 0
//   paySecurityDep (Payment Security Deposit)
//     → Expenditure, sector=COUNCIL, grossAmount, only where the
//       securityDeposit field is non-zero
//   repayEarnest (Repayment Earnest Money)
//     → Expenditure, sector=COUNCIL, grossAmount, only where the
//       earnestMoney field is non-zero
//   transferItems (Transfer Items)
//     → Expenditure, sector=COUNCIL, grossAmount, only where
//       remarks = "Payment in respect of transferred items"
//   remittanceTreasury (Remittance to Treasury)
//     → THREE sources summed together:
//       (a) ALL Challan table rows, unrestricted, no sector filter
//           (includes majorHead="017" rows too — same records as
//           the receipt-side govtDeposit above, dual-posted)
//       (b) ChallanFromBill, sector=COUNCIL, amountType NOT IN
//           FORM5E_COUNCIL_CPF_TYPES (this naturally includes the
//           Security Deposit / Earnest Money records too — same
//           records as the receipt-side columns above, dual-posted)
//       (c) ChallanFromBill, sector=STATE, amountType in
//           FORM5E_COUNCIL_STATE_TREASURY_TYPES (cross-sector pull)
// ════════════════════════════════════════════════════════════
const getForm5ECouncilRows = async () => {
    const [
        expenditureRows,
        challanFromBillCouncilRows,
        challanFromBillStateTreasuryRows,
        challanRows,
    ] = await Promise.all([
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "COUNCIL" },
            select: {
                id: true,
                voucherNo: true,
                grossAmount: true,
                chequeNo: true,
                securityDeposit: true,
                earnestMoney: true,
                remarks: true,
            },
            orderBy: { voucherDate: "asc" },
        }),
        // Fetch ALL ChallanFromBill rows for sector=COUNCIL unfiltered
        // by amountType — split into CPF / SecDep / EarnestMoney /
        // non-CPF buckets in JS below.
        prisma.challanFromBill.findMany({
            where: { isActive: true, sector: "COUNCIL" },
            select: {
                id: true,
                challanNo: true,
                amountType: true,
                amount: true,
            },
            orderBy: { voucharDate: "asc" },
        }),
        // Cross-sector: STATE's treasury-type rows, for Remittance to
        // Treasury only.
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                amountType: { in: FORM5E_COUNCIL_STATE_TREASURY_TYPES },
            },
            select: {
                id: true,
                challanNo: true,
                amountType: true,
                amount: true,
            },
            orderBy: { voucharDate: "asc" },
        }),
        // ALL Challan rows, no sector/challanType filter at all.
        prisma.challan.findMany({
            where: { isActive: true },
            select: {
                id: true,
                challanNo: true,
                majorHead: true,
                amount: true,
            },
            orderBy: { challanDate: "asc" },
        }),
    ]);

    logger.info(
        `Form5E (COUNCIL): expenditure=${expenditureRows.length}, challanFromBillCouncil=${challanFromBillCouncilRows.length}, ` +
        `challanFromBillStateTreasury=${challanFromBillStateTreasuryRows.length}, challan=${challanRows.length}`
    );

    // ── Split ChallanFromBill(COUNCIL) into buckets ──────────
    const cfbCpfRows = challanFromBillCouncilRows.filter((row) =>
        FORM5E_COUNCIL_CPF_TYPES.includes(row.amountType)
    );
    const cfbSecurityDepositRows = challanFromBillCouncilRows.filter(
        (row) => row.amountType === "Security Deposits"
    );
    const cfbEarnestMoneyRows = challanFromBillCouncilRows.filter(
        (row) => row.amountType === "Earnest Money"
    );
    const cfbNonCpfRows = challanFromBillCouncilRows.filter(
        (row) => !FORM5E_COUNCIL_CPF_TYPES.includes(row.amountType)
    );

    // ── Split Challan into majorHead="017" subset + full set ──
    const challanTransferItemRows = challanRows.filter(
        (row) => row.majorHead?.toString().trim() === "017"
    );

    // ── Split Expenditure into the 3 filtered subsets ─────────
    const expenditureChequeRows = expenditureRows.filter(
        (row) => row.chequeNo != null && row.chequeNo.toString().trim() !== ""
    );
    const expenditurePaySecDepRows = expenditureRows.filter(
        (row) => safeForm5E(row.securityDeposit) !== 0
    );
    const expenditureRepayEarnestRows = expenditureRows.filter(
        (row) => safeForm5E(row.earnestMoney) !== 0
    );
    const expenditureTransferItemRows = expenditureRows.filter(
        (row) => row.remarks === "Payment in respect of transferred items"
    );

    // ══════════════════════════════════════════════════════════
    // RECEIPT ROWS
    // ══════════════════════════════════════════════════════════
    const receiptFromCpf = cfbCpfRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-CPF-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            cpfSub: amt,
            securityDep: 0,
            earnestMoney: 0,
            govtDeposit: 0,
            chequesDrawn: 0,
            totalReceipt: amt,
        };
    }).filter(Boolean);

    const receiptFromSecurityDeposit = cfbSecurityDepositRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-SD-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            cpfSub: 0,
            securityDep: amt,
            earnestMoney: 0,
            govtDeposit: 0,
            chequesDrawn: 0,
            totalReceipt: amt,
        };
    }).filter(Boolean);

    const receiptFromEarnestMoney = cfbEarnestMoneyRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-EM-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            cpfSub: 0,
            securityDep: 0,
            earnestMoney: amt,
            govtDeposit: 0,
            chequesDrawn: 0,
            totalReceipt: amt,
        };
    }).filter(Boolean);

    const receiptFromTransferItem = challanTransferItemRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `C-TI-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            cpfSub: 0,
            securityDep: 0,
            earnestMoney: 0,
            govtDeposit: amt,
            chequesDrawn: 0,
            totalReceipt: amt,
        };
    }).filter(Boolean);

    const receiptFromCheques = expenditureChequeRows.map((row) => {
        const amt = safeForm5E(row.grossAmount);
        if (amt === 0) return null;
        return {
            id: `E-CQ-R-${row.id}`,
            cashBookItemNo: row.voucherNo ?? "-",
            cpfSub: 0,
            securityDep: 0,
            earnestMoney: 0,
            govtDeposit: 0,
            chequesDrawn: amt,
            totalReceipt: amt,
        };
    }).filter(Boolean);

    const receiptRows = [
        ...receiptFromCpf,
        ...receiptFromSecurityDeposit,
        ...receiptFromEarnestMoney,
        ...receiptFromTransferItem,
        ...receiptFromCheques,
    ];

    // ══════════════════════════════════════════════════════════
    // PAYMENT ROWS
    // ══════════════════════════════════════════════════════════
    const paymentFromCpf = cfbCpfRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-CPF-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: amt,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromSecDep = expenditurePaySecDepRows.map((row) => {
        const amt = safeForm5E(row.grossAmount);
        if (amt === 0) return null;
        return {
            id: `E-PSD-P-${row.id}`,
            vrNo: row.voucherNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: amt,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromRepayEarnest = expenditureRepayEarnestRows.map((row) => {
        const amt = safeForm5E(row.grossAmount);
        if (amt === 0) return null;
        return {
            id: `E-RE-P-${row.id}`,
            vrNo: row.voucherNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: amt,
            transferItems: 0,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromTransferItems = expenditureTransferItemRows.map((row) => {
        const amt = safeForm5E(row.grossAmount);
        if (amt === 0) return null;
        return {
            id: `E-TI-P-${row.id}`,
            vrNo: row.voucherNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: amt,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromChallanAll = challanRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `C-RT-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: amt,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromCfbNonCpf = cfbNonCpfRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-RT-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: amt,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromCfbStateTreasury = challanFromBillStateTreasuryRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-STATE-RT-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: 0,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: amt,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentRows = [
        ...paymentFromCpf,
        ...paymentFromSecDep,
        ...paymentFromRepayEarnest,
        ...paymentFromTransferItems,
        ...paymentFromChallanAll,
        ...paymentFromCfbNonCpf,
        ...paymentFromCfbStateTreasury,
    ];

    logger.info(
        `Form5E (COUNCIL): receiptRows=${receiptRows.length}, paymentRows=${paymentRows.length}`
    );

    return { receiptRows, paymentRows };
};

export const getForm5EData = async (sector) => {
    try {
        logger.info(`Fetching Form 5E data for sector: ${sector ?? "ALL"}`);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let receiptRows = [];
        let paymentRows = [];

        if (isStateSector) {
            const stateData = await getForm5EStateRows();
            receiptRows = stateData.receiptRows;
            paymentRows = stateData.paymentRows;
        } else if (isCouncilSector) {
            const councilData = await getForm5ECouncilRows();
            receiptRows = councilData.receiptRows;
            paymentRows = councilData.paymentRows;
        } else if (isConsolidated) {
            const [stateData, councilData] = await Promise.all([
                getForm5EStateRows(),
                getForm5ECouncilRows(),
            ]);
            receiptRows = [...stateData.receiptRows, ...councilData.receiptRows];
            paymentRows = [...stateData.paymentRows, ...councilData.paymentRows];
        } else {
            logger.info(
                `Form5E: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        // ── Column grand totals ──────────────────────────────────
        const receiptTotals = receiptRows.reduce(
            (acc, r) => ({
                cpfSub: acc.cpfSub + r.cpfSub,
                securityDep: acc.securityDep + r.securityDep,
                earnestMoney: acc.earnestMoney + r.earnestMoney,
                govtDeposit: acc.govtDeposit + r.govtDeposit,
                chequesDrawn: acc.chequesDrawn + r.chequesDrawn,
                totalReceipt: acc.totalReceipt + r.totalReceipt,
            }),
            { cpfSub: 0, securityDep: 0, earnestMoney: 0, govtDeposit: 0, chequesDrawn: 0, totalReceipt: 0 }
        );

        const paymentTotals = paymentRows.reduce(
            (acc, r) => ({
                cpfAdvances: acc.cpfAdvances + r.cpfAdvances,
                remitCpf: acc.remitCpf + r.remitCpf,
                paySecurityDep: acc.paySecurityDep + r.paySecurityDep,
                repayEarnest: acc.repayEarnest + r.repayEarnest,
                transferItems: acc.transferItems + r.transferItems,
                remittanceTreasury: acc.remittanceTreasury + r.remittanceTreasury,
                totalPayment: acc.totalPayment + r.totalPayment,
            }),
            { cpfAdvances: 0, remitCpf: 0, paySecurityDep: 0, repayEarnest: 0, transferItems: 0, remittanceTreasury: 0, totalPayment: 0 }
        );

        logger.info(
            `Form5E done: receiptRows=${receiptRows.length}, paymentRows=${paymentRows.length}, ` +
            `transferTotal=${paymentTotals.transferItems}`
        );

        return { receiptRows, paymentRows, receiptTotals, paymentTotals };
    } catch (error) {
        logger.error(`Error fetching Form 5E data: ${error.message}`);
        throw error;
    }
};




// ─────────────────────────────────────────────────────────────
// FORM 6 - Classified cum Consolidated Abstract
// Data from: Expenditure table
// Rows = full head code (all 7 levels), Columns = months (JAN-DEC)
// Cell = sum of grossAmount for that head combination in that month
// Bottom = grand total row across all heads and all months
// ─────────────────────────────────────────────────────────────

const MONTHS = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Build full head code from all 7 levels
// Skips null/empty parts automatically
const buildFullHeadCode = (row) => {
    return [
        row.majorHead,
        row.subMajorHead,
        row.minorHead,
        row.subHead,
        row.subSubHead,
        row.detailHead,
        row.subDetailHead,
    ]
        .filter((p) => p && p.trim() !== "")
        .join("-");
};

export const getForm6Data = async (sector) => {
    try {
        logger.info(`Fetching Form 6 data for sector: ${sector ?? "ALL"}`);

        const where = { isActive: true };

        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        // Select only the fields we need
        const rows = await prisma.expenditure.findMany({
            where,
            select: {
                majorHead: true,
                subMajorHead: true,
                minorHead: true,
                subHead: true,
                subSubHead: true,
                detailHead: true,
                subDetailHead: true,
                grossAmount: true,
                voucherDate: true,
            },
        });

        logger.info(`Form6: Fetched ${rows.length} rows from Expenditure table`);

        // Build a map keyed by full head code
        // { "0028-01-101-...": { headCode, majorHead, months: {JAN: 0...}, total } }
        const grouped = {};

        // Also track grand total per month
        const grandTotalMonths = MONTHS.reduce((acc, m) => {
            acc[m] = 0;
            return acc;
        }, {});
        let grandTotal = 0;

        rows.forEach((row) => {
            const fullHeadCode = buildFullHeadCode(row) || "Unknown";
            const amount = parseFloat(row.grossAmount ?? 0);

            // Get month from voucherDate
            const monthIndex = row.voucherDate
                ? new Date(row.voucherDate).getMonth()
                : null;
            const monthName = monthIndex !== null ? MONTHS[monthIndex] : null;

            // Initialize group if not exists
            if (!grouped[fullHeadCode]) {
                grouped[fullHeadCode] = {
                    headCode: fullHeadCode,
                    majorHead: row.majorHead ?? "-",
                    subMajorHead: row.subMajorHead ?? "-",
                    minorHead: row.minorHead ?? "-",
                    subHead: row.subHead ?? "-",
                    subSubHead: row.subSubHead ?? "-",
                    detailHead: row.detailHead ?? "-",
                    subDetailHead: row.subDetailHead ?? "-",
                    months: MONTHS.reduce((acc, m) => {
                        acc[m] = 0;
                        return acc;
                    }, {}),
                    total: 0,
                };
            }

            // Add amount to correct month bucket
            if (monthName) {
                grouped[fullHeadCode].months[monthName] += amount;
                grandTotalMonths[monthName] += amount; // add to grand total month
            }

            grouped[fullHeadCode].total += amount;
            grandTotal += amount; // add to overall grand total
        });

        // Sort by full head code alphabetically
        const result = Object.values(grouped).sort((a, b) =>
            a.headCode.localeCompare(b.headCode)
        );

        logger.info(`Form 6 total head groups: ${result.length}`);

        return {
            rows: result,
            grandTotalMonths, // { JAN: 1000, FEB: 2000, ... }
            grandTotal,       // overall total across all months and heads
        };
    } catch (error) {
        logger.error(`Error fetching Form 6 data: ${error.message}`);
        throw error;
    }
};



// ─────────────────────────────────────────────────────────────
// FORM 7 - Month wise register
// Data from 4 tables:
//   challan         → all active rows, use challanDate
//                     - sector = STATE          → skipped (stateChallan is the only source)
//                     - sector = COUNCIL/CONSOLIDATED → ALL rows, no challanType filter
//                     - any other sector        → filtered by challanType
//   challanTwo      → grantsInAid amount only, use kaacChallanDate
//                     - sector = STATE / COUNCIL → skipped
//                     - sector = CONSOLIDATED    → all rows, no filter
//                     - any other sector         → filtered by sector
//   challanFromBill → use voucharDate
//                     - sector = STATE   → skipped
//                     - sector = COUNCIL → union of:
//                         (a) sector = STATE   AND amountType IN allowed 4 types
//                         (b) sector = COUNCIL AND amountType NOT IN CPF-excluded types
//                     - sector = CONSOLIDATED → union of:
//                         (a) sector != COUNCIL AND amountType IN allowed 4 types
//                         (b) sector = COUNCIL AND amountType NOT IN CPF-excluded types
//                     - any other sector → filtered by sector, amountType IN allowed 4 types (unchanged)
//   stateChallan    → totalAmount, use challanDate
//                     (STATE / CONSOLIDATED only; the ONLY source when sector = STATE)
// Rows = full head code, Columns = months (JAN-DEC)
// ─────────────────────────────────────────────────────────────

const FORM7_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "Monopoly",
    "MC Forest Royalty",
];

// Amount types that must be EXCLUDED when pulling COUNCIL-sector challanFromBill rows
const FORM7_COUNCIL_EXCLUDED_AMOUNT_TYPES = [
    "CPF Council Share",
    "CPF Contribution",
    "CPF Advance",
];

// Initialize empty months object — all 12 months set to 0
const emptyMonths = () =>
    MONTHS.reduce((acc, m) => {
        acc[m] = 0;
        return acc;
    }, {});

// Get month name from a date
const getMonthName = (date) => {
    if (!date) return null;
    return MONTHS[new Date(date).getMonth()];
};

// ── challanFromBill fetch strategy, split out because the rule differs per sector ──
const getChallanFromBillRows = (sector, isCouncilOnly, isConsolidated) => {
    if (isCouncilOnly) {
        // (a) STATE rows restricted to the 4 allowed amount types
        // (b) COUNCIL rows excluding the 3 CPF amount types
        return Promise.all([
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "STATE",
                    amountType: { in: FORM7_ALLOWED_AMOUNT_TYPES },
                },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    amountType: { notIn: FORM7_COUNCIL_EXCLUDED_AMOUNT_TYPES },
                },
            }),
        ]).then(([stateTypedRows, councilRows]) => [...stateTypedRows, ...councilRows]);
    }

    if (isConsolidated) {
        // (a) every non-COUNCIL sector, restricted to the 4 allowed amount types (original rule)
        // (b) COUNCIL sector, broader rule — excluding only the 3 CPF amount types
        return Promise.all([
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    amountType: { in: FORM7_ALLOWED_AMOUNT_TYPES },
                    NOT: { sector: "COUNCIL" },
                },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    amountType: { notIn: FORM7_COUNCIL_EXCLUDED_AMOUNT_TYPES },
                },
            }),
        ]).then(([genericAllowedRows, councilRows]) => [...genericAllowedRows, ...councilRows]);
    }

    // any other specific sector — original, unchanged behaviour
    return prisma.challanFromBill.findMany({
        where: {
            isActive: true,
            amountType: { in: FORM7_ALLOWED_AMOUNT_TYPES },
            sector,
        },
    });
};

export const getForm7Data = async (sector) => {
    try {
        logger.info(`Fetching Form 7 data for sector: ${sector ?? "ALL"}`);

        const isStateOnly = sector === "STATE";
        const isCouncilOnly = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        // ── Challan ──
        // STATE           → skipped (handled via stateChallan below)
        // COUNCIL/CONSOLIDATED → ALL active rows, no challanType filter
        // any other sector → filtered by challanType
        const challanWhere = { isActive: true };
        if (!isStateOnly && !isCouncilOnly && !isConsolidated) {
            challanWhere.challanType = sector;
        }

        // ── ChallanTwo ──
        // STATE / COUNCIL   → skipped
        // CONSOLIDATED      → all rows, no filter
        // any other sector  → filtered by sector
        const challanTwoWhere = { isActive: true };
        if (sector && sector !== "CONSOLIDATED" && sector !== "STATE") {
            challanTwoWhere.sector = sector;
        }

        const includeStateChallans = isStateOnly || isConsolidated;

        const [
            challanRows,
            challanTwoRows,
            challanFromBillRows,
            stateChallanRows,
        ] = await Promise.all([
            // Skipped entirely for sector = STATE — StateChallan is the only source
            isStateOnly
                ? Promise.resolve([])
                : prisma.challan.findMany({ where: challanWhere }),

            (isStateOnly || isCouncilOnly)
                ? Promise.resolve([])
                : prisma.challanTwo.findMany({ where: challanTwoWhere }),

            isStateOnly
                ? Promise.resolve([])
                : getChallanFromBillRows(sector, isCouncilOnly, isConsolidated),

            // StateChallan (STATE / CONSOLIDATED only)
            // No isActive field on model — filter by sector = "STATE"
            includeStateChallans
                ? prisma.stateChallan.findMany({
                    where: { sector: "STATE" },
                    select: {
                        id: true,
                        challanDate: true,
                        totalAmount: true,
                        majorHead: true,
                        subMajorHead: true,
                        minorHead: true,
                        subHead: true,
                        subSubHead: true,
                        detailHead: true,
                        subDetailHead: true,
                    },
                    orderBy: { challanDate: "asc" },
                })
                : Promise.resolve([]),
        ]);

        logger.info(
            `Form7: challan=${challanRows.length}, challanTwo=${challanTwoRows.length}, ` +
            `challanFromBill=${challanFromBillRows.length}, stateChallan=${stateChallanRows.length}`
        );

        // ── Step 1: group by full head code ─────────────────────
        const grouped = {};
        const grandTotalMonths = emptyMonths();
        let grandTotal = 0;

        // Process Challan (no-op for sector = STATE — challanRows is [])
        challanRows.forEach((row) => {
            const headCode = buildFullHeadCode({
                majorHead: row.majorHead,
                subMajorHead: row.subMajorHead,
                minorHead: row.minorHead,
                subHead: null,
                subSubHead: null,
                detailHead: row.detailHead,
                subDetailHead: null,
            });

            const amount = parseFloat(row.amount ?? 0);
            const key = headCode || `challan-${row.id}`;

            if (!grouped[key]) {
                grouped[key] = {
                    headCode: key,
                    majorHead: row.majorHead ?? "-",
                    subMajorHead: row.subMajorHead ?? "-",
                    minorHead: row.minorHead ?? "-",
                    detailHead: row.detailHead ?? "-",
                    months: emptyMonths(),
                    total: 0,
                };
            }

            const monthName = getMonthName(row.challanDate);
            if (monthName) {
                grouped[key].months[monthName] += amount;
                grandTotalMonths[monthName] += amount;
            }
            grouped[key].total += amount;
            grandTotal += amount;
        });

        // Process ChallanTwo — grantsInAid only (no-op for STATE/COUNCIL — challanTwoRows is [])
        challanTwoRows.forEach((row) => {
            const amount = parseFloat(row.grantsInAid ?? 0);
            if (!amount) return;

            const headCode = buildFullHeadCode({
                majorHead: row.majorHead,
                subMajorHead: row.subMajor,
                minorHead: row.minorHead,
                subHead: null,
                subSubHead: null,
                detailHead: null,
                subDetailHead: null,
            });

            const key = headCode || `challanTwo-${row.id}`;

            if (!grouped[key]) {
                grouped[key] = {
                    headCode: key,
                    majorHead: row.majorHead ?? "-",
                    subMajorHead: row.subMajor ?? "-",
                    minorHead: row.minorHead ?? "-",
                    detailHead: "-",
                    months: emptyMonths(),
                    total: 0,
                };
            }

            const monthName = getMonthName(row.kaacChallanDate);
            if (monthName) {
                grouped[key].months[monthName] += amount;
                grandTotalMonths[monthName] += amount;
            }
            grouped[key].total += amount;
            grandTotal += amount;
        });

        // Process ChallanFromBill (no-op for sector = STATE — challanFromBillRows is [])
        challanFromBillRows.forEach((row) => {
            const amount = parseFloat(row.amount ?? 0);

            const headCode = buildFullHeadCode({
                majorHead: row.majorHead,
                subMajorHead: row.subMajor,
                minorHead: row.minorHead,
                subHead: null,
                subSubHead: null,
                detailHead: null,
                subDetailHead: null,
            });

            const key = headCode || `challanFromBill-${row.id}`;

            if (!grouped[key]) {
                grouped[key] = {
                    headCode: key,
                    majorHead: row.majorHead ?? "-",
                    subMajorHead: row.subMajor ?? "-",
                    minorHead: row.minorHead ?? "-",
                    detailHead: "-",
                    amountType: row.amountType,
                    months: emptyMonths(),
                    total: 0,
                };
            }

            const monthName = getMonthName(row.voucharDate);
            if (monthName) {
                grouped[key].months[monthName] += amount;
                grandTotalMonths[monthName] += amount;
            }
            grouped[key].total += amount;
            grandTotal += amount;
        });

        // ─────────────────────────────────────────────────────────
        // Process StateChallan
        // amount = totalAmount (already in the correct unit)
        // date   = challanDate
        // headCode uses all 7 levels available on the model
        // For sector = STATE, this is the ONLY source contributing rows.
        // ─────────────────────────────────────────────────────────
        stateChallanRows.forEach((row) => {
            const amount =
                row.totalAmount != null
                    ? parseFloat((row.totalAmount).toFixed(2))
                    : 0;

            if (!amount) return;

            const headCode = buildFullHeadCode({
                majorHead: row.majorHead,
                subMajorHead: row.subMajorHead,
                minorHead: row.minorHead,
                subHead: row.subHead,
                subSubHead: row.subSubHead,
                detailHead: row.detailHead,
                subDetailHead: row.subDetailHead,
            });

            const key = headCode || `stateChallan-${row.id}`;

            if (!grouped[key]) {
                grouped[key] = {
                    headCode: key,
                    majorHead: row.majorHead ?? "-",
                    subMajorHead: row.subMajorHead ?? "-",
                    minorHead: row.minorHead ?? "-",
                    detailHead: row.detailHead ?? "-",
                    months: emptyMonths(),
                    total: 0,
                };
            }

            const monthName = getMonthName(row.challanDate);
            if (monthName) {
                grouped[key].months[monthName] += amount;
                grandTotalMonths[monthName] += amount;
            }
            grouped[key].total += amount;
            grandTotal += amount;
        });

        // ── Step 2: group by majorHead for total rows ────────────
        const majorHeadGroups = {};

        Object.values(grouped).forEach((row) => {
            const mh = row.majorHead;
            if (!majorHeadGroups[mh]) {
                majorHeadGroups[mh] = [];
            }
            majorHeadGroups[mh].push(row);
        });

        const result = Object.entries(majorHeadGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([majorHead, rows]) => {
                const majorHeadMonthTotals = MONTHS.reduce((acc, m) => {
                    acc[m] = rows.reduce((sum, row) => sum + (row.months[m] ?? 0), 0);
                    return acc;
                }, {});

                const majorHeadTotal = rows.reduce((sum, row) => sum + row.total, 0);

                return {
                    majorHead,
                    rows: rows.sort((a, b) => a.headCode.localeCompare(b.headCode)),
                    majorHeadMonthTotals,
                    majorHeadTotal,
                    hasMultiple: rows.length > 1,
                };
            });

        logger.info(`Form 7 total majorHead groups: ${result.length}`);

        return {
            groups: result,
            grandTotalMonths,
            grandTotal,
        };
    } catch (error) {
        logger.error(`Error fetching Form 7 data: ${error.message}`);
        throw error;
    }
};