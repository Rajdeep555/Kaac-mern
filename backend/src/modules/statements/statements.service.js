import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// STATEMENT 7 - Receipts, Disbursements and Balance
//
// RULES:
//
// - sector === "COUNCIL":
//     openingBalance = fixed constant 3066841548.00
//     receipts       = challanFromBill (majorHead IN [001,007,013,661,664],
//                       sector IN [COUNCIL,STATE])
//                       + ALL rows in the `Challan` table (that model
//                         has no `sector` column at all, so no filter
//                         is possible or needed there)
//     disbursement   = sum of Expenditure.grossAmount where sector = COUNCIL
//     closingBalance = openingBalance + receipts - disbursement
//
// - sector === "STATE":
//     openingBalance = fixed constant 3066841548.00
//     receipts       = ALL rows in `StateChallan` (no sector filter —
//                       confirmed: "show all StateChallan table data")
//     disbursement   = sum of Expenditure.grossAmount where sector = STATE
//     closingBalance = openingBalance + receipts - disbursement
//
// - sector === "CONSOLIDATED" / no sector:
//     receipts / disbursement = COUNCIL row + STATE row, summed
//     (this naturally equals: challanFromBill filtered + all Challan +
//      all StateChallan, matching the spec directly)
//     openingBalance = the SAME fixed constant (NOT doubled/summed)
//     closingBalance = openingBalance + receipts - disbursement
//
// - any other sector: no rule defined — returns an all-zero row.
// ─────────────────────────────────────────────────────────────

const STATEMENT7_OPENING_BALANCE = 3066841548.0;

const STATEMENT7_COUNCIL_RECEIPT_MAJOR_HEADS = ["001", "007", "013", "661", "664"];

const STATEMENT7_HEAD_OF_ACCOUNT =
    "8443 - Civil Deposit\n00 - Null\n120 - Deposits of Autonomous District and Regional Funds (Assam, Meghalaya and Mizoram)";

// Single-date filter helper — challanFromBill/Challan/StateChallan/
// Expenditure each store one date per row (unlike cashbookInformations,
// which stores a fromDate/toDate range and needs an overlap check).
const buildSingleDateFilter = (from, to, dateField) => {
    if (!from || !to) return {};
    const requestedFrom = new Date(from);
    const requestedTo = new Date(to);
    requestedTo.setHours(23, 59, 59, 999);

    return {
        [dateField]: { gte: requestedFrom, lte: requestedTo },
    };
};

// Challan.amount is stored as a String, the others as Decimal/Float —
// Number() handles all of them, with a NaN/nullish guard.
const sumField = (rows, field) =>
    rows.reduce((sum, item) => {
        const value = Number(item[field]);
        return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

const getStatement7CouncilRow = async ({ from, to }) => {
    const [majorHeadEntries, allChallanEntries, expenditureEntries] = await Promise.all([
        // challanFromBill: majorHead in the list, sector COUNCIL or STATE
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                majorHead: { in: STATEMENT7_COUNCIL_RECEIPT_MAJOR_HEADS },
                sector: { in: ["COUNCIL", "STATE"] },
                ...buildSingleDateFilter(from, to, "voucharDate"),
            },
        }),
        // Challan has no sector column — every active row counts.
        prisma.challan.findMany({
            where: {
                isActive: true,
                ...buildSingleDateFilter(from, to, "challanDate"),
            },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...buildSingleDateFilter(from, to, "voucherDate"),
            },
        }),
    ]);

    const receipts = sumField(majorHeadEntries, "amount") + sumField(allChallanEntries, "amount");
    const disbursement = sumField(expenditureEntries, "grossAmount");

    return {
        openingBalance: STATEMENT7_OPENING_BALANCE,
        receipts,
        disbursement,
    };
};

const getStatement7StateRow = async ({ from, to }) => {
    const [stateChallanEntries, expenditureEntries] = await Promise.all([
        // No sector filter — every active StateChallan row counts.
        prisma.stateChallan.findMany({
            where: {
                isActive: true,
                ...buildSingleDateFilter(from, to, "challanDate"),
            },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...buildSingleDateFilter(from, to, "voucherDate"),
            },
        }),
    ]);

    const receipts = sumField(stateChallanEntries, "totalAmount");
    const disbursement = sumField(expenditureEntries, "grossAmount");

    return {
        openingBalance: STATEMENT7_OPENING_BALANCE,
        receipts,
        disbursement,
    };
};

export const getStatement7Data = async ({ sector, from, to } = {}) => {
    const isStateSector = sector === "STATE";
    const isCouncilSector = sector === "COUNCIL";
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    let openingBalance = 0;
    let receipts = 0;
    let disbursement = 0;

    if (isStateSector) {
        const row = await getStatement7StateRow({ from, to });
        openingBalance = row.openingBalance;
        receipts = row.receipts;
        disbursement = row.disbursement;
    } else if (isCouncilSector) {
        const row = await getStatement7CouncilRow({ from, to });
        openingBalance = row.openingBalance;
        receipts = row.receipts;
        disbursement = row.disbursement;
    } else if (isConsolidated) {
        const [stateRow, councilRow] = await Promise.all([
            getStatement7StateRow({ from, to }),
            getStatement7CouncilRow({ from, to }),
        ]);

        // Opening balance is the single fixed figure, NOT the sum of
        // both rows' opening balances — receipts/disbursement do sum.
        openingBalance = STATEMENT7_OPENING_BALANCE;
        receipts = stateRow.receipts + councilRow.receipts;
        disbursement = stateRow.disbursement + councilRow.disbursement;
    } else {
        // No rule defined for any other sector value — all-zero row.
        openingBalance = 0;
        receipts = 0;
        disbursement = 0;
    }

    const closingBalance = openingBalance + receipts - disbursement;

    return [
        {
            id: 1,
            headOfAccount: STATEMENT7_HEAD_OF_ACCOUNT,
            openingBalance: openingBalance.toFixed(2),
            receipts: receipts.toFixed(2),
            disbursement: disbursement.toFixed(2),
            closingBalance: closingBalance.toFixed(2),
        },
    ];
};





//===========================================================
// STATEMENT 6
//
// CHANGE IN THIS PASS: COUNCIL and STATE are now each built as their
// own independent hierarchy (own aggregation, own head-name lookup,
// own major→subMajor→minor tree), and each ends with a
// "Total Capital Receipt - <Sector> Sector" row summing everything
// in that sector. CONSOLIDATED just runs both builders and
// concatenates the results — since each already carries its own
// sector total at the end, both totals show up with no extra
// special-casing (same pattern used for Statement 5's per-sector
// grand totals).
//
// Previously COUNCIL+STATE were merged into one flat expenditure
// array BEFORE aggregation for CONSOLIDATED, which is why there was
// no way to show a separate total per sector — that's fixed by
// keeping the two sectors' pipelines separate until the very end.
//
// Everything else is unchanged:
//   - COUNCIL: all Expenditure, sector = COUNCIL, reported entirely
//     under Non-Plan (Plan stays nil).
//   - STATE: all Expenditure, sector = STATE, same Non-Plan-only rule.
//   - CONSOLIDATED: COUNCIL + STATE, both Non-Plan-only.
//   - Heads shown up to major → subMajor → minor, with names resolved
//     from the Heads table.
//   - Numeric-aware sort (compareHeadCodes) at all three levels, so
//     "203" doesn't get sorted after "2029".
//
// FIX IN THIS PASS: the sector-total row ("Total Capital Receipt -
// Council/State Sector") was being pushed with `level: "grandTotal"`,
// but the frontend's LEVEL_CLASS map (in Statement6.jsx) only defines
// major / subMajor / minor / total. That mismatch meant
// LEVEL_CLASS[line.level] resolved to undefined and fell back to "",
// so the sector-total label rendered with no bold class at all (even
// though isTotal:true still correctly bolded the amount columns and
// grayed the row). Changed to `level: "total"` so it reuses the
// existing bold styling instead of silently falling through.
//===========================================================

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

// Numeric-first comparator for head codes — "203" < "2029", not the
// other way round like plain string localeCompare would give you.
const compareHeadCodes = (a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    const aValid = !Number.isNaN(na);
    const bValid = !Number.isNaN(nb);
    if (aValid && bValid) return na - nb;
    if (aValid) return -1;
    if (bValid) return 1;
    return String(a || "").localeCompare(String(b || ""));
};

// Fetches Expenditure rows for a given sector.
const getStatement6ExpenditureRows = async ({ sector, dateRange }) => {
    const where = { isActive: true };

    if (sector) where.sector = sector;

    if (dateRange) {
        where.voucherDate = { gte: dateRange.from, lte: dateRange.to };
    }

    return prisma.expenditure.findMany({
        where,
        select: {
            majorHead: true,
            subMajorHead: true,
            minorHead: true,
            grossAmount: true,
            // planType is intentionally NOT selected — Statement 6 always
            // reports everything under Non-Plan; Plan column is always nil.
        },
    });
};

// ─────────────────────────────────────────────────────────────
// Builds the full major → subMajor → minor hierarchy (with head
// names resolved) for ONE sector's expenditure rows, flattens it into
// display rows, and appends a "Total Capital Receipt - <label>" row
// at the end when sectorTotalLabel is provided.
// ─────────────────────────────────────────────────────────────
const buildStatement6SectorResult = async (expenditures, sectorTotalLabel) => {
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
        // Everything is Non-Plan for Statement 6; Plan stays 0.
        group.nonPlan += Number(item.grossAmount ?? 0);
    }

    const groups = Array.from(groupMap.values());

    // ── Step 2: fetch names for every code this sector actually needs ──────
    const majorCodes = [...new Set(groups.map((g) => g.majorCode))];
    const subMajorCodes = [
        ...new Set(groups.map((g) => g.subMajorCode).filter(Boolean)),
    ];
    const minorCodes = [
        ...new Set(groups.map((g) => g.minorCode).filter(Boolean)),
    ];

    const headsRows = groups.length
        ? await prisma.heads.findMany({
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
        })
        : [];

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
    let idCounter = 1; // renumbered sequentially by the caller after combining sectors

    const pushRow = (lines, nonPlan, plan, { isTotal = false, isGrandTotal = false } = {}) => {
        rows.push({
            id: idCounter++,
            heads: lines, // array of { level, text }
            isTotal,
            isGrandTotal,
            nonPlan: nonPlan.toFixed(2),
            plan: plan.toFixed(2),
            total: (nonPlan + plan).toFixed(2),
        });
    };

    const sortedMajors = [...majorsMap.values()].sort((a, b) =>
        compareHeadCodes(a.code, b.code),
    );

    for (const major of sortedMajors) {
        const sortedSubMajors = [...major.subMajors.values()].sort((a, b) =>
            compareHeadCodes(a.code, b.code),
        );

        let majorHeaderShown = false;

        for (const subMajor of sortedSubMajors) {
            const sortedMinors = [...subMajor.minors.values()].sort((a, b) =>
                compareHeadCodes(a.code, b.code),
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

    const sectorTotal = groups.reduce((sum, g) => sum + g.nonPlan + g.plan, 0);

    if (sectorTotalLabel) {
        // FIX: level changed from "grandTotal" to "total" so it matches a
        // key that actually exists in the frontend's LEVEL_CLASS map,
        // making the sector-total label render bold like the other totals.
        pushRow(
            [{ level: "total", text: sectorTotalLabel }],
            sectorTotal,
            0,
            { isTotal: true, isGrandTotal: true },
        );
    }

    return { rows, sectorTotal };
};

export const getStatement6Data = async ({ sector, from, to } = {}) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const dateRange = getStatement6DateRange(from, to);

    let combinedRows = [];
    let grandTotal = 0;

    if (isConsolidated) {
        // ── CONSOLIDATED: COUNCIL and STATE built independently, each
        // ending in its own sector total, then concatenated ──────────
        const [councilExpenditures, stateExpenditures] = await Promise.all([
            getStatement6ExpenditureRows({ sector: "COUNCIL", dateRange }),
            getStatement6ExpenditureRows({ sector: "STATE", dateRange }),
        ]);

        const [councilResult, stateResult] = await Promise.all([
            buildStatement6SectorResult(
                councilExpenditures,
                "Total Capital Receipt - Council Sector",
            ),
            buildStatement6SectorResult(
                stateExpenditures,
                "Total Capital Receipt - State Sector",
            ),
        ]);

        combinedRows = [...councilResult.rows, ...stateResult.rows];
        grandTotal = councilResult.sectorTotal + stateResult.sectorTotal;
    } else {
        // ── COUNCIL, STATE, or any other sector: single filtered fetch ──
        const sectorTotalLabel =
            sector === "COUNCIL"
                ? "Total Capital Receipt - Council Sector"
                : sector === "STATE"
                    ? "Total Capital Receipt - State Sector"
                    : null;

        const expenditures = await getStatement6ExpenditureRows({ sector, dateRange });
        const result = await buildStatement6SectorResult(expenditures, sectorTotalLabel);

        combinedRows = result.rows;
        grandTotal = result.sectorTotal;
    }

    // Renumber ids sequentially across the (possibly concatenated) set.
    const rows = combinedRows.map((r, idx) => ({ ...r, id: idx + 1 }));

    return { rows, grandTotal: grandTotal.toFixed(2) };
};




// ─────────────────────────────────────────────────────────────
// STATEMENT 5 - Detailed Account of Revenue Receipt by Minor Heads
// Data comes from 3 tables: challan, challanFromBill, stateChallan
//
// CHANGES IN THIS PASS:
//
// 1. FIX: a level whose raw code was exactly "0" was being dropped
//    entirely (skipped from `levels`, so it never appeared as a row
//    at all). "00" already displayed fine as "00 - Null". Now "0"
//    behaves the same way as "00" — shown as "0 - Null" instead of
//    vanishing. Only genuinely blank/"-" values are still skipped.
//
// 2. NEW: groupStatement5Rows takes an optional `grandTotalLabel`.
//    When provided, one extra row (type: "grandTotal") is appended
//    at the very end, summing everything passed into that call —
//    e.g. "Total Revenue Receipt - Council Sector" / "... - State
//    Sector". CONSOLIDATED gets both automatically, since it's still
//    just Council's grouped result (which already carries its own
//    grand-total row) concatenated with State's (same) — no special-
//    casing needed there.
//
// Everything else — COUNCIL/STATE/CONSOLIDATED sourcing, majorHead
// range filters, date fields, ChallanFromBill code derivation
// (still code-only, no name resolution), and the "matched" flag —
// is unchanged.
//
// COUNCIL: challan (challanType COUNCIL, majorHead 001–016) +
//   challanFromBill (majorHead 001–016, derived from amountType via
//   CHALLAN_FROM_BILL_HEAD_CODES, sector IN [COUNCIL, STATE]) —
//   merged into ONE grouped list.
//
// STATE: stateChallan, sector STATE, majorHead 2011–3999 only.
//
// Heads display: TRUNCATED to major → subMajor → minor ONLY (no
// subHead/subSubHead/detailHead/subDetailHead). A code with no
// resolved name (including "0"/"00") displays as "<code> - Null".
//
// CONSOLIDATED: Council's grouped result + State's grouped result,
// concatenated.
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

// Overrides applied only when the ROW's own sector is STATE
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
// Shared level definitions — TRUNCATED to major → subMajor → minor.
// ─────────────────────────────────────────────────────────────
const HEAD_CODE_LEVELS = ["majorHeadCode", "subMajorCode", "minorHeadCode"];
const HEAD_NAME_LEVELS = ["majorHeadName", "subMajorName", "minorHeadName"];

// "004" -> "4", "0000" -> "0", "" / null / undefined -> ""
const normalizeCodeSegment = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (str === "") return "";
    return /^\d+$/.test(str) ? String(parseInt(str, 10)) : str;
};

const buildNormalizedCodeKey = (codes) =>
    HEAD_CODE_LEVELS.map((level) => normalizeCodeSegment(codes[level])).join("|");

// generic numeric-range check, used both for Council's 1-16 filter
// and State's 2011-3999 filter
const isHeadCodeInRange = (code, min, max) => {
    if (!code) return false;
    const n = parseInt(code, 10);
    return !Number.isNaN(n) && n >= min && n <= max;
};

// ─────────────────────────────────────────────────────────────
// Heads table (used ONLY for StateChallan).
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
        });
        map.set(key, {
            majorHeadName: row.majorHead ?? null,
            subMajorName: row.subMajor ?? null,
            minorHeadName: row.minorHead ?? null,
        });
    }

    logger.info(
        `Statement5: Loaded ${map.size} head-code → head-name entries (Heads) for sector: ${sector ?? "ALL"}`
    );

    return map;
};

// ─────────────────────────────────────────────────────────────
// ChallanHeads table (used ONLY for the plain Challan table).
// Unchanged — still parent-aware lookups for major/subMajor/minor.
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

// ─────────────────────────────────────────────────────────────
// Per-row mapping helpers
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
        ...codes,
    };
};

// ─────────────────────────────────────────────────────────────
// Get rows from StateChallan table — range-filtered to majorHead
// 2011–3999.
// ─────────────────────────────────────────────────────────────
const STATEMENT5_STATE_HEAD_MIN = 2011;
const STATEMENT5_STATE_HEAD_MAX = 5999;

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
        },
        orderBy: { challanDate: "asc" },
    });

    logger.info(`Statement5: Fetched ${rows.length} rows from StateChallan (pre majorHead filter)`);

    const headsNameMap = await getHeadsNameMap("STATE");

    const mapped = rows.map((row) => {
        const codeKey = buildNormalizedCodeKey({
            majorHeadCode: row.majorHead,
            subMajorCode: row.subMajorHead,
            minorHeadCode: row.minorHead,
        });
        const names = headsNameMap.get(codeKey) ?? {};

        return {
            majorHead: row.majorHead ?? "Unknown",
            subMajor: row.subMajorHead ?? "-",
            minorHead: row.minorHead ?? "-",
            amount:
                row.totalAmount != null
                    ? parseFloat(row.totalAmount.toFixed(2))
                    : 0,
            sector: "STATE",
            source: "stateChallan",
            majorHeadCode: row.majorHead ?? null,
            subMajorCode: row.subMajorHead ?? null,
            minorHeadCode: row.minorHead ?? null,
            majorHeadName: names.majorHeadName ?? null,
            subMajorName: names.subMajorName ?? null,
            minorHeadName: names.minorHeadName ?? null,
        };
    });

    const filtered = mapped.filter((r) =>
        isHeadCodeInRange(r.majorHeadCode, STATEMENT5_STATE_HEAD_MIN, STATEMENT5_STATE_HEAD_MAX)
    );

    logger.info(
        `Statement5: StateChallan rows after majorHead ${STATEMENT5_STATE_HEAD_MIN}-${STATEMENT5_STATE_HEAD_MAX} filter: ${filtered.length}`
    );

    return filtered;
};

// ─────────────────────────────────────────────────────────────
// Group identical head chains together, then reshape into a flat,
// TAGGED hierarchy of display rows:
//   major header → sub header → minor leaf (amount) → ... →
//   "Total under Major Head X" (sum of that major's leaves) → ... →
//   optional grand total row (sum of EVERYTHING passed in), when
//   `grandTotalLabel` is given.
// Ordered ascending by major head code (numeric).
// ─────────────────────────────────────────────────────────────
const groupStatement5Rows = (rows, { grandTotalLabel = null } = {}) => {
    const grouped = rows.reduce((acc, row) => {
        const key = [row.majorHead, row.subMajor, row.minorHead]
            .filter((p) => p && p !== "-")
            .join("-");

        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
    }, {});

    const leafGroups = Object.entries(grouped).map(([heads, groupedRows]) => {
        const total = groupedRows.reduce((sum, row) => sum + row.amount, 0);
        const [sample] = groupedRows;

        const levels = HEAD_CODE_LEVELS.reduce((acc, codeField, idx) => {
            const nameField = HEAD_NAME_LEVELS[idx];
            const raw = sample[codeField];
            const code = raw !== null && raw !== undefined ? String(raw).trim() : "";
            // FIX: only skip genuinely blank/"-" values now. A code of
            // "0" used to be treated the same as "blank" and dropped
            // entirely — now it's kept and displays as "0 - Null",
            // same as "00" already did.
            if (!code || code === "-") return acc;
            acc.push({ code, name: sample[nameField] || null });
            return acc;
        }, []);

        const matched = levels.length > 0 && levels.every((l) => l.name);

        return {
            heads,
            levels, // [{code,name}] up to 3 entries: major, sub, minor
            matched,
            rows: groupedRows,
            total: parseFloat(total.toFixed(2)),
            hasMultiple: groupedRows.length > 1,
        };
    });

    // Ascending numeric sort by MAJOR head code — groups with no
    // resolvable major code sort last (Infinity), then alphabetically
    // by their leaf key so ordering stays stable.
    const majorSortValue = (code) => {
        const n = parseInt(code, 10);
        return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
    };
    leafGroups.sort((a, b) => {
        const diff = majorSortValue(a.levels[0]?.code) - majorSortValue(b.levels[0]?.code);
        if (diff !== 0) return diff;
        return a.heads.localeCompare(b.heads);
    });

    // Expand into the tagged display-row list.
    const displayRows = [];
    let currentMajorCode = null;
    let currentSubCode = null;
    let majorTotal = 0;
    let majorLabel = null;
    let overallTotal = 0;

    const flushMajorTotal = () => {
        if (currentMajorCode !== null) {
            displayRows.push({
                type: "total",
                heads: `${currentMajorCode}-total`,
                headsLines: [`Total under Major Head ${majorLabel}`],
                total: parseFloat(majorTotal.toFixed(2)),
                matched: true,
            });
        }
    };

    for (const group of leafGroups) {
        const [major, sub, minor] = group.levels;
        const majorCode = major?.code ?? null;
        const majorName = major?.name ?? null;

        if (majorCode !== currentMajorCode) {
            flushMajorTotal();
            currentMajorCode = majorCode;
            currentSubCode = null;
            majorTotal = 0;
            majorLabel = majorCode ? `${majorCode} - ${majorName || "Null"}` : null;

            if (majorCode) {
                displayRows.push({
                    type: "major",
                    heads: `${majorCode}-header`,
                    headsLines: [majorLabel],
                    total: null,
                    matched: true,
                });
            }
        }

        const subCode = sub?.code ?? null;
        const subName = sub?.name ?? null;

        if (subCode) {
            if (subCode !== currentSubCode) {
                currentSubCode = subCode;
                displayRows.push({
                    type: "sub",
                    heads: `${majorCode}-${subCode}-header`,
                    headsLines: [`${subCode} - ${subName || "Null"}`],
                    total: null,
                    matched: true,
                });
            }
        } else {
            currentSubCode = null;
        }

        const minorCode = minor?.code ?? null;
        const minorName = minor?.name ?? null;
        const minorLabel = minorCode ? `${minorCode} - ${minorName || "Null"}` : (group.heads || "Unknown");

        displayRows.push({
            type: "minor",
            heads: group.heads,
            headsLines: [minorLabel],
            total: group.total,
            matched: group.matched,
            hasMultiple: group.hasMultiple,
            rows: group.rows,
        });

        majorTotal += group.total;
        overallTotal += group.total;
    }

    flushMajorTotal();

    if (grandTotalLabel) {
        displayRows.push({
            type: "grandTotal",
            heads: "grand-total",
            headsLines: [grandTotalLabel],
            total: parseFloat(overallTotal.toFixed(2)),
            matched: true,
        });
    }

    return displayRows;
};

// ─────────────────────────────────────────────────────────────
// COUNCIL — challan (majorHead 1-16) + challanFromBill (majorHead
// 1-16), merged into a single grouped list, with its own grand total.
// ─────────────────────────────────────────────────────────────
const STATEMENT5_COUNCIL_REVENUE_HEAD_MIN = 1;
const STATEMENT5_COUNCIL_REVENUE_HEAD_MAX = 16;

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
        `Statement5 [COUNCIL]: Fetched ${challanRows.length} Challan rows, ${cfbRows.length} ChallanFromBill rows`
    );

    const headsNameLookup = await getChallanHeadsNameMap();

    const mappedChallanRows = challanRows.map((row) =>
        mapStatement5ChallanRow(row, headsNameLookup)
    );
    const mappedCfbRows = cfbRows.map(mapStatement5ChallanFromBillRow);

    const revenueRangeRows = mappedChallanRows.filter((r) =>
        isHeadCodeInRange(r.majorHeadCode, STATEMENT5_COUNCIL_REVENUE_HEAD_MIN, STATEMENT5_COUNCIL_REVENUE_HEAD_MAX)
    );
    const cfbRangeRows = mappedCfbRows.filter((r) =>
        isHeadCodeInRange(r.majorHeadCode, STATEMENT5_COUNCIL_REVENUE_HEAD_MIN, STATEMENT5_COUNCIL_REVENUE_HEAD_MAX)
    );

    logger.info(
        `Statement5 [COUNCIL]: majorHead 1-16 — Challan: ${revenueRangeRows.length}, ChallanFromBill: ${cfbRangeRows.length}`
    );

    return groupStatement5Rows([...revenueRangeRows, ...cfbRangeRows], {
        grandTotalLabel: "Total Revenue Receipt - Council Sector",
    });
};

// ─────────────────────────────────────────────────────────────
// Main Statement 5 function.
// COUNCIL: challan(1-16) + challanFromBill(1-16), merged, own grand total.
// STATE: stateChallan, majorHead 2011-3999, own grand total.
// CONSOLIDATED: Council's grouped result (already carries the Council
// grand total) + State's grouped result (already carries the State
// grand total), concatenated — so both totals show up automatically.
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
            const stateChallanRows = await getStatement5StateChallanRows(dateRange);
            const result = groupStatement5Rows(stateChallanRows, {
                grandTotalLabel: "Total Revenue Receipt - State Sector",
            });
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
            const stateResult = groupStatement5Rows(stateChallanRows, {
                grandTotalLabel: "Total Revenue Receipt - State Sector",
            });
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
// Only shown when sector === "STATE". Excluded from CONSOLIDATED
// (always nil, so no point cluttering that view).
//
// COUNCIL: date-filtered by financial year:
//   - Balance outstanding on 1st April = CUMULATIVE net position
//     up to (not including) the start of the selected FY:
//       cumulative Expenditure.grossAmount (sector=COUNCIL,
//       minorHead 6610101/6610201, voucherDate < FY start)
//     MINUS
//       cumulative Challan.amount (majorHead 6610101/6610201,
//       challanType COUNCIL, challanDate < FY start)
//       + challanFromBill.amount (amountType "Building Loan" /
//       "Car Loan", sector COUNCIL, voucharDate < FY start)
//     This is intentionally NOT a fixed "previous year" or
//     "previous 2 years" window — it's the running total since
//     inception, so it always equals whatever the previous FY's
//     closing balance worked out to, however many years of data
//     exist. (opening(n) = paid_before(n) - recovered_before(n),
//     and by induction this equals closing(n-1). See chat note.)
//   - Amount Paid during the year = same query, but the SELECTED
//     (current) financial year window.
//   - Amount Repaid during the year = Challan.amount (majorHead
//     6610101/6610201, challanType COUNCIL, current FY) +
//     challanFromBill.amount (amountType "Building Loan" for the
//     house row / "Car Loan" for the car row, sector COUNCIL,
//     current FY).
//   - Balance outstanding on 31 March = opening + paid - repaid
//   - Net Increase(+)/Decrease(-) = closing - opening, i.e. paid - repaid
//
// CONSOLIDATED: COUNCIL's 2 rows only (STATE excluded — always nil).
//
// Reuses getDateRangeFromParams, already defined once elsewhere in
// this file (Statement 5 / Statement 2 sections). shiftYear is no
// longer needed here since opening balance is now an open-ended
// "before FY start" cumulative query instead of a shifted window —
// left other shiftYear usages elsewhere in the file untouched.
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

// ── COUNCIL — financial-year-based rule, cumulative opening balance ──
const buildStatement4CouncilRows = async (currentDateRange) => {
    // NOTE: assumes getDateRangeFromParams(...) returns an object with a
    // `gte` key marking the FY start (the standard shape used elsewhere
    // in this file for prisma date filters, e.g. `{ gte, lte }`). If your
    // helper uses a different key (e.g. `gt`/`from`), swap it below —
    // `fyStart` just needs to be the Date the selected FY begins.
    const fyStart = currentDateRange?.gte;

    const beforeFyStartFilter = fyStart ? { lt: fyStart } : undefined;

    const [
        openingExpenditureRows,
        openingChallanRows,
        openingCfbRows,
        currentExpenditureRows,
        currentChallanRows,
        currentCfbRows,
    ] = await Promise.all([
        // cumulative "paid" up to (not including) FY start
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(beforeFyStartFilter ? { voucherDate: beforeFyStartFilter } : {}),
            },
            select: { grossAmount: true, minorHead: true },
        }),
        // cumulative "recovered via challan" up to FY start
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...(beforeFyStartFilter ? { challanDate: beforeFyStartFilter } : {}),
            },
            select: { amount: true, majorHead: true },
        }),
        // cumulative "recovered via challanFromBill" up to FY start
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: { in: ["Building Loan", "Car Loan"] },
                ...(beforeFyStartFilter ? { voucharDate: beforeFyStartFilter } : {}),
            },
            select: { amount: true, amountType: true },
        }),
        // current-FY paid
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(currentDateRange ? { voucherDate: currentDateRange } : {}),
            },
            select: { grossAmount: true, minorHead: true },
        }),
        // current-FY recovered via challan
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...(currentDateRange ? { challanDate: currentDateRange } : {}),
            },
            select: { amount: true, majorHead: true },
        }),
        // current-FY recovered via challanFromBill
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
        const openingPaid = openingExpenditureRows
            .filter((r) => isStatement4HeadCode(r.minorHead, headCode))
            .reduce((s, r) => s + safeNum(r.grossAmount), 0);

        const openingRecovered =
            openingChallanRows
                .filter((r) => isStatement4HeadCode(r.majorHead, headCode))
                .reduce((s, r) => s + safeNum(r.amount), 0) +
            openingCfbRows
                .filter((r) => r.amountType === cfbAmountType)
                .reduce((s, r) => s + safeNum(r.amount), 0);

        const openingBalance = openingPaid - openingRecovered;

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
        buildRow(
            "6610101 - House Building Advances to Autonomous Council Employees",
            STATEMENT4_MINOR_HEAD_HOUSE,
            "Building Loan"
        ),
        buildRow(
            "6610201 - Motor Car Advances",
            STATEMENT4_MINOR_HEAD_CAR,
            "Car Loan"
        ),
    ];
};

export const getStatement4Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 4 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const currentDateRange = getDateRangeFromParams(from, to);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        let rawRows = [];

        if (isStateSector) {
            rawRows = await buildStatement4StateRows();
        } else if (isCouncilSector) {
            rawRows = await buildStatement4CouncilRows(currentDateRange);
        } else if (isConsolidated) {
            // STATE side is always nil for this statement — omit it from
            // the consolidated view entirely (previously showed 2 zero rows).
            rawRows = await buildStatement4CouncilRows(currentDateRange);
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
// STATE:   grouped by majorHead ONLY, majorHead 4001–5999, label
//          resolved via getMajorHeadNameMap (major-code -> name).
// COUNCIL: grouped by majorHead ONLY, majorHead 440–443, label
//          resolved via getMajorHeadNameMap.
// CONSOLIDATED: union of the COUNCIL row set + the STATE row set
//          (each computed with its own sector's rules above).
//
// PREVIOUS YEAR column = the TWO financial years before the
// selected one, merged together (e.g. selecting FY 2025-2026 shows
// FY 2023-2024 + FY 2024-2025 combined in one "Previous Year"
// figure). Because financial years run Apr->Mar back-to-back, two
// consecutive FYs are one continuous date range, so this is a
// single query with a wider window — not two queries summed.
//
// CURRENT YEAR column = the selected from/to as-is.
// TOTAL = previousYear + currentYear.
//
// Date filtering uses voucherDate range (from/to).
// ─────────────────────────────────────────────────────────────

// Shifts a "YYYY-MM-DD" string by `delta` whole years (e.g. -1, -2),
// keeping month/day fixed.
const shiftYear = (dateStr, delta) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCFullYear(d.getUTCFullYear() + delta);
    return d.toISOString().slice(0, 10);
};

// Builds an Indian financial-year label ("2025-2026") from a from/to
// date pair. Assumes from/to were chosen as a financial-year window
// (Apr 1 -> Mar 31). Falls back gracefully if only one bound exists.
const getFinancialYearLabel = (from, to) => {
    const fromYear = from ? new Date(`${from}T00:00:00.000Z`).getUTCFullYear() : null;
    const toYear = to ? new Date(`${to}T00:00:00.000Z`).getUTCFullYear() : null;

    if (fromYear && toYear) {
        return fromYear === toYear ? `${fromYear}` : `${fromYear}-${toYear}`;
    }
    if (fromYear) return `${fromYear}`;
    if (toYear) return `${toYear}`;
    return "Current Period";
};

// Label for the merged two-FY "previous year" window, e.g.
// "2023-2024 & 2024-2025".
const getMergedPreviousLabel = (from, to) => {
    const oneYearAgoLabel = getFinancialYearLabel(shiftYear(from, -1), shiftYear(to, -1));
    const twoYearsAgoLabel = getFinancialYearLabel(shiftYear(from, -2), shiftYear(to, -2));
    if (twoYearsAgoLabel === "Current Period" || oneYearAgoLabel === "Current Period") {
        return "Previous Period";
    }
    return `${twoYearsAgoLabel} & ${oneYearAgoLabel}`;
};

// ── Major-only name lookup against Heads ────────────────────────
// Both STATE and COUNCIL rows in Statement 2 only ever need a
// majorHead code -> name mapping (no sub-levels), so this is a
// simple code -> name map, not a full-chain match.
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

// Shared builder — one sector, two windows (previous = merged 2 FYs,
// current = selected FY), grouped by majorHead code only.
const buildMajorHeadRows = async ({ sector, currentDateRange, previousDateRange, minCode, maxCode }) => {
    const isInRange = (majorHead) => {
        if (!majorHead) return false;
        const num = parseInt(majorHead, 10);
        return !Number.isNaN(num) && num >= minCode && num <= maxCode;
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
                sector,
                ...(currentDateRange ? { voucherDate: currentDateRange } : {}),
            },
            select: selectFields,
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector,
                // previousDateRange spans BOTH prior financial years merged
                ...(previousDateRange ? { voucherDate: previousDateRange } : {}),
            },
            select: selectFields,
        }),
    ]);

    const currentCapital = currentExpenditures.filter((item) => isInRange(item.majorHead));
    const previousCapital = previousExpenditures.filter((item) => isInRange(item.majorHead));

    logger.info(
        `[STATEMENT2] ${sector} capital expenditure rows — current: ${currentCapital.length}, previous (2 FYs merged): ${previousCapital.length}`
    );

    const majorHeadNameMap = await getMajorHeadNameMap(sector);

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

// STATE: majorHead 4001–5999
const buildStateRows = (currentDateRange, previousDateRange) =>
    buildMajorHeadRows({ sector: "STATE", currentDateRange, previousDateRange, minCode: 4001, maxCode: 5999 });

// COUNCIL: majorHead 440–443
const buildCouncilRows = (currentDateRange, previousDateRange) =>
    buildMajorHeadRows({ sector: "COUNCIL", currentDateRange, previousDateRange, minCode: 440, maxCode: 443 });

export const getStatement2Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 2 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const currentDateRange = getDateRangeFromParams(from, to);

        // Previous window = the two FYs immediately before the selected
        // one, merged into a single continuous range:
        //   selected FY 2025-2026 (2025-04-01 -> 2026-03-31)
        //   -> previous window: 2023-04-01 (shiftYear(from,-2))
        //                    -> 2025-03-31 (shiftYear(to,-1))
        //      which is exactly FY2023-2024 + FY2024-2025 back to back.
        const previousFrom = shiftYear(from, -2);
        const previousTo = shiftYear(to, -1);
        const previousDateRange = getDateRangeFromParams(previousFrom, previousTo);

        const currentFyLabel = getFinancialYearLabel(from, to);
        const previousFyLabel = getMergedPreviousLabel(from, to);

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

        const grandTotalPreviousYear = rows.reduce((sum, r) => sum + Number(r.previousYear), 0);
        const grandTotalCurrentYear = rows.reduce((sum, r) => sum + Number(r.currentYear), 0);
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
            period: {
                current: currentFyLabel,
                previous: previousFyLabel,
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
// Always exactly TWO rows, for every sector (STATE / COUNCIL /
// CONSOLIDATED): "Loan from Governments" and "Loan from Other Sources".
//
// COUNCIL:
//   - Receipts: challan table, subMajor = 66001 -> Loan from Governments,
//     subMajor = 66002 -> Loan from Other Sources.
//     (Scoped to challanType = "COUNCIL", matching this file's existing
//     convention for council-scoped challan queries — flag if this
//     scoping should be dropped.)
//   - Repayments: Expenditure table, sector = COUNCIL —
//     loanRepayGovt -> Loan from Governments, loanRepayOther -> Loan
//     from Other Sources.
//
// STATE:
//   - Receipts: state_challans table, sector = STATE, majorHead = 7610
//     -> Loan from Other Sources. Loan from Governments has no receipt
//     source for STATE, so it's nil (0).
//   - Repayments: Expenditure table, sector = STATE — loanRepayGovt ->
//     Loan from Governments, loanRepayOther -> Loan from Other Sources.
//
// CONSOLIDATED: COUNCIL + STATE added together, still exactly 2 rows
// (not 4) — "Loan from Governments" combines both sectors' govt
// receipts/repayments, same for "Loan from Other Sources".
//
// Balance of 1st April: nil (0) for every row, every sector, every
// period — no opening-balance source exists for this table.
// Balance of 31st March = April balance + Receipts - Repayments.
// Net Increase/Decrease = (31st March balance) - (1st April balance),
// shown with an explicit "+" prefix when >= 0, and the native "-" sign
// when negative.
// ─────────────────────────────────────────────────────────────

const parseIntHead = (v) => parseInt(v, 10);

// ── COUNCIL receipts: challan.subMajorHead 66001 / 66002 ──────────
// NOTE: Challan's field is `subMajorHead` (String, non-nullable) — not
// `subMajor`. `subMajor` only exists on the separate `challanFromBill`
// model, which is unrelated to this query.
const getCouncilLoanReceipts = async (dateRange) => {
    const challans = await prisma.challan.findMany({
        where: {
            isActive: true,
            challanType: "COUNCIL",
            ...(dateRange ? { challanDate: dateRange } : {}),
        },
        select: { amount: true, subMajorHead: true },
    });

    const govtReceipts = challans
        .filter((c) => parseIntHead(c.subMajorHead) === 66001)
        .reduce((s, c) => s + Number(c.amount ?? 0), 0);

    const otherReceipts = challans
        .filter((c) => parseIntHead(c.subMajorHead) === 66002)
        .reduce((s, c) => s + Number(c.amount ?? 0), 0);

    return { govtReceipts, otherReceipts };
};

// ── COUNCIL repayments: Expenditure.loanRepayGovt / loanRepayOther ──
const getCouncilLoanRepayments = async (dateRange) => {
    const expenditures = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "COUNCIL",
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { loanRepayGovt: true, loanRepayOther: true },
    });

    const govtRepayments = expenditures.reduce(
        (s, e) => s + Number(e.loanRepayGovt ?? 0),
        0
    );
    const otherRepayments = expenditures.reduce(
        (s, e) => s + Number(e.loanRepayOther ?? 0),
        0
    );

    return { govtRepayments, otherRepayments };
};

// ── STATE receipts: state_challans majorHead 7610 -> Other Sources; ──
// ── Loan from Governments has no source for STATE -> always 0. ──────
const getStateLoanReceipts = async (dateRange) => {
    const rows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
            ...(dateRange ? { challanDate: dateRange } : {}),
        },
        select: { totalAmount: true, majorHead: true },
    });

    const otherReceipts = rows
        .filter((r) => parseIntHead(r.majorHead) === 7610)
        .reduce((s, r) => s + Number(r.totalAmount ?? 0), 0);

    const govtReceipts = 0;

    return { govtReceipts, otherReceipts };
};

// ── STATE repayments: Expenditure.loanRepayGovt / loanRepayOther ────
const getStateLoanRepayments = async (dateRange) => {
    const expenditures = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { loanRepayGovt: true, loanRepayOther: true },
    });

    const govtRepayments = expenditures.reduce(
        (s, e) => s + Number(e.loanRepayGovt ?? 0),
        0
    );
    const otherRepayments = expenditures.reduce(
        (s, e) => s + Number(e.loanRepayOther ?? 0),
        0
    );

    return { govtRepayments, otherRepayments };
};

// Builds one row: opening balance is always nil (0); closing = opening +
// receipts - repayments; net change shows an explicit "+" prefix when
// >= 0, native "-" sign when negative.
const buildLoanRow = (natureDept, receipts, repayments) => {
    const openingBalance = 0; // nil, every period, every row — per spec
    const closingBalance = openingBalance + receipts - repayments;
    const netChange = closingBalance - openingBalance;
    const increaseDecrease =
        netChange >= 0 ? `+${netChange.toFixed(2)}` : netChange.toFixed(2);

    return {
        natureDept,
        april: openingBalance.toFixed(2),
        receipts: receipts.toFixed(2),
        repayments: repayments.toFixed(2),
        march: closingBalance.toFixed(2),
        increaseDecrease,
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

        let govtReceipts = 0;
        let otherReceipts = 0;
        let govtRepayments = 0;
        let otherRepayments = 0;

        if (isStateSector) {
            const [receiptsData, repaymentsData] = await Promise.all([
                getStateLoanReceipts(dateRange),
                getStateLoanRepayments(dateRange),
            ]);
            govtReceipts = receiptsData.govtReceipts;
            otherReceipts = receiptsData.otherReceipts;
            govtRepayments = repaymentsData.govtRepayments;
            otherRepayments = repaymentsData.otherRepayments;
        } else if (isCouncilSector) {
            const [receiptsData, repaymentsData] = await Promise.all([
                getCouncilLoanReceipts(dateRange),
                getCouncilLoanRepayments(dateRange),
            ]);
            govtReceipts = receiptsData.govtReceipts;
            otherReceipts = receiptsData.otherReceipts;
            govtRepayments = repaymentsData.govtRepayments;
            otherRepayments = repaymentsData.otherRepayments;
        } else if (isConsolidated) {
            const [councilReceipts, councilRepayments, stateReceipts, stateRepayments] =
                await Promise.all([
                    getCouncilLoanReceipts(dateRange),
                    getCouncilLoanRepayments(dateRange),
                    getStateLoanReceipts(dateRange),
                    getStateLoanRepayments(dateRange),
                ]);

            govtReceipts = councilReceipts.govtReceipts + stateReceipts.govtReceipts;
            otherReceipts = councilReceipts.otherReceipts + stateReceipts.otherReceipts;
            govtRepayments = councilRepayments.govtRepayments + stateRepayments.govtRepayments;
            otherRepayments = councilRepayments.otherRepayments + stateRepayments.otherRepayments;
        } else {
            logger.info(
                `Statement3 Debt: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        const rows = [
            buildLoanRow("Loan from Governments", govtReceipts, govtRepayments),
            buildLoanRow("Loan from Other Sources", otherReceipts, otherRepayments),
        ].map((r, idx) => ({ id: idx + 1, ...r }));

        const totalRaw = rows.reduce(
            (acc, r) => ({
                april: acc.april + Number(r.april),
                receipts: acc.receipts + Number(r.receipts),
                repayments: acc.repayments + Number(r.repayments),
                march: acc.march + Number(r.march),
                // Number() parses a leading "+" fine (Number("+123.00") === 123),
                // so this works whether the row's increaseDecrease was
                // formatted with a "+" or a native "-".
                increaseDecrease: acc.increaseDecrease + Number(r.increaseDecrease),
            }),
            { april: 0, receipts: 0, repayments: 0, march: 0, increaseDecrease: 0 }
        );

        const formatSigned = (n) => (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

        return {
            rows,
            total: {
                april: totalRaw.april.toFixed(2),
                receipts: totalRaw.receipts.toFixed(2),
                repayments: totalRaw.repayments.toFixed(2),
                march: totalRaw.march.toFixed(2),
                increaseDecrease: formatSigned(totalRaw.increaseDecrease),
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
// COUNCIL:
//   - Receipt: challanFromBill, majorHead IN (001,007,013,661,664),
//     sector IN (STATE, COUNCIL) — all matching rows, no further filter,
//     PLUS all Challan rows where challanType = COUNCIL (no majorHead
//     restriction, every row counted).
//   - Disbursement: all Expenditure entries where sector = COUNCIL.
//
// STATE:
//   - Receipt: all state_challans entries (sector = STATE).
//   - Disbursement: all Expenditure entries where sector = STATE.
//
// CONSOLIDATED: Receipt/Disbursement = STATE + COUNCIL merged monthly
// (additive), same as before.
//
// Opening Balance (April, month 1) — TEMPORARY hard-coded value for
// every sector, INCLUDING CONSOLIDATED:
//   3066841548 + 19103055 = WAYS_AND_MEANS_APRIL_OPENING_BALANCE
// This is the same single figure for STATE, COUNCIL, and CONSOLIDATED —
// CONSOLIDATED does NOT sum/double it across sectors. To be replaced
// with a real per-sector/DB-driven value later.
// Every month after April carries forward the previous month's closing
// balance, same as before.
// Closing Balance = Opening Balance + Receipt - Disbursement.
//
// The bottom "Total" row shows the FY's Opening Balance (April's
// opening balance) rather than 0/blank, plus the sum of Receipt and
// Disbursement across all 12 months and the final month's Closing
// Balance.
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

// TEMPORARY hard-coded April opening balance — see comment block above.
const WAYS_AND_MEANS_APRIL_OPENING_BALANCE = 3066841548 + 19103055;

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

// ── STATE monthly receipt/disbursement maps ──────────────────────
// Receipt = all state_challans rows (sector = STATE), no majorHead
// restriction. Disbursement = all Expenditure rows (sector = STATE),
// no field-level restriction — just grossAmount summed.
const buildStateWaysAndMeansMonthlyMaps = async (dateRange) => {
    const [stateChallans, expenditures] = await Promise.all([
        prisma.stateChallan.findMany({
            where: {
                sector: "STATE",
                ...(dateRange ? { challanDate: dateRange } : {}),
            },
            select: { challanDate: true, totalAmount: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { voucherDate: true, grossAmount: true },
        }),
    ]);

    const receiptByMonth = sumByMonth(stateChallans, "challanDate", "totalAmount");
    const disbursementByMonth = sumByMonth(expenditures, "voucherDate", "grossAmount");

    return { receiptByMonth, disbursementByMonth };
};

// ── COUNCIL monthly receipt/disbursement maps ─────────────────────
// Receipt = challanFromBill rows with majorHead IN (001,007,013,661,664)
// and sector IN (STATE, COUNCIL) — every matching row counted, no
// amountType filter — PLUS all Challan rows where challanType = COUNCIL
// (no majorHead restriction, every row counted). Disbursement = all
// Expenditure rows (sector = COUNCIL), grossAmount summed.
//
// Because CONSOLIDATED merges this map with STATE's (see
// getStatement3WaysAndMeansData below), the Challan/COUNCIL rows added
// here automatically flow into CONSOLIDATED's receipt total too — no
// separate wiring needed there.
const COUNCIL_WAM_MAJOR_HEADS = ["001", "007", "013", "661", "664"];

const isCouncilWamMajorHead = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    if (Number.isNaN(num)) return false;
    return COUNCIL_WAM_MAJOR_HEADS.some((code) => parseInt(code, 10) === num);
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

    const cfbFiltered = challanFromBills.filter((c) => isCouncilWamMajorHead(c.majorHead));
    const cfbReceiptByMonth = sumByMonth(cfbFiltered, "voucharDate", "amount");
    // Challan.amount is a String field — sumByMonth's Number(r[amountField] ?? 0)
    // already coerces it fine, same as the rest of this file does elsewhere.
    const challanReceiptByMonth = sumByMonth(challans, "challanDate", "amount");
    const receiptByMonth = mergeMonthlyMaps(cfbReceiptByMonth, challanReceiptByMonth);

    const disbursementByMonth = sumByMonth(expenditures, "voucherDate", "grossAmount");

    return { receiptByMonth, disbursementByMonth };
};

export const getStatement3WaysAndMeansData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 3 Ways & Means for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const dateRange = getDateRangeFromParams(from, to);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

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
            disbursementByMonth = mergeMonthlyMaps(
                stateMaps.disbursementByMonth,
                councilMaps.disbursementByMonth
            );
        } else {
            logger.info(
                `Statement3 Ways & Means: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        // ── Build rows with carry-forward logic ─────────────────────
        // April's opening balance is the fixed hard-coded figure for
        // EVERY sector — including CONSOLIDATED, which does NOT sum
        // STATE's + COUNCIL's opening balances (see comment block above
        // WAYS_AND_MEANS_APRIL_OPENING_BALANCE). Every subsequent month
        // carries forward the previous month's closing balance.
        let carryForward = 0;
        let totalReceipt = 0;
        let totalDisbursement = 0;

        const rows = FY_MONTHS.map(({ month, num }, index) => {
            const openingBalance =
                index === 0 ? WAYS_AND_MEANS_APRIL_OPENING_BALANCE : carryForward;

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

        // ── Bottom total row ─────────────────────────────────────
        // openingBalance = the FY's starting balance (April's opening
        // balance), NOT a sum of all 12 opening balances (that figure
        // isn't meaningful since each month after April is just a
        // carry-forward of the previous month's closing balance).
        // receipt/disbursement = summed across all 12 months.
        // closingBalance = the final month's (March's) running balance,
        // which is already the cumulative net position.
        rows.push({
            monthNum: null,
            month: "Total",
            openingBalance: WAYS_AND_MEANS_APRIL_OPENING_BALANCE.toFixed(2),
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