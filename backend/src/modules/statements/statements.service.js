import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// STATEMENT 7 - Receipts, Disbursements and Balance
//
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED math: openingBalance +
//                                 cashbookInformations (receiptCashColumn +
//                                 receiptTreasuryPla, disbursementCashColumn +
//                                 disbursementTreasuryPla). Now also
//                                 respects from/to date filtering.
// - sector === "COUNCIL"      → REPLACED. Reuses Statement 3's COUNCIL
//                                 Ways & Means logic
//                                 (buildCouncilWaysAndMeansMonthlyMaps):
//                                 openingBalance forced to 0 (no
//                                 opening-balance data for COUNCIL, same
//                                 as Statement 3), receipts/disbursement
//                                 summed from that builder's monthly maps
//                                 (already date-range filtered internally).
// - sector === "CONSOLIDATED" → STATE's row + COUNCIL's row, summed
//                                 field-by-field (openingBalance = STATE's
//                                 only, since COUNCIL contributes 0).
// - any other sector          → old behavior: sector filter applied
//                                 as-is to openingBalance/cashbookInformations,
//                                 no Ways & Means logic.
// ─────────────────────────────────────────────────────────────

// 🔸 ASSUMPTION: cashbookInformations' date column is named `date`.
// If it's actually named something else (e.g. voucherDate, entryDate),
// swap the field name below.
const getStatement7StateRow = async ({ dateRange, openingYear }) => {
    const openingBalances = await prisma.openingBalance.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            ...(openingYear ? { year: openingYear } : {}),
        },
    });

    const cashbookEntries = await prisma.cashbookInformations.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            ...(dateRange ? { date: dateRange } : {}),
        },
    });

    const openingBalance = openingBalances.reduce(
        (sum, item) => sum + Number(item.amount ?? 0), 0
    );

    const receipts = cashbookEntries.reduce(
        (sum, item) =>
            sum +
            Number(item.receiptCashColumn ?? 0) +
            Number(item.receiptTreasuryPla ?? 0),
        0
    );

    const disbursement = cashbookEntries.reduce(
        (sum, item) =>
            sum +
            Number(item.disbursementCashColumn ?? 0) +
            Number(item.disbursementTreasuryPla ?? 0),
        0
    );

    return { openingBalance, receipts, disbursement };
};

// COUNCIL — reuses buildCouncilWaysAndMeansMonthlyMaps from Statement 3
// (same file). That builder already applies dateRange internally to
// challanFromBill/challan/expenditure, so summing its returned maps
// gives totals for exactly the requested from/to window.
const getStatement7CouncilRow = async ({ dateRange }) => {
    const { receiptByMonth, disbursementByMonth } =
        await buildCouncilWaysAndMeansMonthlyMaps(dateRange);

    const receipts = [...receiptByMonth.values()].reduce((s, v) => s + v, 0);
    const disbursement = [...disbursementByMonth.values()].reduce((s, v) => s + v, 0);

    // No opening-balance data for COUNCIL, same as Statement 3's rule.
    return { openingBalance: 0, receipts, disbursement };
};

export const getStatement7Data = async ({ sector, from, to } = {}) => {
    const isStateSector = sector === "STATE";
    const isCouncilSector = sector === "COUNCIL";
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const dateRange = getDateRangeFromParams(from, to);
    const openingYear = from ? new Date(from).getFullYear() : null;

    let openingBalance = 0;
    let receipts = 0;
    let disbursement = 0;

    if (isStateSector) {
        const row = await getStatement7StateRow({ dateRange, openingYear });
        openingBalance = row.openingBalance;
        receipts = row.receipts;
        disbursement = row.disbursement;
    } else if (isCouncilSector) {
        const row = await getStatement7CouncilRow({ dateRange });
        openingBalance = row.openingBalance; // 0
        receipts = row.receipts;
        disbursement = row.disbursement;
    } else if (isConsolidated) {
        const [stateRow, councilRow] = await Promise.all([
            getStatement7StateRow({ dateRange, openingYear }),
            getStatement7CouncilRow({ dateRange }),
        ]);
        openingBalance = stateRow.openingBalance + councilRow.openingBalance;
        receipts = stateRow.receipts + councilRow.receipts;
        disbursement = stateRow.disbursement + councilRow.disbursement;
    } else {
        // Any other/unknown sector value — fall back to the old
        // literal-sector-filter behavior, unchanged.
        const sectorFilter = sector ? { sector } : {};

        const openingBalances = await prisma.openingBalance.findMany({
            where: { isActive: true, ...sectorFilter },
        });
        const cashbookEntries = await prisma.cashbookInformations.findMany({
            where: {
                isActive: true,
                ...sectorFilter,
                ...(dateRange ? { date: dateRange } : {}),
            },
        });

        openingBalance = openingBalances.reduce(
            (sum, item) => sum + Number(item.amount ?? 0), 0
        );
        receipts = cashbookEntries.reduce(
            (sum, item) =>
                sum +
                Number(item.receiptCashColumn ?? 0) +
                Number(item.receiptTreasuryPla ?? 0),
            0
        );
        disbursement = cashbookEntries.reduce(
            (sum, item) =>
                sum +
                Number(item.disbursementCashColumn ?? 0) +
                Number(item.disbursementTreasuryPla ?? 0),
            0
        );
    }

    const closingBalance = openingBalance + receipts - disbursement;

    return [
        {
            id: 1,
            headOfAccount: "8443-00-120",
            openingBalance: openingBalance.toFixed(2),
            receipts: receipts.toFixed(2),
            disbursement: disbursement.toFixed(2),
            closingBalance: closingBalance.toFixed(2),
        },
    ];
};


// Capital-expenditure major heads — excluded from COUNCIL's Statement 6
// (these belong to Form 5C, not Statement 6's revenue account).
const STATEMENT6_COUNCIL_EXCLUDED_MAJOR_HEADS = ["440", "441", "442", "443"];

// "Total Revenue Expenditure" subtotal range — majorHead 201 through 224.
const REVENUE_EXPENDITURE_RANGE = { from: 201, to: 224 };

// Same { from, to } Date-range builder pattern used elsewhere (Form 4).
// 🔸 ASSUMPTION: filtering on `voucherDate`, matching the field name
// Form 6 / Form 7 use on this same Expenditure model. If Statement 6's
// date column is actually named something else, let me know and I'll
// swap it.
function getStatement6DateRange(from, to) {
    if (!from && !to) return null;

    const range = {};
    if (from) {
        range.from = new Date(from);
        range.from.setUTCHours(0, 0, 0, 0);
    }
    if (to) {
        range.to = new Date(to);
        range.to.setUTCHours(23, 59, 59, 999);
    }
    return range;
}

// Fetches Expenditure rows for ONE sector at a time, so COUNCIL and
// STATE can each apply their own filter rule before being merged
// (needed for CONSOLIDATED, where the two rules now differ).
const getStatement6ExpenditureRows = async ({ sector, dateRange, excludeCapitalHeads }) => {
    const where = { isActive: true };

    if (sector) where.sector = sector;

    if (dateRange) {
        where.voucherDate = { gte: dateRange.from, lte: dateRange.to };
    }

    if (excludeCapitalHeads) {
        where.majorHead = { notIn: STATEMENT6_COUNCIL_EXCLUDED_MAJOR_HEADS };
    }

    return prisma.expenditure.findMany({
        where,
        select: {
            majorHead: true,
            subMajorHead: true,
            minorHead: true,
            grossAmount: true,
            planType: true,
        },
    });
};

export const getStatement6Data = async ({ sector, from, to } = {}) => {
    const isStateSector = sector === "STATE";
    const isCouncilSector = sector === "COUNCIL";
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const dateRange = getStatement6DateRange(from, to);

    let expenditures = [];

    if (isStateSector) {
        // ── STATE: UNCHANGED rule — no majorHead exclusion ──────────
        expenditures = await getStatement6ExpenditureRows({
            sector: "STATE",
            dateRange,
            excludeCapitalHeads: false,
        });
    } else if (isCouncilSector) {
        // ── COUNCIL: exclude capital-expenditure major heads ────────
        expenditures = await getStatement6ExpenditureRows({
            sector: "COUNCIL",
            dateRange,
            excludeCapitalHeads: true,
        });
    } else if (isConsolidated) {
        // ── CONSOLIDATED: COUNCIL's rule + STATE's rule, merged ─────
        // (previously a single unfiltered-by-sector query worked here
        // because both sectors shared the same rule; now they don't,
        // so each is fetched separately with its own filter.)
        const [councilRows, stateRows] = await Promise.all([
            getStatement6ExpenditureRows({
                sector: "COUNCIL",
                dateRange,
                excludeCapitalHeads: true,
            }),
            getStatement6ExpenditureRows({
                sector: "STATE",
                dateRange,
                excludeCapitalHeads: false,
            }),
        ]);
        expenditures = [...councilRows, ...stateRows];
    } else {
        // Any other/unknown sector value — fall back to a literal
        // sector filter with no exclusion, same as the old behavior.
        expenditures = await getStatement6ExpenditureRows({
            sector,
            dateRange,
            excludeCapitalHeads: false,
        });
    }

    // "Total Revenue Expenditure" subtotal only applies to COUNCIL's
    // majorHead range — shown for COUNCIL and CONSOLIDATED (which
    // includes COUNCIL rows), never for STATE-only.
    const includeRevenueSubtotal = isCouncilSector || isConsolidated;

    // ── Step 1: aggregate by (majorHead, subMajorHead, minorHead) ──────────
    const groupMap = new Map();

    for (const item of expenditures) {
        const majorCode = item.majorHead;
        const subMajorCode = item.subMajorHead || null;
        const minorCode = item.minorHead || null;

        const subMajorKey = subMajorCode || `${majorCode}__NOSUB`;
        const minorKey = minorCode || `${subMajorKey}__NOMIN`;

        const key = `${majorCode}|${subMajorKey}|${minorKey}`;

        if (!groupMap.has(key)) {
            groupMap.set(key, {
                majorCode,
                subMajorCode,
                subMajorKey,
                minorCode,
                minorKey,
                nonPlan: 0,
                plan: 0,
            });
        }

        const group = groupMap.get(key);
        const amount = Number(item.grossAmount ?? 0);

        if (item.planType?.toLowerCase() === "plan") {
            group.plan += amount;
        } else {
            group.nonPlan += amount;
        }
    }

    const groups = Array.from(groupMap.values());

    // ── Step 2: fetch names for every code we actually need ────────────────
    const majorCodes = [...new Set(groups.map((g) => g.majorCode))];
    const subMajorCodes = [
        ...new Set(groups.map((g) => g.subMajorCode).filter(Boolean)),
    ];
    const minorCodes = [
        ...new Set(groups.map((g) => g.minorCode).filter(Boolean)),
    ];

    const headsRows = await prisma.heads.findMany({
        where: {
            isActive: true,
            OR: [
                { majorHeadCode: { in: majorCodes } },
                { subMajorCode: { in: subMajorCodes } },
                { minorHeadCode: { in: minorCodes } },
            ],
        },
        select: {
            majorHead: true,
            majorHeadCode: true,
            subMajor: true,
            subMajorCode: true,
            minorHead: true,
            minorHeadCode: true,
        },
    });

    const majorNameMap = new Map();
    const subMajorNameMap = new Map();
    const minorNameMap = new Map();

    for (const h of headsRows) {
        if (h.majorHeadCode && !majorNameMap.has(h.majorHeadCode)) {
            majorNameMap.set(h.majorHeadCode, h.majorHead);
        }
        if (h.subMajorCode && !subMajorNameMap.has(h.subMajorCode)) {
            subMajorNameMap.set(h.subMajorCode, h.subMajor);
        }
        if (h.minorHeadCode && !minorNameMap.has(h.minorHeadCode)) {
            minorNameMap.set(h.minorHeadCode, h.minorHead);
        }
    }

    // ── Step 3: build nested major → subMajor → minor structure ────────────
    const majorsMap = new Map();

    for (const g of groups) {
        if (!majorsMap.has(g.majorCode)) {
            majorsMap.set(g.majorCode, {
                code: g.majorCode,
                name: majorNameMap.get(g.majorCode) || "",
                nonPlan: 0,
                plan: 0,
                subMajors: new Map(),
            });
        }
        const major = majorsMap.get(g.majorCode);
        major.nonPlan += g.nonPlan;
        major.plan += g.plan;

        if (!major.subMajors.has(g.subMajorKey)) {
            major.subMajors.set(g.subMajorKey, {
                code: g.subMajorCode,
                name: g.subMajorCode
                    ? subMajorNameMap.get(g.subMajorCode) || ""
                    : "",
                nonPlan: 0,
                plan: 0,
                minors: new Map(),
            });
        }
        const subMajor = major.subMajors.get(g.subMajorKey);
        subMajor.nonPlan += g.nonPlan;
        subMajor.plan += g.plan;

        if (!subMajor.minors.has(g.minorKey)) {
            subMajor.minors.set(g.minorKey, {
                code: g.minorCode,
                name: g.minorCode ? minorNameMap.get(g.minorCode) || "" : "",
                nonPlan: 0,
                plan: 0,
            });
        }
        const minor = subMajor.minors.get(g.minorKey);
        minor.nonPlan += g.nonPlan;
        minor.plan += g.plan;
    }

    // ── Step 4: flatten, cascading the heads text as in the mock-up ────────
    const rows = [];
    let idCounter = 1;

    const pushRow = (lines, nonPlan, plan, { isTotal = false } = {}) => {
        rows.push({
            id: idCounter++,
            heads: lines, // array of { level, text }
            isTotal,
            nonPlan: nonPlan.toFixed(2),
            plan: plan.toFixed(2),
            total: (nonPlan + plan).toFixed(2),
        });
    };

    const sortedMajors = [...majorsMap.values()].sort((a, b) =>
        a.code.localeCompare(b.code),
    );

    // 🔸 Tracks the running total across contiguous majorHeads in the
    // 201–224 range, so "Total Revenue Expenditure" is inserted right
    // after the last major in that range (before whatever major comes
    // next), regardless of gaps in the actual data.
    let revenueAccum = { nonPlan: 0, plan: 0 };
    let inRevenueBlock = false;

    const flushRevenueSubtotal = () => {
        if (!inRevenueBlock) return;
        pushRow(
            [{ level: "total", text: "Total Revenue Expenditure" }],
            revenueAccum.nonPlan,
            revenueAccum.plan,
            { isTotal: true },
        );
        inRevenueBlock = false;
        revenueAccum = { nonPlan: 0, plan: 0 };
    };

    for (const major of sortedMajors) {
        const majorNum = parseInt(major.code, 10);
        const isInRevenueRange =
            includeRevenueSubtotal &&
            !Number.isNaN(majorNum) &&
            majorNum >= REVENUE_EXPENDITURE_RANGE.from &&
            majorNum <= REVENUE_EXPENDITURE_RANGE.to;

        if (isInRevenueRange) {
            revenueAccum.nonPlan += major.nonPlan;
            revenueAccum.plan += major.plan;
            inRevenueBlock = true;
        } else {
            // Left the 201-224 block (or never entered it) — flush
            // any accumulated subtotal before processing this major.
            flushRevenueSubtotal();
        }

        const sortedSubMajors = [...major.subMajors.values()].sort((a, b) =>
            (a.code || "").localeCompare(b.code || ""),
        );

        let majorHeaderShown = false;

        for (const subMajor of sortedSubMajors) {
            const sortedMinors = [...subMajor.minors.values()].sort((a, b) =>
                (a.code || "").localeCompare(b.code || ""),
            );
            let subMajorHeaderShown = false;

            for (const minor of sortedMinors) {
                if (minor.code) {
                    const lines = [];
                    if (!majorHeaderShown) {
                        lines.push({ level: "major", text: `${major.code} - ${major.name}` });
                        majorHeaderShown = true;
                    }
                    if (!subMajorHeaderShown && subMajor.code) {
                        lines.push({ level: "subMajor", text: `${subMajor.code} - ${subMajor.name}` });
                        subMajorHeaderShown = true;
                    }
                    lines.push({ level: "minor", text: `${minor.code} - ${minor.name}` });
                    pushRow(lines, minor.nonPlan, minor.plan);
                } else if (!subMajor.code) {
                    pushRow(
                        [{ level: "major", text: `${major.code} - ${major.name}` }],
                        minor.nonPlan,
                        minor.plan,
                    );
                }
            }

            if (subMajor.code) {
                pushRow(
                    [{ level: "total", text: `Total ${subMajor.code} - ${subMajor.name}` }],
                    subMajor.nonPlan,
                    subMajor.plan,
                    { isTotal: true },
                );
            }
        }

        pushRow(
            [{ level: "total", text: `Total ${major.code} - ${major.name}` }],
            major.nonPlan,
            major.plan,
            { isTotal: true },
        );
    }

    // If the last major processed was still inside the revenue range,
    // the subtotal never got flushed inside the loop — flush it now.
    flushRevenueSubtotal();

    const grandTotal = groups.reduce((sum, g) => sum + g.nonPlan + g.plan, 0);

    return { rows, grandTotal: grandTotal.toFixed(2) };
};


// ─────────────────────────────────────────────────────────────
// STATEMENT 5 - Detailed Account of Revenue Receipt by Minor Heads
// Data comes from 3 tables: challan, challanFromBill, stateChallan
//
// STATE: UNCHANGED — only from StateChallan table.
//
// COUNCIL: NEW structured layout (heads display/grouping logic is
// untouched — same ChallanHeads/CHALLAN_FROM_BILL_HEAD_CODES lookups,
// same "group by full head chain" behaviour — only WHICH rows go in
// and their ORDER changed):
//   1. Challan rows, majorHead 001–016 (challanType COUNCIL)
//   2. A synthetic "Total Revenue Receipt" row = sum of bucket 1 ONLY
//   3. Challan rows, majorHead 017 (challanType COUNCIL)
//   4. ChallanFromBill rows, sector IN [COUNCIL, STATE], majorHead
//      001–016 (derived from amountType via CHALLAN_FROM_BILL_HEAD_CODES,
//      same as how these rows were already being resolved — the raw
//      majorHead/subMajor/minorHead columns on this table aren't
//      reliably populated, that's why that lookup table exists)
//
// CONSOLIDATED: Council's structured result (all 4 buckets above) +
// State's existing StateChallan-only grouped rows, concatenated —
// same "council array + state array" pattern used across the other
// statements in this file.
//
// Date field per table: challan → challanDate, challanFromBill →
// voucharDate, stateChallan → challanDate
// ─────────────────────────────────────────────────────────────

const getDateRangeFromParams = (from, to) => {
    if (!from && !to) return null;
    const range = {};
    if (from) range.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) range.lte = new Date(`${to}T23:59:59.999Z`);
    return range;
};

// ─────────────────────────────────────────────────────────────
// Head-code lookup for ChallanFromBill (keyed by amountType)
// Per current requirement: only CODES are shown for ChallanFromBill
// rows for now — no name resolution is attempted here.
// ─────────────────────────────────────────────────────────────
const CHALLAN_FROM_BILL_HEAD_CODES = {
    "Professional Tax": { major: "001", subMajor: "01", minor: "02" },
    "Building Loan": { major: "661", subMajor: "01", minor: "02" },
    "Car Loan": { major: "661", subMajor: "02", minor: "01" },
    "Earnest Money": { major: "664", subMajor: "01", minor: "01" },
    "House Rent": { major: "007", subMajor: "01", minor: "00" },
    "Security Deposits": { major: "664", subMajor: "01", minor: "01" },
    "Forest Royalty": { major: "013", subMajor: "01", minor: "01" },
    "MC Forest Royalty": { major: "013", subMajor: "01", minor: "01" },
    "Monopoly": { major: "013", subMajor: "01", minor: "01" },
    "Advance Payment": { major: "8443", subMajor: "00", minor: "120" },
    "Other Deductions": { major: "8443", subMajor: "00", minor: "120" },
    "CGST": { major: "8443", subMajor: "00", minor: "120" },
    "SGST": { major: "8443", subMajor: "00", minor: "120" },
    "IGST": { major: "8443", subMajor: "00", minor: "120" },
    "ITAX": { major: "8443", subMajor: "01", minor: "120" },
    "MDRRF": { major: "8443", subMajor: "00", minor: "120" },
    "DMFT": { major: "8443", subMajor: "00", minor: "120" },
    "Labour Cess": { major: "8443", subMajor: "00", minor: "120" },
    "IT Forest Royalty": { major: "8443", subMajor: "00", minor: "120" },
    "VAT": { major: "8443", subMajor: "00", minor: "120" },
    "CPF Council Share": { major: "662", subMajor: "01", minor: "01" },
    "CPF Contribution": { major: "662", subMajor: "01", minor: "02" },
    "CPF Advance": { major: "662", subMajor: "01", minor: "05" },
};

// 🔥 Overrides applied only when the ROW's own sector is STATE
const CHALLAN_FROM_BILL_STATE_OVERRIDES = {
    "Earnest Money": { major: "8443", subMajor: "00", minor: "120" },
    "Security Deposits": { major: "8443", subMajor: "00", minor: "120" },
};

const getChallanFromBillHeadCode = (amountType, rowSector) => {
    const overrides =
        rowSector === "STATE" ? CHALLAN_FROM_BILL_STATE_OVERRIDES : null;
    const match =
        (overrides && overrides[amountType]) ||
        CHALLAN_FROM_BILL_HEAD_CODES[amountType] ||
        null;

    if (!match) return {};

    return {
        majorHeadCode: match.major,
        subMajorCode: match.subMajor,
        minorHeadCode: match.minor,
    };
};

// ─────────────────────────────────────────────────────────────
// Shared level definitions used across all 3 sources when
// building the final display rows.
// ─────────────────────────────────────────────────────────────
const HEAD_CODE_LEVELS = [
    "majorHeadCode",
    "subMajorCode",
    "minorHeadCode",
    "subHeadCode",
    "subSubHeadCode",
    "detailHeadCode",
    "subDetailHeadCode",
];

const HEAD_NAME_LEVELS = [
    "majorHeadName",
    "subMajorName",
    "minorHeadName",
    "subHeadName",
    "subSubHeadName",
    "detailHeadName",
    "subDetailHeadName",
];

// "004" -> "4", "0000" -> "0", "" / null / undefined -> ""
const normalizeCodeSegment = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (str === "") return "";
    return /^\d+$/.test(str) ? String(parseInt(str, 10)) : str;
};

const buildNormalizedCodeKey = (codes) =>
    HEAD_CODE_LEVELS.map((level) => normalizeCodeSegment(codes[level])).join("|");

// "001" -> true (in [1,16]), null/undefined/non-numeric -> false
const isHeadCodeInRange = (code, min, max) => {
    if (!code) return false;
    const n = parseInt(code, 10);
    return !Number.isNaN(n) && n >= min && n <= max;
};

// ─────────────────────────────────────────────────────────────
// Heads table (used ONLY for StateChallan) — unchanged from before.
// sector param is optional — pass a specific sector to scope the lookup,
// or omit it to load codes across all sectors.
// ─────────────────────────────────────────────────────────────
const getHeadsNameMap = async (sector) => {
    const where = { isActive: true };
    if (sector) where.sector = sector;

    const rows = await prisma.heads.findMany({ where });

    const map = new Map();
    for (const row of rows) {
        const key = buildNormalizedCodeKey({
            majorHeadCode: row.majorHeadCode,
            subMajorCode: row.subMajorCode,
            minorHeadCode: row.minorHeadCode,
            subHeadCode: row.subHeadCode,
            subSubHeadCode: row.subSubHeadCode,
            detailHeadCode: row.detailHeadCode,
            subDetailHeadCode: row.subDetailHeadCode,
        });
        map.set(key, {
            majorHeadName: row.majorHead ?? null,
            subMajorName: row.subMajor ?? null,
            minorHeadName: row.minorHead ?? null,
            subHeadName: row.subHead ?? null,
            subSubHeadName: row.subSubHead ?? null,
            detailHeadName: row.detailHead ?? null,
            subDetailHeadName: row.subDetailHead ?? null,
        });
    }

    logger.info(
        `Statement5: Loaded ${map.size} head-code → head-name entries (Heads) for sector: ${sector ?? "ALL"}`
    );

    return map;
};

// ─────────────────────────────────────────────────────────────
// ChallanHeads table (used ONLY for the plain Challan table).
// ChallanHeads codes repeat across branches (e.g. "01" appears under
// many different majors), so lookups are done PARENT-AWARE:
//   - subMajor is looked up by (majorCode, subMajorCode)
//   - minorHead is looked up by (subMajorCode, minorCode)
// using the *ParentCode columns on ChallanHeads, not a flat key.
// This is a small master table, so we load it once per call.
// ─────────────────────────────────────────────────────────────
const getChallanHeadsNameMap = async () => {
    const rows = await prisma.challanHeads.findMany({ where: { isActive: true } });

    const majorMap = new Map();    // majorCode -> name
    const subMajorMap = new Map(); // `${majorCode}|${subMajorCode}` -> name
    const minorMap = new Map();    // `${subMajorCode}|${minorCode}` -> name

    for (const row of rows) {
        const majorCode = normalizeCodeSegment(row.majorHeadCode);
        const subMajorCode = normalizeCodeSegment(row.subMajorCode);
        const subMajorParent = normalizeCodeSegment(row.subMajorParentCode);
        const minorCode = normalizeCodeSegment(row.minorHeadCode);
        const minorParent = normalizeCodeSegment(row.minorHeadParentCode);

        if (majorCode && majorCode !== "0" && !majorMap.has(majorCode)) {
            majorMap.set(majorCode, row.majorHead ?? null);
        }
        if (subMajorCode && subMajorCode !== "0") {
            const key = `${subMajorParent}|${subMajorCode}`;
            if (!subMajorMap.has(key)) subMajorMap.set(key, row.subMajor ?? null);
        }
        if (minorCode && minorCode !== "0") {
            const key = `${minorParent}|${minorCode}`;
            if (!minorMap.has(key)) minorMap.set(key, row.minorHead ?? null);
        }
    }

    logger.info(
        `Statement5: Loaded ChallanHeads lookup — majors: ${majorMap.size}, subMajors: ${subMajorMap.size}, minors: ${minorMap.size}`
    );

    return { majorMap, subMajorMap, minorMap };
};

// Amount types allowed from challanFromBill for Statement 5
// (still used by the old getStatement5ChallanFromBillRows below,
// which is no longer called by getStatement5Data — see note there)
const STATEMENT5_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// ─────────────────────────────────────────────────────────────
// Per-row mapping helpers — extracted so both the old (now-unused
// by getStatement5Data, kept for compatibility) per-sector fetchers
// AND the new Council bucketed fetcher share identical row shapes.
// ─────────────────────────────────────────────────────────────
const mapStatement5ChallanRow = (row, { majorMap, subMajorMap, minorMap }) => {
    const majorCode = normalizeCodeSegment(row.majorHead);
    const subMajorCode = normalizeCodeSegment(row.subMajorHead);
    const minorCode = normalizeCodeSegment(row.minorHead);

    const majorHeadName = majorCode ? majorMap.get(majorCode) ?? null : null;
    const subMajorName = subMajorCode
        ? subMajorMap.get(`${majorCode}|${subMajorCode}`) ?? null
        : null;
    const minorHeadName = minorCode
        ? minorMap.get(`${subMajorCode}|${minorCode}`) ?? null
        : null;

    return {
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        sector: row.challanType ?? null,
        source: "challan",
        majorHeadCode: row.majorHead ?? null,
        subMajorCode: row.subMajorHead ?? null,
        minorHeadCode: row.minorHead ?? null,
        majorHeadName,
        subMajorName,
        minorHeadName,
    };
};

const mapStatement5ChallanFromBillRow = (row) => {
    const rowSector = row.sector ?? null;
    const codes = getChallanFromBillHeadCode(row.amountType, rowSector);

    return {
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajor ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        sector: rowSector,
        source: "challanFromBill",
        amountType: row.amountType ?? null,
        // 🔸 Names intentionally left null for now — only codes are
        // shown for ChallanFromBill rows, per current requirement.
        majorHeadName: null,
        subMajorName: null,
        minorHeadName: null,
        // resolved codes = looked up from amountType above (may be empty)
        ...codes,
    };
};

// Get rows from Challan table
// (kept for compatibility — no longer called by getStatement5Data,
// since Council now fetches its own way to control bucket ordering.
// STATE never used this; CONSOLIDATED used to but now uses the
// Council bucketed fetch + State's StateChallan rows instead.)
const getStatement5ChallanRows = async (sector, dateRange) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.challanType = sector;
    }

    if (dateRange) {
        where.challanDate = dateRange;
    }

    const rows = await prisma.challan.findMany({ where });

    logger.info(
        `Statement5: Fetched ${rows.length} rows from Challan for sector: ${sector ?? "ALL"}`
    );

    const headsNameLookup = await getChallanHeadsNameMap();

    return rows.map((row) => mapStatement5ChallanRow(row, headsNameLookup));
};

// Get rows from ChallanFromBill table
// (kept for compatibility — no longer called by getStatement5Data,
// see note above getStatement5ChallanRows.)
const getStatement5ChallanFromBillRows = async (sector, dateRange) => {
    const where = {
        isActive: true,
        amountType: { in: STATEMENT5_ALLOWED_AMOUNT_TYPES },
    };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
    }

    if (dateRange) {
        where.voucharDate = dateRange;
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Statement5: Fetched ${rows.length} rows from ChallanFromBill for sector: ${sector ?? "ALL"}`
    );

    return rows.map(mapStatement5ChallanFromBillRow);
};

// ─────────────────────────────────────────────────────────────
// Get rows from StateChallan table
// Fetched whenever sector is STATE or CONSOLIDATED
// ─────────────────────────────────────────────────────────────
const getStatement5StateChallanRows = async (dateRange) => {
    const where = { sector: "STATE" };

    if (dateRange) {
        where.challanDate = dateRange;
    }

    const rows = await prisma.stateChallan.findMany({
        where,
        select: {
            id: true,
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
    });

    logger.info(`Statement5: Fetched ${rows.length} rows from StateChallan`);

    const headsNameMap = await getHeadsNameMap("STATE");

    return rows.map((row) => {
        const codeKey = buildNormalizedCodeKey({
            majorHeadCode: row.majorHead,
            subMajorCode: row.subMajorHead,
            minorHeadCode: row.minorHead,
            subHeadCode: row.subHead,
            subSubHeadCode: row.subSubHead,
            detailHeadCode: row.detailHead,
            subDetailHeadCode: row.subDetailHead,
        });
        const names = headsNameMap.get(codeKey) ?? {};

        return {
            majorHead: row.majorHead ?? "Unknown",
            subMajor: row.subMajorHead ?? "-",
            minorHead: row.minorHead ?? "-",
            subHead: row.subHead ?? "-",
            subSubHead: row.subSubHead ?? "-",
            detailHead: row.detailHead ?? "-",
            subDetailHead: row.subDetailHead ?? "-",
            amount:
                row.totalAmount != null
                    ? parseFloat(row.totalAmount.toFixed(2))
                    : 0,
            sector: "STATE",
            source: "stateChallan",
            majorHeadCode: row.majorHead ?? null,
            subMajorCode: row.subMajorHead ?? null,
            minorHeadCode: row.minorHead ?? null,
            subHeadCode: row.subHead ?? null,
            subSubHeadCode: row.subSubHead ?? null,
            detailHeadCode: row.detailHead ?? null,
            subDetailHeadCode: row.subDetailHead ?? null,
            majorHeadName: names.majorHeadName ?? null,
            subMajorName: names.subMajorName ?? null,
            minorHeadName: names.minorHeadName ?? null,
            subHeadName: names.subHeadName ?? null,
            subSubHeadName: names.subSubHeadName ?? null,
            detailHeadName: names.detailHeadName ?? null,
            subDetailHeadName: names.subDetailHeadName ?? null,
        };
    });
};

// ─────────────────────────────────────────────────────────────
// Group identical head chains together into display rows.
// Extracted unchanged from the old inline block in getStatement5Data
// so it can run per-bucket for Council as well as for State.
// ─────────────────────────────────────────────────────────────
const groupStatement5Rows = (rows) => {
    const grouped = rows.reduce((acc, row) => {
        const key = [
            row.majorHead,
            row.subMajor,
            row.minorHead,
            row.subHead,
            row.subSubHead,
            row.detailHead,
            row.subDetailHead,
        ]
            .filter((p) => p && p !== "-")
            .join("-");

        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
    }, {});

    return Object.entries(grouped).map(([heads, groupedRows]) => {
        const total = groupedRows.reduce((sum, row) => sum + row.amount, 0);
        const [sample] = groupedRows;

        const levels = HEAD_CODE_LEVELS.reduce((acc, codeField, idx) => {
            const nameField = HEAD_NAME_LEVELS[idx];
            const raw = sample[codeField];
            const code = raw !== null && raw !== undefined ? String(raw).trim() : "";
            if (!code || code === "-" || code === "0") return acc;
            acc.push({ code, name: sample[nameField] || null });
            return acc;
        }, []);

        const headsLines = levels.length
            ? levels.map((l) => (l.name ? `${l.code} - ${l.name}` : l.code))
            : [heads]; // fallback: raw grouping key if no code fields exist

        const matched = levels.length > 0 && levels.every((l) => l.name);

        return {
            heads,
            headsLines,
            matched,
            rows: groupedRows,
            total: parseFloat(total.toFixed(2)),
            hasMultiple: groupedRows.length > 1,
        };
    });
};

// ─────────────────────────────────────────────────────────────
// COUNCIL — new structured layout. See the header comment at the
// top of this section for the 4-bucket order.
// ─────────────────────────────────────────────────────────────
const STATEMENT5_COUNCIL_REVENUE_HEAD_MIN = 1;
const STATEMENT5_COUNCIL_REVENUE_HEAD_MAX = 16;
const STATEMENT5_COUNCIL_HEAD_017 = 17;

const getStatement5CouncilRows = async (dateRange) => {
    const [challanRows, cfbRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...(dateRange ? { challanDate: dateRange } : {}),
            },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: ["COUNCIL", "STATE"] },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
        }),
    ]);

    logger.info(
        `Statement5 [COUNCIL]: Fetched ${challanRows.length} Challan rows (challanType COUNCIL), ${cfbRows.length} ChallanFromBill rows (sector IN [COUNCIL, STATE])`
    );

    const headsNameLookup = await getChallanHeadsNameMap();

    const mappedChallanRows = challanRows.map((row) =>
        mapStatement5ChallanRow(row, headsNameLookup)
    );
    const mappedCfbRows = cfbRows.map(mapStatement5ChallanFromBillRow);

    // ── Bucket 1: Challan majorHead 001–016 ──
    const revenueRangeRows = mappedChallanRows.filter((r) =>
        isHeadCodeInRange(r.majorHeadCode, STATEMENT5_COUNCIL_REVENUE_HEAD_MIN, STATEMENT5_COUNCIL_REVENUE_HEAD_MAX)
    );

    // ── Bucket 3 (shown after the total): Challan majorHead 017 ──
    const head017Rows = mappedChallanRows.filter((r) =>
        isHeadCodeInRange(r.majorHeadCode, STATEMENT5_COUNCIL_HEAD_017, STATEMENT5_COUNCIL_HEAD_017)
    );

    // ── Bucket 4: ChallanFromBill, sector IN [COUNCIL, STATE], derived
    // majorHead 001–016 (derived from amountType — see header note) ──
    const cfbRangeRows = mappedCfbRows.filter((r) =>
        isHeadCodeInRange(r.majorHeadCode, STATEMENT5_COUNCIL_REVENUE_HEAD_MIN, STATEMENT5_COUNCIL_REVENUE_HEAD_MAX)
    );

    logger.info(
        `Statement5 [COUNCIL]: bucket sizes — 001-016: ${revenueRangeRows.length}, 017: ${head017Rows.length}, ChallanFromBill 001-016: ${cfbRangeRows.length}`
    );

    const revenueRangeGroups = groupStatement5Rows(revenueRangeRows);
    const head017Groups = groupStatement5Rows(head017Rows);
    const cfbRangeGroups = groupStatement5Rows(cfbRangeRows);

    // ── Bucket 2: synthetic "Total Revenue Receipt" row — sum of
    // bucket 1 (majorHead 001–016 Challan rows) ONLY. Not 017, not
    // the ChallanFromBill bucket. ──
    const totalRevenueReceiptAmount = revenueRangeRows.reduce(
        (s, r) => s + r.amount,
        0
    );
    const totalRevenueReceiptRow = {
        heads: "Total Revenue Receipt",
        headsLines: ["Total Revenue Receipt"],
        matched: true,
        rows: [],
        total: parseFloat(totalRevenueReceiptAmount.toFixed(2)),
        hasMultiple: false,
        isTotal: true,
    };

    return [
        ...revenueRangeGroups,
        totalRevenueReceiptRow,
        ...head017Groups,
        ...cfbRangeGroups,
    ];
};

// ─────────────────────────────────────────────────────────────
// Main Statement 5 function.
// STATE: unchanged (StateChallan only, generic grouping).
// COUNCIL: new 4-bucket structured layout (see getStatement5CouncilRows).
// CONSOLIDATED: Council's structured result + State's grouped result,
// concatenated.
// ─────────────────────────────────────────────────────────────
export const getStatement5Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 5 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const dateRange = getDateRangeFromParams(from, to);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        if (isStateSector) {
            logger.info(
                `Statement5: sector=STATE → using StateChallan only (unchanged)`
            );
            const stateChallanRows = await getStatement5StateChallanRows(dateRange);
            const result = groupStatement5Rows(stateChallanRows);
            logger.info(`Statement 5 total groups returned: ${result.length}`);
            return result;
        }

        if (isCouncilSector) {
            const result = await getStatement5CouncilRows(dateRange);
            logger.info(`Statement 5 total groups returned: ${result.length}`);
            return result;
        }

        if (isConsolidated) {
            const [councilResult, stateChallanRows] = await Promise.all([
                getStatement5CouncilRows(dateRange),
                getStatement5StateChallanRows(dateRange),
            ]);
            const stateResult = groupStatement5Rows(stateChallanRows);
            const combined = [...councilResult, ...stateResult];
            logger.info(`Statement 5 total groups returned: ${combined.length}`);
            return combined;
        }

        logger.info(
            `Statement5: no rule defined for sector "${sector}" — returning empty result`
        );
        return [];
    } catch (error) {
        logger.error(`Error fetching Statement 5 data: ${error.message}`);
        throw error;
    }
};




// ─────────────────────────────────────────────────────────────
// STATEMENT 4 - Loans and Advances by the Council
//
// STATE: UNCHANGED — 2 fixed rows (Car Loan, House/Building Loan),
// loanType-based, NO date filtering, opening balance forced to 0.
//
// COUNCIL: NEW rule, date-filtered by financial year:
//   - Balance outstanding on 1st April = Expenditure.grossAmount,
//     sector=COUNCIL, minorHead 6610101 (House/Building Loan) or
//     6610201 (Car Loan), using the PREVIOUS financial year window
//     (selected from/to shifted back one year — same convention as
//     Statement 1 / Statement 2).
//   - Amount Paid during the year = same query, but the SELECTED
//     (current) financial year window.
//   - Amount Repaid during the year = Challan.amount (majorHead
//     6610101/6610201, challanType COUNCIL, current FY) +
//     challanFromBill.amount (amountType "Building Loan" for the
//     house row / "Car Loan" for the car row, sector COUNCIL,
//     current FY).
//   - Balance outstanding on 31 March = opening + paid - repaid
//   - Net Increase(+)/Decrease(-) = closing - opening, i.e. paid - repaid
//     (see chat note on this formula).
//
// CONSOLIDATED: STATE's 2 rows + COUNCIL's 2 rows shown together
// (4 rows total), totals summed across all of them — same pattern
// already used for Statement 3 Part 1 (Debt Position).
//
// Reuses getDateRangeFromParams and shiftYear, already defined
// once elsewhere in this file (Statement 5 / Statement 2 sections).
// ─────────────────────────────────────────────────────────────

// Small numeric-coercion helper — was missing from this file (only
// existed in Statement 1's separate service). Scoped here for Statement 4.
const safeNum = (val) => Number(val ?? 0);

const STATEMENT4_MINOR_HEAD_HOUSE = 6610101; // House / Building Loan
const STATEMENT4_MINOR_HEAD_CAR = 6610201;   // Car Loan

const isStatement4HeadCode = (value, target) => {
    if (!value) return false;
    const n = parseInt(value, 10);
    return !Number.isNaN(n) && n === target;
};

// ── STATE — unchanged math, just pulled into its own function ──
const buildStatement4StateRows = async () => {
    const expenditures = await prisma.expenditure.findMany({
        where: { isActive: true, sector: "STATE" },
        select: {
            loanType: true,
            loansAdvances: true,
            carLoanRecovery: true,
            houseLoanRecovery: true,
        },
    });

    const carAmountPaid = expenditures
        .filter((e) => e.loanType === "CAR_LOAN")
        .reduce((sum, e) => sum + Number(e.loansAdvances ?? 0), 0);
    const carAmountRecovered = expenditures.reduce(
        (sum, e) => sum + Number(e.carLoanRecovery ?? 0),
        0
    );
    const carOpeningBalance = 0;
    const carClosingBalance = carOpeningBalance + carAmountPaid - carAmountRecovered;
    const carNetChange = carClosingBalance;

    const houseAmountPaid = expenditures
        .filter((e) => e.loanType === "BUILDING_LOAN")
        .reduce((sum, e) => sum + Number(e.loansAdvances ?? 0), 0);
    const houseAmountRecovered = expenditures.reduce(
        (sum, e) => sum + Number(e.houseLoanRecovery ?? 0),
        0
    );
    const houseOpeningBalance = 0;
    const houseClosingBalance = houseOpeningBalance + houseAmountPaid - houseAmountRecovered;
    const houseNetChange = houseClosingBalance;

    return [
        {
            loans: "Car Loan",
            april: carOpeningBalance,
            amountPaid: carAmountPaid,
            amountRecover: carAmountRecovered,
            march: carClosingBalance,
            increaseDecrease: carNetChange,
        },
        {
            loans: "House / Building Loan",
            april: houseOpeningBalance,
            amountPaid: houseAmountPaid,
            amountRecover: houseAmountRecovered,
            march: houseClosingBalance,
            increaseDecrease: houseNetChange,
        },
    ];
};

// ── COUNCIL — new financial-year-based rule ──────────────────
const buildStatement4CouncilRows = async (currentDateRange, previousDateRange) => {
    const [
        openingExpenditureRows,
        currentExpenditureRows,
        currentChallanRows,
        currentCfbRows,
    ] = await Promise.all([
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(previousDateRange ? { voucherDate: previousDateRange } : {}),
            },
            select: { grossAmount: true, minorHead: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(currentDateRange ? { voucherDate: currentDateRange } : {}),
            },
            select: { grossAmount: true, minorHead: true },
        }),
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...(currentDateRange ? { challanDate: currentDateRange } : {}),
            },
            select: { amount: true, majorHead: true },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: { in: ["Building Loan", "Car Loan"] },
                ...(currentDateRange ? { voucharDate: currentDateRange } : {}),
            },
            select: { amount: true, amountType: true },
        }),
    ]);

    const buildRow = (label, headCode, cfbAmountType) => {
        const openingBalance = openingExpenditureRows
            .filter((r) => isStatement4HeadCode(r.minorHead, headCode))
            .reduce((s, r) => s + safeNum(r.grossAmount), 0);

        const amountPaid = currentExpenditureRows
            .filter((r) => isStatement4HeadCode(r.minorHead, headCode))
            .reduce((s, r) => s + safeNum(r.grossAmount), 0);

        const challanTotal = currentChallanRows
            .filter((r) => isStatement4HeadCode(r.majorHead, headCode))
            .reduce((s, r) => s + safeNum(r.amount), 0);

        const cfbTotal = currentCfbRows
            .filter((r) => r.amountType === cfbAmountType)
            .reduce((s, r) => s + safeNum(r.amount), 0);

        const amountRecover = challanTotal + cfbTotal;
        const closingBalance = openingBalance + amountPaid - amountRecover;
        const netChange = closingBalance - openingBalance; // == amountPaid - amountRecover

        return {
            loans: label,
            april: openingBalance,
            amountPaid,
            amountRecover,
            march: closingBalance,
            increaseDecrease: netChange,
        };
    };

    return [
        buildRow("House / Building Loan", STATEMENT4_MINOR_HEAD_HOUSE, "Building Loan"),
        buildRow("Car Loan", STATEMENT4_MINOR_HEAD_CAR, "Car Loan"),
    ];
};

export const getStatement4Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 4 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const currentDateRange = getDateRangeFromParams(from, to);
        const previousFrom = shiftYear(from, -1);
        const previousTo = shiftYear(to, -1);
        const previousDateRange = getDateRangeFromParams(previousFrom, previousTo);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        let rawRows = [];

        if (isStateSector) {
            rawRows = await buildStatement4StateRows();
        } else if (isCouncilSector) {
            rawRows = await buildStatement4CouncilRows(currentDateRange, previousDateRange);
        } else if (isConsolidated) {
            const [stateRows, councilRows] = await Promise.all([
                buildStatement4StateRows(),
                buildStatement4CouncilRows(currentDateRange, previousDateRange),
            ]);
            rawRows = [...stateRows, ...councilRows];
        } else {
            logger.info(
                `Statement4: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        const rows = rawRows.map((r, idx) => ({
            id: idx + 1,
            loans: r.loans,
            april: r.april.toFixed(2),
            amountPaid: r.amountPaid.toFixed(2),
            amountRecover: r.amountRecover.toFixed(2),
            march: r.march.toFixed(2),
            increaseDecrease: r.increaseDecrease.toFixed(2),
        }));

        const total = rawRows.reduce(
            (acc, r) => ({
                amountPaid: acc.amountPaid + r.amountPaid,
                amountRecover: acc.amountRecover + r.amountRecover,
                march: acc.march + r.march,
                increaseDecrease: acc.increaseDecrease + r.increaseDecrease,
            }),
            { amountPaid: 0, amountRecover: 0, march: 0, increaseDecrease: 0 }
        );

        return {
            rows,
            total: {
                amountPaid: total.amountPaid.toFixed(2),
                amountRecover: total.amountRecover.toFixed(2),
                march: total.march.toFixed(2),
                increaseDecrease: total.increaseDecrease.toFixed(2),
            },
        };
    } catch (error) {
        logger.error(`Error fetching Statement 4 data: ${error.message}`);
        throw error;
    }
};





// ─────────────────────────────────────────────────────────────
// STATEMENT 2 - Capital Outlay - Progressive Capital Outlay
// Data source: Expenditure table
//
// STATE:   grouped by the full head-of-account chain (major →
//          subDetail), majorHead 4001–5999, label resolved via the
//          Heads table full-chain match (same helpers Statement 5
//          uses above: buildNormalizedCodeKey + getHeadsNameMap).
// COUNCIL: grouped by majorHead ONLY, majorHead 440–443, label
//          resolved via a dedicated major-only Heads lookup
//          (getMajorHeadNameMap below).
// CONSOLIDATED: union of the COUNCIL row set + the STATE row set
//          (each computed with its own sector's rules above).
//
// PREVIOUS PERIOD: same convention as Statement 1 — the from/to
// window shifted back one year via shiftYear(), same sector rules,
// merged into the same grouping key so a head's previousYear and
// currentYear sit on one row.
//
// Date filtering uses voucherDate range (from/to).
// ─────────────────────────────────────────────────────────────

// Shifts a "YYYY-MM-DD" string by `delta` whole years (e.g. -1 for the
// previous financial year), keeping month/day fixed. Used to build the
// "previous period" column from the same from/to filter the user picked.
// (Statement-2-local — was missing from this file, unlike Statement 1's
// separate service where it already exists.)
const shiftYear = (dateStr, delta) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCFullYear(d.getUTCFullYear() + delta);
    return d.toISOString().slice(0, 10);
};

// ── COUNCIL: major-only name lookup against Heads ──────────────
// COUNCIL rows only ever have a majorHead code (no sub-levels), so
// this is a simple code -> name map, not a full-chain match.
const getMajorHeadNameMap = async (sector) => {
    const where = { isActive: true };
    if (sector) where.sector = sector;

    const rows = await prisma.heads.findMany({
        where,
        select: { majorHeadCode: true, majorHead: true },
    });

    const map = new Map();
    for (const row of rows) {
        const code = normalizeCodeSegment(row.majorHeadCode);
        if (code && !map.has(code)) {
            map.set(code, row.majorHead ?? null);
        }
    }

    logger.info(
        `[STATEMENT2] Loaded major-head name lookup — ${map.size} entries for sector: ${sector ?? "ALL"}`
    );

    return map;
};

const formatMajorHead = (majorHead, nameMap) => {
    const code = String(majorHead).trim();
    const normalized = normalizeCodeSegment(code);
    const name = nameMap.get(normalized);
    return name ? `${code} - ${name}` : code;
};

const currentYearAmountOf = (item) =>
    Number(item.works ?? 0) +
    Number(item.grantsInAid ?? 0) +
    Number(item.contingencies ?? 0) +
    Number(item.payOfficers ?? 0) +
    Number(item.payEstablishment ?? 0) +
    Number(item.allowanceHonorary ?? 0);

// ── STATE: full head-chain grouping, majorHead 4001–5999, names
// resolved via the same full-chain Heads match Statement 5 uses.
// Fetches both the current and previous date windows and merges
// them into one row per head-chain. ──
const buildStateRows = async (currentDateRange, previousDateRange) => {
    const isCapitalHead = (majorHead) => {
        if (!majorHead) return false;
        const num = parseInt(majorHead, 10);
        return !Number.isNaN(num) && num >= 4001 && num <= 5999;
    };

    const selectFields = {
        majorHead: true,
        subMajorHead: true,
        minorHead: true,
        subHead: true,
        subSubHead: true,
        detailHead: true,
        subDetailHead: true,
        works: true,
        grantsInAid: true,
        contingencies: true,
        payOfficers: true,
        payEstablishment: true,
        allowanceHonorary: true,
    };

    const [currentExpenditures, previousExpenditures] = await Promise.all([
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(currentDateRange ? { voucherDate: currentDateRange } : {}),
            },
            select: selectFields,
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(previousDateRange ? { voucherDate: previousDateRange } : {}),
            },
            select: selectFields,
        }),
    ]);

    const currentCapital = currentExpenditures.filter((item) => isCapitalHead(item.majorHead));
    const previousCapital = previousExpenditures.filter((item) => isCapitalHead(item.majorHead));

    logger.info(
        `[STATEMENT2] STATE capital expenditure rows — current: ${currentCapital.length}, previous: ${previousCapital.length}`
    );

    // Reuses getHeadsNameMap (declared above for Statement 5) —
    // full 7-level exact-chain match against the Heads table.
    const headsNameMap = await getHeadsNameMap("STATE");

    const buildHeadKey = (item) =>
        [
            item.majorHead,
            item.subMajorHead,
            item.minorHead,
            item.subHead,
            item.subSubHead,
            item.detailHead,
            item.subDetailHead,
        ]
            .filter((p) => p && p.trim() !== "" && p !== "-")
            .join("-");

    const buildLabel = (item, headKey) => {
        const codeKey = buildNormalizedCodeKey({
            majorHeadCode: item.majorHead,
            subMajorCode: item.subMajorHead,
            minorHeadCode: item.minorHead,
            subHeadCode: item.subHead,
            subSubHeadCode: item.subSubHead,
            detailHeadCode: item.detailHead,
            subDetailHeadCode: item.subDetailHead,
        });
        const names = headsNameMap.get(codeKey) ?? {};

        const levels = [
            { code: item.majorHead, name: names.majorHeadName },
            { code: item.subMajorHead, name: names.subMajorName },
            { code: item.minorHead, name: names.minorHeadName },
            { code: item.subHead, name: names.subHeadName },
            { code: item.subSubHead, name: names.subSubHeadName },
            { code: item.detailHead, name: names.detailHeadName },
            { code: item.subDetailHead, name: names.subDetailHeadName },
        ].filter((l) => l.code && String(l.code).trim() !== "" && l.code !== "-");

        return levels.length
            ? levels.map((l) => (l.name ? `${l.code} - ${l.name}` : l.code)).join(" / ")
            : headKey; // fallback: raw joined codes if nothing resolves
    };

    const groupMap = new Map();

    const ensureGroup = (item, headKey) => {
        if (!groupMap.has(headKey)) {
            groupMap.set(headKey, {
                majorHead: buildLabel(item, headKey),
                previousYear: 0,
                currentYear: 0,
            });
        }
        return groupMap.get(headKey);
    };

    for (const item of currentCapital) {
        const headKey = buildHeadKey(item);
        ensureGroup(item, headKey).currentYear += currentYearAmountOf(item);
    }

    for (const item of previousCapital) {
        const headKey = buildHeadKey(item);
        ensureGroup(item, headKey).previousYear += currentYearAmountOf(item);
    }

    return Array.from(groupMap.values());
};

// ── COUNCIL: grouped by majorHead only, majorHead 440–443,
// "code - name" label via getMajorHeadNameMap. Fetches both the
// current and previous date windows and merges them into one row
// per major head. ──
const buildCouncilRows = async (currentDateRange, previousDateRange) => {
    const isCouncilCapitalHead = (majorHead) => {
        if (!majorHead) return false;
        const num = parseInt(majorHead, 10);
        return !Number.isNaN(num) && num >= 440 && num <= 443;
    };

    const selectFields = {
        majorHead: true,
        works: true,
        grantsInAid: true,
        contingencies: true,
        payOfficers: true,
        payEstablishment: true,
        allowanceHonorary: true,
    };

    const [currentExpenditures, previousExpenditures] = await Promise.all([
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(currentDateRange ? { voucherDate: currentDateRange } : {}),
            },
            select: selectFields,
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(previousDateRange ? { voucherDate: previousDateRange } : {}),
            },
            select: selectFields,
        }),
    ]);

    const currentCapital = currentExpenditures.filter((item) => isCouncilCapitalHead(item.majorHead));
    const previousCapital = previousExpenditures.filter((item) => isCouncilCapitalHead(item.majorHead));

    logger.info(
        `[STATEMENT2] COUNCIL capital expenditure rows — current: ${currentCapital.length}, previous: ${previousCapital.length}`
    );

    const majorHeadNameMap = await getMajorHeadNameMap("COUNCIL");

    const groupMap = new Map();

    const ensureGroup = (code) => {
        if (!groupMap.has(code)) {
            groupMap.set(code, {
                majorHead: formatMajorHead(code, majorHeadNameMap),
                previousYear: 0,
                currentYear: 0,
            });
        }
        return groupMap.get(code);
    };

    for (const item of currentCapital) {
        const code = String(item.majorHead).trim();
        ensureGroup(code).currentYear += currentYearAmountOf(item);
    }

    for (const item of previousCapital) {
        const code = String(item.majorHead).trim();
        ensureGroup(code).previousYear += currentYearAmountOf(item);
    }

    return Array.from(groupMap.values());
};

export const getStatement2Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 2 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const currentDateRange = getDateRangeFromParams(from, to);

        // Previous period = same from/to window, shifted back one year —
        // same convention as Statement 1.
        const previousFrom = shiftYear(from, -1);
        const previousTo = shiftYear(to, -1);
        const previousDateRange = getDateRangeFromParams(previousFrom, previousTo);

        let combinedRows = [];

        if (sector === "STATE") {
            combinedRows = await buildStateRows(currentDateRange, previousDateRange);
        } else if (sector === "COUNCIL") {
            combinedRows = await buildCouncilRows(currentDateRange, previousDateRange);
        } else {
            // CONSOLIDATED — council capital heads (440–443) + state capital heads (4001–5999)
            const [councilRows, stateRows] = await Promise.all([
                buildCouncilRows(currentDateRange, previousDateRange),
                buildStateRows(currentDateRange, previousDateRange),
            ]);
            combinedRows = [...councilRows, ...stateRows];
        }

        const rows = combinedRows.map((item, index) => ({
            id: index + 1,
            majorHead: item.majorHead,
            previousYear: item.previousYear.toFixed(2),
            currentYear: item.currentYear.toFixed(2),
            total: (item.previousYear + item.currentYear).toFixed(2),
        }));

        const grandTotalPreviousYear = rows.reduce(
            (sum, r) => sum + Number(r.previousYear),
            0
        );
        const grandTotalCurrentYear = rows.reduce(
            (sum, r) => sum + Number(r.currentYear),
            0
        );
        const grandTotal = grandTotalPreviousYear + grandTotalCurrentYear;

        logger.info(`[STATEMENT2] Total rows returned: ${rows.length}`, {
            grandTotalPreviousYear,
            grandTotalCurrentYear,
        });

        return {
            rows,
            total: {
                previousYear: grandTotalPreviousYear.toFixed(2),
                currentYear: grandTotalCurrentYear.toFixed(2),
                total: grandTotal.toFixed(2),
            },
        };
    } catch (error) {
        logger.error(`Error fetching Statement 2 data: ${error.message}`, {
            stack: error.stack,
        });
        throw error;
    }
};





// ─────────────────────────────────────────────────────────────
// STATEMENT 3 - PART 1: Debt Position
//
// STATE: UNCHANGED — Civil Deposit row from Expenditure security/
//        earnest-money deduction fields.
// COUNCIL: NEW — "Loan from Governments / Other Sources" row:
//   - Receipts = Challan table, sum(amount) where majorHead = 660,
//     challanType = COUNCIL
//   - Repayments = Expenditure table, sum(loanRepayGovt +
//     loanRepayOther) where sector = COUNCIL
//   - Opening balance forced to 0 (no April balance available)
//   - Net Increase/Decrease = closingBalance - openingBalance
//     (positive = increase, negative = decrease)
// CONSOLIDATED: both rows shown together, totals summed across them.
// ─────────────────────────────────────────────────────────────

// const getDateRangeFromParams = (from, to) => {
//     if (!from && !to) return null;
//     const range = {};
//     if (from) range.gte = new Date(`${from}T00:00:00.000Z`);
//     if (to) range.lte = new Date(`${to}T23:59:59.999Z`);
//     return range;
// };

// ── STATE row — Civil Deposit — UNCHANGED math from before ──────
const getStatement3DebtStateRow = async (dateRange) => {
    const expenditures = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: {
            securityDepositsDeduction: true,
            earnestMoneyDeduction: true,
        },
    });

    const receipts = expenditures.reduce(
        (sum, e) =>
            sum +
            Number(e.securityDepositsDeduction ?? 0) +
            Number(e.earnestMoneyDeduction ?? 0),
        0
    );

    const repayments = receipts;
    const openingBalance = 0;
    const closingBalance = openingBalance + receipts - repayments;
    const netChange = openingBalance - closingBalance;

    return {
        natureDept: "8443-00-120 (Civil Deposit)",
        april: openingBalance.toFixed(2),
        receipts: receipts.toFixed(2),
        repayments: repayments.toFixed(2),
        march: closingBalance.toFixed(2),
        increaseDecrease: netChange.toFixed(2),
    };
};

// ── COUNCIL row — Loan from Governments / Other Sources — NEW ───
const isMajorHead660 = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num === 660;
};

const getStatement3DebtCouncilRow = async (dateRange) => {
    const [challans, expenditures] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...(dateRange ? { challanDate: dateRange } : {}),
            },
            select: { amount: true, majorHead: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { loanRepayGovt: true, loanRepayOther: true },
        }),
    ]);

    const receipts = challans
        .filter((c) => isMajorHead660(c.majorHead))
        .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

    const repayments = expenditures.reduce(
        (sum, e) => sum + Number(e.loanRepayGovt ?? 0) + Number(e.loanRepayOther ?? 0),
        0
    );

    // Per spec: no opening balance available for this row — always 0.
    const openingBalance = 0;
    const closingBalance = openingBalance + receipts - repayments;
    // Per spec: positive when closing > opening (increase), negative
    // when it's a decrease — opposite sign direction from the STATE
    // row above, intentionally, per the stated rule.
    const netChange = closingBalance - openingBalance;

    return {
        natureDept: "Loan from Governments / Other Sources",
        april: openingBalance.toFixed(2),
        receipts: receipts.toFixed(2),
        repayments: repayments.toFixed(2),
        march: closingBalance.toFixed(2),
        increaseDecrease: netChange.toFixed(2),
    };
};

export const getStatement3DebtData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 3 Debt data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const dateRange = getDateRangeFromParams(from, to);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        let rows = [];

        if (isStateSector) {
            rows = [await getStatement3DebtStateRow(dateRange)];
        } else if (isCouncilSector) {
            rows = [await getStatement3DebtCouncilRow(dateRange)];
        } else if (isConsolidated) {
            const [stateRow, councilRow] = await Promise.all([
                getStatement3DebtStateRow(dateRange),
                getStatement3DebtCouncilRow(dateRange),
            ]);
            rows = [stateRow, councilRow];
        } else {
            logger.info(
                `Statement3 Debt: no rule defined for sector "${sector}" — returning empty result`
            );
            rows = [];
        }

        rows = rows.map((r, idx) => ({ id: idx + 1, ...r }));

        const total = rows.reduce(
            (acc, r) => ({
                april: acc.april + Number(r.april),
                receipts: acc.receipts + Number(r.receipts),
                repayments: acc.repayments + Number(r.repayments),
                march: acc.march + Number(r.march),
                increaseDecrease: acc.increaseDecrease + Number(r.increaseDecrease),
            }),
            { april: 0, receipts: 0, repayments: 0, march: 0, increaseDecrease: 0 }
        );

        return {
            rows,
            total: {
                april: total.april.toFixed(2),
                receipts: total.receipts.toFixed(2),
                repayments: total.repayments.toFixed(2),
                march: total.march.toFixed(2),
                increaseDecrease: total.increaseDecrease.toFixed(2),
            },
        };
    } catch (error) {
        logger.error(`Error fetching Statement 3 Debt data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// STATEMENT 3 - PART 2: Ways and Means (Month-wise)
//
// STATE: UNCHANGED math, moved into buildStateWaysAndMeansMonthlyMaps.
// COUNCIL: NEW rule, in buildCouncilWaysAndMeansMonthlyMaps:
//   - Receipt = ChallanFromBill (sector IN [COUNCIL, STATE], majorHead
//     IN 001/007/013/661/664) + Challan (challanType=COUNCIL, all rows)
//   - Disbursement = Expenditure (sector=COUNCIL, all rows)
//   - Month 1 opening balance forced to 0 (no opening-balance data)
// CONSOLIDATED: STATE's monthly maps + COUNCIL's monthly maps,
//   merged additively per month, carried forward together.
//
//   ⚠️ Note: State's own receipt calc already pulls challanFromBill
//   rows tagged sector=STATE (its full 23-type list). Council's
//   receipt calc now ALSO pulls sector=STATE rows (restricted to
//   majorHead 001/007/013/661/664). Any STATE-tagged row that both
//   matches one of State's 23 amountTypes AND carries one of these
//   5 majorHeads (e.g. Professional Tax/001, House Rent/007, Forest
//   Royalty-MC Forest Royalty-Monopoly/013, Car Loan-Building Loan/
//   661, Earnest Money-Security Deposits/664) gets counted once on
//   each side, so CONSOLIDATED = State + Council double-counts those
//   rows. Flagging this — let us know if Consolidated should instead
//   exclude those specific STATE-tagged rows from one side.
// ─────────────────────────────────────────────────────────────

// Financial year months: April(4) to March(3)
const FY_MONTHS = [
    { month: "April", num: 4 },
    { month: "May", num: 5 },
    { month: "June", num: 6 },
    { month: "July", num: 7 },
    { month: "August", num: 8 },
    { month: "September", num: 9 },
    { month: "October", num: 10 },
    { month: "November", num: 11 },
    { month: "December", num: 12 },
    { month: "January", num: 1 },
    { month: "February", num: 2 },
    { month: "March", num: 3 },
];

// ── ChallanFromBill amountType lists (STATE side — unchanged) ───
const CHALLAN_FROM_BILL_PLA_AMOUNT_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "MC Forest Royalty",
    "Monopoly",
    "House Rent",
    "Earnest Money",
    "Car Loan",
    "Building Loan",
    "Security Deposits",
    "Advance Payment",
    "Other Deductions",
];

const CHALLAN_FROM_BILL_CASH_AMOUNT_TYPES = [
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

const CHALLAN_FROM_BILL_AMOUNT_TYPES = [
    ...CHALLAN_FROM_BILL_PLA_AMOUNT_TYPES,
    ...CHALLAN_FROM_BILL_CASH_AMOUNT_TYPES,
];

const CHALLAN_FROM_BILL_DISBURSEMENT_AMOUNT_TYPES =
    CHALLAN_FROM_BILL_AMOUNT_TYPES.filter((t) => t !== "Advance Payment");

// ── Shared small helpers ─────────────────────────────────────
const getMonthNum = (date) => (date ? new Date(date).getMonth() + 1 : null);

const sumByMonth = (records, dateField, amountField) => {
    const map = new Map();
    for (const r of records) {
        const m = getMonthNum(r[dateField]);
        if (!m) continue;
        map.set(m, (map.get(m) ?? 0) + Number(r[amountField] ?? 0));
    }
    return map;
};

const mergeMonthlyMaps = (mapA, mapB) => {
    const merged = new Map(mapA);
    for (const [m, amt] of mapB) {
        merged.set(m, (merged.get(m) ?? 0) + amt);
    }
    return merged;
};

// ── STATE monthly receipt/disbursement maps — UNCHANGED math ────
const buildStateWaysAndMeansMonthlyMaps = async (dateRange) => {
    const [challanFromBills, expenditures, stateChallans] = await Promise.all([
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                amountType: { in: CHALLAN_FROM_BILL_AMOUNT_TYPES },
                sector: "STATE",
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { voucharDate: true, amount: true, amountType: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { voucherDate: true, grossAmount: true },
        }),
        prisma.stateChallan.findMany({
            where: {
                sector: "STATE",
                ...(dateRange ? { challanDate: dateRange } : {}),
            },
            select: { challanDate: true, totalAmount: true },
        }),
    ]);

    // Receipt = ALL 23 challanFromBill types + stateChallan
    const receiptByMonth = sumByMonth(challanFromBills, "voucharDate", "amount");

    const stateChallanByMonth = (() => {
        const map = new Map();
        for (const r of stateChallans) {
            const m = getMonthNum(r.challanDate);
            if (!m) continue;
            const amt = r.totalAmount != null ? parseFloat(r.totalAmount.toFixed(2)) : 0;
            map.set(m, (map.get(m) ?? 0) + amt);
        }
        return map;
    })();

    const mergedReceiptByMonth = mergeMonthlyMaps(receiptByMonth, stateChallanByMonth);

    // Disbursement = challanFromBill (22 types, excl. Advance Payment) + expenditure
    const disbursementCfbRows = challanFromBills.filter((cfb) =>
        CHALLAN_FROM_BILL_DISBURSEMENT_AMOUNT_TYPES.includes(cfb.amountType)
    );
    const disbursementByMonth = sumByMonth(disbursementCfbRows, "voucharDate", "amount");
    const expenditureByMonth = sumByMonth(expenditures, "voucherDate", "grossAmount");
    const mergedDisbursementByMonth = mergeMonthlyMaps(disbursementByMonth, expenditureByMonth);

    return { receiptByMonth: mergedReceiptByMonth, disbursementByMonth: mergedDisbursementByMonth };
};

// ── COUNCIL monthly receipt/disbursement maps — NEW rule ─────────
// Receipt-side challanFromBill pulls BOTH sector=COUNCIL and
// sector=STATE rows (restricted to majorHead 001/007/013/661/664) —
// per spec, Council's Ways & Means view shows both sectors' data
// for these specific heads. See the double-counting note above
// getStatement3WaysAndMeansData for what this means for CONSOLIDATED.
const COUNCIL_CHALLAN_FROM_BILL_MAJOR_HEADS = ["001", "007", "013", "661", "664"];

const isCouncilCfbMajorHead = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    if (Number.isNaN(num)) return false;
    return COUNCIL_CHALLAN_FROM_BILL_MAJOR_HEADS.some(
        (code) => parseInt(code, 10) === num
    );
};

const buildCouncilWaysAndMeansMonthlyMaps = async (dateRange) => {
    const [challanFromBills, challans, expenditures] = await Promise.all([
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: ["COUNCIL", "STATE"] },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { voucharDate: true, amount: true, majorHead: true },
        }),
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...(dateRange ? { challanDate: dateRange } : {}),
            },
            select: { challanDate: true, amount: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { voucherDate: true, grossAmount: true },
        }),
    ]);

    // ── DEBUG 1: raw fetch counts + unfiltered totals per table ──
    const rawTotal = (records, field) =>
        records.reduce((s, r) => s + Number(r[field] ?? 0), 0);

    // console.log("[STATEMENT3 COUNCIL WAM DEBUG] ===== RAW FETCH =====");
    // console.log(
    //     `[STATEMENT3 COUNCIL WAM DEBUG] challanFromBill rows (sector IN [COUNCIL, STATE]): ${challanFromBills.length}, total amount (ALL majorHeads, before 001/007/013/661/664 filter): ${rawTotal(challanFromBills, "amount")}`
    // );
    // console.log(
    //     `[STATEMENT3 COUNCIL WAM DEBUG] challan rows: ${challans.length}, total amount: ${rawTotal(challans, "amount")}`
    // );
    // console.log(
    //     `[STATEMENT3 COUNCIL WAM DEBUG] expenditure rows: ${expenditures.length}, total grossAmount: ${rawTotal(expenditures, "grossAmount")}`
    // );
    // console.log("[STATEMENT3 COUNCIL WAM DEBUG] ===== END RAW FETCH =====");

    // Receipt = ChallanFromBill (sector IN [COUNCIL, STATE], majorHead IN 001/007/013/661/664) + Challan (all)
    const cfbFiltered = challanFromBills.filter((c) => isCouncilCfbMajorHead(c.majorHead));
    const cfbReceiptByMonth = sumByMonth(cfbFiltered, "voucharDate", "amount");
    const challanReceiptByMonth = sumByMonth(challans, "challanDate", "amount");
    const receiptByMonth = mergeMonthlyMaps(cfbReceiptByMonth, challanReceiptByMonth);

    // Disbursement = all Expenditure (sector = COUNCIL)
    const disbursementByMonth = sumByMonth(expenditures, "voucherDate", "grossAmount");

    // ── DEBUG 2: filtered/aggregated totals actually used in the rows ──
    const mapToObj = (map) => Object.fromEntries([...map.entries()].sort((a, b) => a[0] - b[0]));
    const sumMap = (map) => [...map.values()].reduce((s, v) => s + v, 0);

    // console.log("[STATEMENT3 COUNCIL WAM DEBUG] ===== FILTERED / MONTHLY AGGREGATES =====");
    // console.log(
    //     `[STATEMENT3 COUNCIL WAM DEBUG] challanFromBill rows AFTER majorHead 001/007/013/661/664 filter: ${cfbFiltered.length}, total amount: ${rawTotal(cfbFiltered, "amount")}`
    // );
    // console.log(
    //     "[STATEMENT3 COUNCIL WAM DEBUG] cfbReceiptByMonth:", JSON.stringify(mapToObj(cfbReceiptByMonth), null, 2)
    // );
    // console.log(
    //     "[STATEMENT3 COUNCIL WAM DEBUG] challanReceiptByMonth:", JSON.stringify(mapToObj(challanReceiptByMonth), null, 2)
    // );
    // console.log(
    //     `[STATEMENT3 COUNCIL WAM DEBUG] combined receiptByMonth total: ${sumMap(receiptByMonth)}`
    // );
    // console.log(
    //     "[STATEMENT3 COUNCIL WAM DEBUG] disbursementByMonth:", JSON.stringify(mapToObj(disbursementByMonth), null, 2)
    // );
    // console.log(
    //     `[STATEMENT3 COUNCIL WAM DEBUG] disbursementByMonth total: ${sumMap(disbursementByMonth)}`
    // );
    // console.log("[STATEMENT3 COUNCIL WAM DEBUG] ===== END FILTERED / MONTHLY AGGREGATES =====");

    return { receiptByMonth, disbursementByMonth };
};

export const getStatement3WaysAndMeansData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 3 Ways & Means for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const dateRange = getDateRangeFromParams(from, to);
        const openingYear = from ? new Date(from).getFullYear() : null;

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        // Opening balance is only meaningful for STATE — COUNCIL has no
        // opening-balance data per spec, so its month-1 opening stays 0.
        // For CONSOLIDATED, this pulls STATE's opening balance (COUNCIL
        // contributes nothing here since it has none).
        const openingBalances = !isCouncilSector
            ? await prisma.openingBalance.findMany({
                where: {
                    isActive: true,
                    ...(isStateSector || isConsolidated ? { sector: "STATE" } : {}),
                    ...(openingYear ? { year: openingYear } : {}),
                },
                select: { month: true, amount: true },
            })
            : [];

        const openingByMonth = new Map(
            openingBalances.map((o) => [o.month, Number(o.amount ?? 0)])
        );

        let receiptByMonth = new Map();
        let disbursementByMonth = new Map();

        if (isStateSector) {
            const maps = await buildStateWaysAndMeansMonthlyMaps(dateRange);
            receiptByMonth = maps.receiptByMonth;
            disbursementByMonth = maps.disbursementByMonth;
        } else if (isCouncilSector) {
            const maps = await buildCouncilWaysAndMeansMonthlyMaps(dateRange);
            receiptByMonth = maps.receiptByMonth;
            disbursementByMonth = maps.disbursementByMonth;
        } else if (isConsolidated) {
            const [stateMaps, councilMaps] = await Promise.all([
                buildStateWaysAndMeansMonthlyMaps(dateRange),
                buildCouncilWaysAndMeansMonthlyMaps(dateRange),
            ]);
            receiptByMonth = mergeMonthlyMaps(stateMaps.receiptByMonth, councilMaps.receiptByMonth);
            disbursementByMonth = mergeMonthlyMaps(stateMaps.disbursementByMonth, councilMaps.disbursementByMonth);
        } else {
            logger.info(
                `Statement3 Ways & Means: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        // ── Build rows with carry-forward logic (closing balance
        // becomes next month's opening balance) ──────────────────
        let carryForward = 0;
        let totalReceipt = 0;
        let totalDisbursement = 0;

        const rows = FY_MONTHS.map(({ month, num }, index) => {
            const openingBalance =
                index === 0 ? (openingByMonth.get(num) ?? 0) : carryForward;

            const receipt = receiptByMonth.get(num) ?? 0;
            const disbursement = disbursementByMonth.get(num) ?? 0;
            const closingBalance = openingBalance + receipt - disbursement;

            carryForward = closingBalance;
            totalReceipt += receipt;
            totalDisbursement += disbursement;

            return {
                monthNum: num,
                month,
                openingBalance: openingBalance.toFixed(2),
                receipt: receipt.toFixed(2),
                disbursement: disbursement.toFixed(2),
                closingBalance: closingBalance.toFixed(2),
            };
        });

        // ── Bottom total row — sums receipt/disbursement across all
        // 12 months; closingBalance is the final month's running
        // balance (already the cumulative total); openingBalance is
        // left blank since summing 12 opening balances isn't meaningful. ──
        rows.push({
            monthNum: null,
            month: "Total",
            openingBalance: "",
            receipt: totalReceipt.toFixed(2),
            disbursement: totalDisbursement.toFixed(2),
            closingBalance: carryForward.toFixed(2),
        });

        logger.info(`Statement 3 Ways & Means rows built: ${rows.length}`);

        return rows;
    } catch (error) {
        logger.error(`Error fetching Statement 3 Ways & Means data: ${error.message}`);
        throw error;
    }
};