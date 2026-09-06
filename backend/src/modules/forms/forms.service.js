import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// Build a { from, to } Date range directly from raw from/to date strings
// (replaces the old FY-based getFyRange(year) call)
function getDateRangeFromParams(from, to) {
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

// ─────────────────────────────────────────────────────────────
// SHARED HEAD-CODE NAME-RESOLUTION HELPERS
// Used by both Form 4 and Form 5A below — declared ONCE here to
// avoid the duplicate-identifier crash from before.
// ─────────────────────────────────────────────────────────────

// "004" -> "4", "0000" -> "0", "" / null / undefined -> ""
const normalizeCodeSegment = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (str === "") return "";
    return /^\d+$/.test(str) ? String(parseInt(str, 10)) : str;
};

const STATE_HEAD_CODE_LEVELS = [
    "majorHeadCode",
    "subMajorCode",
    "minorHeadCode",
    "subHeadCode",
    "subSubHeadCode",
    "detailHeadCode",
    "subDetailHeadCode",
];

const buildFullChainKey = (codes) =>
    STATE_HEAD_CODE_LEVELS.map((level) => normalizeCodeSegment(codes[level])).join("|");

// ── ChallanHeads (used ONLY for the plain `challan` table) ─────────────
// Codes there repeat across branches (e.g. "01" appears under many
// different majors), so lookups are done PARENT-AWARE via the
// *ParentCode columns, not a flat/global key.
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
        `Loaded ChallanHeads lookup — majors: ${majorMap.size}, subMajors: ${subMajorMap.size}, minors: ${minorMap.size}`
    );

    return { majorMap, subMajorMap, minorMap };
};

// ── Heads — full 7-level exact-chain match (used ONLY for stateChallan
// in Form 4, which needs subHead/subSubHead/detailHead/subDetailHead
// too) ──────────────────────────────────────────────────────────────
// A stateChallan row's chain only makes sense matched as one identity
// against a single Heads row sharing the same value in every column —
// short codes like "2" or "800" repeat across many different chains,
// so a flat per-level lookup would produce wrong matches.
const getHeadsFullChainMap = async (sector) => {
    const where = { isActive: true };
    if (sector) where.sector = sector;

    const rows = await prisma.heads.findMany({ where });

    const map = new Map();
    for (const row of rows) {
        const key = buildFullChainKey({
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
        `Loaded Heads full-chain lookup — ${map.size} entries for sector: ${sector ?? "ALL"}`
    );

    return map;
};

// ── Heads — 3-level match (used for challanTwo / challanFromBill in
// Form 4, and for stateChallan/challanFromBill in Form 5A — both only
// ever populate major/subMajor/minor) ───────────────────────────────
const getHeads3LevelMap = async () => {
    const rows = await prisma.heads.findMany({ where: { isActive: true } });

    const map = new Map();
    for (const row of rows) {
        const key = [
            normalizeCodeSegment(row.majorHeadCode),
            normalizeCodeSegment(row.subMajorCode),
            normalizeCodeSegment(row.minorHeadCode),
        ].join("|");
        if (!map.has(key)) {
            map.set(key, {
                majorHeadName: row.majorHead ?? null,
                subMajorName: row.subMajor ?? null,
                minorHeadName: row.minorHead ?? null,
            });
        }
    }

    logger.info(`Loaded Heads 3-level lookup — ${map.size} entries`);

    return map;
};

// ─────────────────────────────────────────────────────────────
// Classification builders — each returns an array of
// { level, code, name } lines — code alone when unresolved, code +
// name when a match is found — so the frontend can render one line
// per head level, vertically.
// ─────────────────────────────────────────────────────────────

const isZeroCode = (code) => {
    if (code === null || code === undefined) return false;
    const trimmed = String(code).trim();
    return trimmed !== "" && /^0+$/.test(trimmed);
};

const buildClassificationLines = (parts) =>
    parts
        .filter((p) => p.code && p.code !== "-")
        .map((p) => ({
            level: p.level,
            code: p.code,
            name: isZeroCode(p.code) ? "Null" : (p.name || null),
        }));

// challan → resolves via ChallanHeads (parent-aware)
// Takes plain major/subMajor/minor values (works for both Form 4's
// `row` fields and Form 5A's row fields — call with the 3 raw values).
const buildChallanClassification = (majorHead, subMajor, minorHead, { majorMap, subMajorMap, minorMap }) => {
    const majorCode = normalizeCodeSegment(majorHead);
    const subMajorCode = normalizeCodeSegment(subMajor);
    const minorCode = normalizeCodeSegment(minorHead);

    return buildClassificationLines([
        { level: "major", code: majorHead, name: majorCode ? majorMap.get(majorCode) : null },
        {
            level: "subMajor",
            code: subMajor,
            name: subMajorCode ? subMajorMap.get(`${majorCode}|${subMajorCode}`) : null,
        },
        {
            level: "minor",
            code: minorHead,
            name: minorCode ? minorMap.get(`${subMajorCode}|${minorCode}`) : null,
        },
    ]);
};

// challanTwo / challanFromBill / stateChallan(Form5A) → resolves via
// Heads (3-level match)
const buildThreeLevelClassification = (major, subMajor, minor, heads3LevelMap) => {
    const key = [
        normalizeCodeSegment(major),
        normalizeCodeSegment(subMajor),
        normalizeCodeSegment(minor),
    ].join("|");
    const names = heads3LevelMap.get(key) ?? {};

    return buildClassificationLines([
        { level: "major", code: major, name: names.majorHeadName },
        { level: "subMajor", code: subMajor, name: names.subMajorName },
        { level: "minor", code: minor, name: names.minorHeadName },
    ]);
};

// stateChallan (Form4 only) → resolves via Heads (full 7-level chain match)
const buildStateChallanClassification = (row, headsFullChainMap) => {
    const key = buildFullChainKey({
        majorHeadCode: row.majorHead,
        subMajorCode: row.subMajorHead,
        minorHeadCode: row.minorHead,
        subHeadCode: row.subHead,
        subSubHeadCode: row.subSubHead,
        detailHeadCode: row.detailHead,
        subDetailHeadCode: row.subDetailHead,
    });
    const names = headsFullChainMap.get(key) ?? {};

    return buildClassificationLines([
        { level: "major", code: row.majorHead, name: names.majorHeadName },
        { level: "subMajor", code: row.subMajorHead, name: names.subMajorName },
        { level: "minor", code: row.minorHead, name: names.minorHeadName },
        { level: "subHead", code: row.subHead, name: names.subHeadName },
        { level: "subSubHead", code: row.subSubHead, name: names.subSubHeadName },
        { level: "detailHead", code: row.detailHead, name: names.detailHeadName },
        { level: "subDetailHead", code: row.subDetailHead, name: names.subDetailHeadName },
    ]);
};





// ═════════════════════════════════════════════════════════════
// FORM 4 - Register of Remittances to Treasury (PLA)
// ...
// ═════════════════════════════════════════════════════════════

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

// ─────────────────────────────────────────────────────────────
// Amount Remitted majorHead range: 001–016, plus 661 and 664.
// Used for COUNCIL / CONSOLIDATED "amount remitted" pulls from
// Challan + challanFromBill (sectors COUNCIL + STATE).
// ─────────────────────────────────────────────────────────────
const AMOUNT_REMITTED_MAJOR_HEADS = [
    ...Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(3, "0")), // 001..016
    "661",
    "664",
];

// Same financial-year window Cashbook uses (April 1 → March 31).
function getFyRange(year) {
    const from = new Date(Date.UTC(year, 3, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year + 1, 2, 31, 23, 59, 59, 999));
    return { from, to };
}

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

    const challanHeadsMap = await getChallanHeadsNameMap();

    return rows.map((row) => ({
        id: `challan-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.challanDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildChallanClassification(
            row.majorHead,
            row.subMajorHead,
            row.minorHead,
            challanHeadsMap
        ),
        remarks: row.remarks ?? "-",
        sector: row.challanType ?? null,
        source: "challan",
    }));
};

const getForm4ChallanTwoRows = async (sector, dateRange, heads3LevelMap) => {
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
        classification: buildThreeLevelClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead,
            heads3LevelMap
        ),
        remarks: row.narration ?? "-",
        sector: row.sector ?? null,
        source: "challanTwo",
    }));
};

const getForm4ChallanFromBillRows = async (sector, dateRange, heads3LevelMap) => {
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
        classification: buildThreeLevelClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead,
            heads3LevelMap
        ),
        remarks: row.amountType ?? "-",
        sector: row.sector ?? null,
        source: "challanFromBill",
    }));
};

// ─────────────────────────────────────────────────────────────
// NEW: "Amount Remitted" pull for COUNCIL / CONSOLIDATED.
// Pulls Challan + challanFromBill rows for the given sectors
// (e.g. ["COUNCIL", "STATE"]) whose majorHead falls in
// AMOUNT_REMITTED_MAJOR_HEADS (001-016, 661, 664).
// No amountType restriction, no ChallanTwo — this replaces the
// old ALLOWED_AMOUNT_TYPES-based ChallanFromBill fetch and the
// amountType-based cross-sector helper for these two sectors.
// ─────────────────────────────────────────────────────────────
const getForm4RemittanceChallanRows = async (sectors, dateRange) => {
    const where = {
        isActive: true,
        challanType: { in: sectors },
        majorHead: { in: AMOUNT_REMITTED_MAJOR_HEADS },
    };

    if (dateRange) {
        where.challanDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challan.findMany({ where });

    logger.info(
        `Fetched ${rows.length} rows from Challan table (amount-remitted, majorHead-filtered) for sectors: ${sectors.join(",")}`
    );

    const challanHeadsMap = await getChallanHeadsNameMap();

    return rows.map((row) => ({
        id: `challan-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.challanDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildChallanClassification(
            row.majorHead,
            row.subMajorHead,
            row.minorHead,
            challanHeadsMap
        ),
        remarks: row.remarks ?? "-",
        sector: row.challanType ?? null,
        source: "challan",
    }));
};

const getForm4RemittanceChallanFromBillRows = async (sectors, dateRange, heads3LevelMap) => {
    const where = {
        isActive: true,
        sector: { in: sectors },
        majorHead: { in: AMOUNT_REMITTED_MAJOR_HEADS },
    };

    if (dateRange) {
        where.voucharDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Fetched ${rows.length} rows from ChallanFromBill table (amount-remitted, majorHead-filtered) for sectors: ${sectors.join(",")}`
    );

    return rows.map((row) => ({
        id: `challanFromBill-${row.id}`,
        clnNo: row.challanNo ?? "-",
        date: row.voucharDate ?? row.createdAt,
        treasury: row.treasuryCode ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        refItemNo: row.treasuryChallanNo ?? "-",
        classification: buildThreeLevelClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead,
            heads3LevelMap
        ),
        remarks: row.amountType ?? "-",
        sector: row.sector ?? null,
        source: "challanFromBill",
    }));
};

// ─────────────────────────────────────────────────────────────
// StateChallan rows (STATE sector) — Amount is stored in lakhs →
// multiply by 100000. isActive check: StateChallan has no isActive
// field in the schema above, so we filter by sector = "STATE" only.
// If you add isActive to the model later, add it to `where`.
// ─────────────────────────────────────────────────────────────
const getForm4StateChallanRows = async (dateRange) => {
    const where = {
        sector: "STATE",
    };

    if (dateRange) {
        where.challanDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.stateChallan.findMany({
        where,
        orderBy: { challanDate: "asc" },
    });

    logger.info(`Fetched ${rows.length} rows from StateChallan table`);

    const headsFullChainMap = await getHeadsFullChainMap("STATE");

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
        classification: buildStateChallanClassification(row, headsFullChainMap),
        remarks: row.remarks ?? "-",
        sector: "STATE",
        source: "stateChallan",
    }));
};

// ─────────────────────────────────────────────────────────────
// Main Form 4 function — "Amount Remitted" rules
//
// SECTOR RULES:
// - sector === "STATE"        → StateChallan ONLY — UNCHANGED
// - sector === "COUNCIL"      → Challan + challanFromBill where
//                                 majorHead IN (001-016, 661, 664)
//                                 and sector IN (COUNCIL, STATE).
//                                 (ChallanTwo dropped for this sector.)
// - sector === "CONSOLIDATED" → same Challan + challanFromBill pull
//                                 as COUNCIL above (sectors COUNCIL,
//                                 STATE, majorHead-filtered)
//                                 + all StateChallan rows.
//                                 (ChallanTwo dropped here too.)
// - any other sector          → UNCHANGED: Challan + ChallanTwo +
//                                 ChallanFromBill (ALLOWED_AMOUNT_TYPES,
//                                 that sector only), no StateChallan.
// ─────────────────────────────────────────────────────────────
export const getForm4Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Form 4 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidatedSector = sector === "CONSOLIDATED";

        const dateRange = getDateRangeFromParams(from, to);

        let allRows = [];

        if (isStateSector) {
            // ── STATE sector: ONLY StateChallan table ──
            logger.info(
                `Form4: sector=STATE → skipping Challan, ChallanTwo & ChallanFromBill, using StateChallan only`
            );
            allRows = await getForm4StateChallanRows(dateRange);
        } else if (isCouncilSector || isConsolidatedSector) {
            // ── COUNCIL / CONSOLIDATED: majorHead-based Amount Remitted ──
            const heads3LevelMap = await getHeads3LevelMap();
            const remittanceSectors = ["COUNCIL", "STATE"];

            const [remittanceChallanRows, remittanceChallanFromBillRows, stateChallanRows] =
                await Promise.all([
                    getForm4RemittanceChallanRows(remittanceSectors, dateRange),
                    getForm4RemittanceChallanFromBillRows(remittanceSectors, dateRange, heads3LevelMap),
                    isConsolidatedSector
                        ? getForm4StateChallanRows(dateRange)
                        : Promise.resolve([]),
                ]);

            logger.info(
                `Form4 (${sector}): Rows going into merge — remittanceChallan: ${remittanceChallanRows.length}, ` +
                `remittanceChallanFromBill: ${remittanceChallanFromBillRows.length}, stateChallan: ${stateChallanRows.length}`
            );

            allRows = [
                ...remittanceChallanRows,
                ...remittanceChallanFromBillRows,
                ...stateChallanRows,
            ];
        } else {
            // ── Any other sector: UNCHANGED behavior ──
            const heads3LevelMap = await getHeads3LevelMap();

            const [challanRows, challanTwoRows, challanFromBillRows] = await Promise.all([
                getForm4ChallanRows(sector, dateRange),
                getForm4ChallanTwoRows(sector, dateRange, heads3LevelMap),
                getForm4ChallanFromBillRows(sector, dateRange, heads3LevelMap),
            ]);

            logger.info(
                `Form4: Rows going into merge — challan: ${challanRows.length}, challanTwo: ${challanTwoRows.length}, ` +
                `challanFromBill: ${challanFromBillRows.length}`
            );

            allRows = [
                ...challanRows,
                ...challanTwoRows,
                ...challanFromBillRows,
            ];
        }

        const sorted = allRows.sort((a, b) => new Date(a.date) - new Date(b.date));

        logger.info(`Form 4 total rows returned: ${sorted.length}`);

        return sorted;
    } catch (error) {
        logger.error(`Error fetching Form 4 data: ${error.message}`);
        throw error;
    }
};







// ═════════════════════════════════════════════════════════════
// FORM 5A - Classified Abstract of Receipts
//
// SECTOR RULES:
// - sector === "STATE"        → StateChallan ONLY, majorHead in [2011, 3999].
// - sector === "COUNCIL"      → Challan (majorHead 001-016, sector IN
//                                 COUNCIL, STATE) + ChallanFromBill
//                                 (majorHead 001-016, sector IN COUNCIL,
//                                 STATE).
// - sector === "CONSOLIDATED" → STATE's rule + COUNCIL's rule combined.
// - any other sector          → empty result.
//
// Every row carries a `classification` array of { level, code, name }
// — one entry per head level (major/subMajor/minor), resolved
// against the correct name table per source:
//   - source === "challan"          → ChallanHeads (parent-aware)
//   - source === "stateChallan"     → Heads
//   - source === "challanFromBill"  → Heads
// ═════════════════════════════════════════════════════════════

const getForm5AStateChallanRows = async ({ majorHeadRangeOnly = false } = {}, dateRange) => {
    const where = {
        sector: "STATE",
    };

    if (dateRange) {
        where.challanDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.stateChallan.findMany({
        where,
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

    const heads3LevelMap = await getHeads3LevelMap();

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
        classification: buildThreeLevelClassification(
            row.majorHead,
            row.subMajorHead,
            row.minorHead,
            heads3LevelMap
        ),
    }));
};

// Shared majorHead range check for the COUNCIL Form 5A pull
// (Challan + ChallanFromBill), both filtered to 001-016.
const isMajorHeadInCouncilRangeForm5A = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 1 && num <= 16;
};

// ─────────────────────────────────────────────────────────────
// Challan rows for COUNCIL's Form 5A pull.
// sector IN (COUNCIL, STATE) — was COUNCIL-only before.
// Filtered to majorHead 001-016.
// ─────────────────────────────────────────────────────────────
const getForm5ACouncilChallanRows = async (dateRange) => {
    const where = {
        isActive: true,
        challanType: { in: ["COUNCIL", "STATE"] },
    };

    if (dateRange) {
        where.challanDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challan.findMany({ where });

    logger.info(
        `Form5A: Fetched ${rows.length} Challan rows (sector IN COUNCIL, STATE) (pre majorHead 1-16 filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInCouncilRangeForm5A(row.majorHead));

    logger.info(
        `Form5A: Challan rows after majorHead 1-16 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    const challanHeadsMap = await getChallanHeadsNameMap();

    return filtered.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        sector: row.challanType ?? null,
        source: "challan",
        classification: buildChallanClassification(
            row.majorHead,
            row.subMajorHead,
            row.minorHead,
            challanHeadsMap
        ),
    }));
};

// ─────────────────────────────────────────────────────────────
// ChallanFromBill rows for COUNCIL's Form 5A pull.
// sector IN (COUNCIL, STATE), filtered to majorHead 001-016.
// amountType filter (FORM5A_ALLOWED_AMOUNT_TYPES) is dropped —
// majorHead now does that job.
// ─────────────────────────────────────────────────────────────
const getForm5ACouncilChallanFromBillRows = async (dateRange) => {
    const where = {
        isActive: true,
        sector: { in: ["COUNCIL", "STATE"] },
    };

    if (dateRange) {
        where.voucharDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Form5A: Fetched ${rows.length} ChallanFromBill rows (sector IN COUNCIL, STATE) (pre majorHead 1-16 filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInCouncilRangeForm5A(row.majorHead));

    logger.info(
        `Form5A: ChallanFromBill rows after majorHead 1-16 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    const heads3LevelMap = await getHeads3LevelMap();

    return filtered.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajor ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        sector: row.sector ?? null,
        source: "challanFromBill",
        classification: buildThreeLevelClassification(
            row.majorHead,
            row.subMajor,
            row.minorHead,
            heads3LevelMap
        ),
    }));
};

export const getForm5AData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Form 5A data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        const dateRange = getDateRangeFromParams(from, to);

        let allRows = [];

        if (isStateSector) {
            const stateChallanRows = await getForm5AStateChallanRows(
                { majorHeadRangeOnly: true },
                dateRange
            );
            allRows = [...stateChallanRows];

            logger.info(
                `Form5A: Rows going into grouping — stateChallan: ${stateChallanRows.length}`
            );
        } else if (isCouncilSector) {
            const [councilChallanRows, councilChallanFromBillRows] = await Promise.all([
                getForm5ACouncilChallanRows(dateRange),
                getForm5ACouncilChallanFromBillRows(dateRange),
            ]);
            allRows = [...councilChallanRows, ...councilChallanFromBillRows];

            logger.info(
                `Form5A: Rows going into grouping — councilChallan: ${councilChallanRows.length}, councilChallanFromBill: ${councilChallanFromBillRows.length}`
            );
        } else if (isConsolidated) {
            const [stateChallanRows, councilChallanRows, councilChallanFromBillRows] =
                await Promise.all([
                    getForm5AStateChallanRows({ majorHeadRangeOnly: true }, dateRange),
                    getForm5ACouncilChallanRows(dateRange),
                    getForm5ACouncilChallanFromBillRows(dateRange),
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
            logger.info(
                `Form5A: no rule defined for sector "${sector}" — returning empty result`
            );
            allRows = [];
        }

        const grouped = allRows.reduce((acc, row) => {
            const key = row.majorHead;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(row);
            return acc;
        }, {});

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
// - sector === "STATE"        → Expenditure (sector=STATE), majorHead
//                                 in [2011, 3999].
// - sector === "COUNCIL"      → Expenditure (sector=COUNCIL), majorHead
//                                 in [201, 224].
// - sector === "CONSOLIDATED" → STATE's rule + COUNCIL's rule combined.
// - any other sector          → empty result.
//
// 🔸 Every row also carries `classification`: an array of
// { level, code, name } resolved via the shared Heads 3-level map
// (expenditure always resolves through Heads, per source table —
// regardless of sector), same shape/rules as Form 4/5A, including
// the "0"/"00" → "Null" display rule from buildClassificationLines.
// ─────────────────────────────────────────────────────────────

const isMajorHeadInStateRangeForm5B = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 2011 && num <= 3999;
};

// NEW: COUNCIL's Form 5B majorHead range check — 201 to 224.
const isMajorHeadInCouncilRangeForm5B = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 201 && num <= 224;
};

const getForm5BStateRows = async (dateRange) => {
    const where = {
        isActive: true,
        sector: "STATE",
    };

    if (dateRange) {
        where.voucherDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.expenditure.findMany({ where });

    logger.info(
        `Form5B: Fetched ${rows.length} STATE rows from Expenditure table (pre majorHead-range filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInStateRangeForm5B(row.majorHead));

    logger.info(
        `Form5B: STATE rows after majorHead 2011-3999 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered;
};

const getForm5BCouncilRows = async (dateRange) => {
    const where = {
        isActive: true,
        sector: "COUNCIL",
    };

    if (dateRange) {
        where.voucherDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.expenditure.findMany({ where });

    logger.info(
        `Form5B: Fetched ${rows.length} COUNCIL rows from Expenditure table (pre majorHead-range filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInCouncilRangeForm5B(row.majorHead));

    logger.info(
        `Form5B: COUNCIL rows after majorHead 201-224 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered;
};

export const getForm5BData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Form 5B data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        const dateRange = getDateRangeFromParams(from, to);

        let rows = [];

        if (isStateSector) {
            rows = await getForm5BStateRows(dateRange);
        } else if (isCouncilSector) {
            rows = await getForm5BCouncilRows(dateRange);
        } else if (isConsolidated) {
            const [stateRows, councilRows] = await Promise.all([
                getForm5BStateRows(dateRange),
                getForm5BCouncilRows(dateRange),
            ]);
            rows = [...stateRows, ...councilRows];
        } else {
            logger.info(
                `Form5B: no rule defined for sector "${sector}" — returning empty result`
            );
            rows = [];
        }

        const grouped = rows.reduce((acc, row) => {
            const key = row.majorHead ?? "Unknown";
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(row);
            return acc;
        }, {});

        const heads3LevelMap = await getHeads3LevelMap();

        const result = Object.entries(grouped).map(([majorHead, groupRows]) => {
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
                classification: buildThreeLevelClassification(
                    row.majorHead,
                    row.subMajorHead,
                    row.minorHead,
                    heads3LevelMap
                ),
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
// - sector === "STATE"        → Expenditure (sector=STATE), majorHead
//                                 in [4001, 5999].
// - sector === "COUNCIL"      → Expenditure (sector=COUNCIL), majorHead
//                                 in [440, 449].
// - sector === "CONSOLIDATED" → STATE's rule + COUNCIL's rule combined.
// - any other sector          → empty result.
//
// 🔸 Same classification addition as Form 5B above.
// ─────────────────────────────────────────────────────────────

const isMajorHeadInStateRangeForm5C = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 4001 && num <= 5999;
};

// NEW: numeric range check for COUNCIL, replacing the exact-string
// COUNCIL_MAJOR_HEADS `in` list — robust to majorHead padding, and
// consistent with how STATE's range is checked above.
const isMajorHeadInCouncilRangeForm5C = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 440 && num <= 449;
};

// FIX: now actually accepts and applies `dateRange` — previously
// defined as `async ()` with no params, so any dateRange passed by
// the caller was silently ignored and Form5C always returned
// all-time data.
const getForm5CStateRows = async (dateRange) => {
    const where = {
        isActive: true,
        sector: "STATE",
    };

    if (dateRange) {
        where.voucherDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.expenditure.findMany({ where });

    logger.info(
        `Form5C: Fetched ${rows.length} STATE rows from Expenditure table (pre majorHead-range filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInStateRangeForm5C(row.majorHead));

    logger.info(
        `Form5C: STATE rows after majorHead 4001-5999 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered;
};

// FIX: same as above — now accepts `dateRange`, and majorHead
// filtering moved to the same numeric-range style as STATE (was a
// Prisma-level exact-string `in` filter on COUNCIL_MAJOR_HEADS).
const getForm5CCouncilRows = async (dateRange) => {
    const where = {
        isActive: true,
        sector: "COUNCIL",
    };

    if (dateRange) {
        where.voucherDate = { gte: dateRange.from, lte: dateRange.to };
    }

    const rows = await prisma.expenditure.findMany({ where });

    logger.info(
        `Form5C: Fetched ${rows.length} COUNCIL rows from Expenditure table (pre majorHead-range filter)`
    );

    const filtered = rows.filter((row) => isMajorHeadInCouncilRangeForm5C(row.majorHead));

    logger.info(
        `Form5C: COUNCIL rows after majorHead 440-449 filter: ${filtered.length} (excluded ${rows.length - filtered.length})`
    );

    return filtered;
};

export const getForm5CData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Form 5C data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        const dateRange = getDateRangeFromParams(from, to);

        // console.log("Form5C dateRange resolved to:", dateRange);

        let rows = [];

        if (isStateSector) {
            rows = await getForm5CStateRows(dateRange);
        } else if (isCouncilSector) {
            rows = await getForm5CCouncilRows(dateRange);
        } else if (isConsolidated) {
            // FIX: dateRange was previously not passed at all here.
            const [stateRows, councilRows] = await Promise.all([
                getForm5CStateRows(dateRange),
                getForm5CCouncilRows(dateRange),
            ]);
            rows = [...stateRows, ...councilRows];
        } else {
            logger.info(
                `Form5C: no rule defined for sector "${sector}" — returning empty result`
            );
            rows = [];
        }

        const grouped = rows.reduce((acc, row) => {
            const key = row.majorHead ?? "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(row);
            return acc;
        }, {});

        // 🔸 One shared Heads lookup for the whole call, reused per row.
        const heads3LevelMap = await getHeads3LevelMap();

        const result = Object.entries(grouped).map(([majorHead, groupRows]) => {
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
                classification: buildThreeLevelClassification(
                    row.majorHead,
                    row.subMajorHead,
                    row.minorHead,
                    heads3LevelMap
                ),
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
//
// COUNCIL — Receipt side:
//   • LOANS FROM GOVT.        → Challan, subMajorHead = "66001",
//                                 challanType = COUNCIL → loansGovt
//   • LOANS FROM OTHER SOURCES→ Challan, subMajorHead = "66002",
//                                 challanType = COUNCIL → loansOther
//   • H/B LOAN                → ChallanFromBill, sector = COUNCIL,
//                                 amountType = "Building Loan" → hbLoan
//   • Car Loan                → ChallanFromBill, sector = COUNCIL,
//                                 amountType = "Car Loan" → carLoan
//   • OTHER RECEIPTS          → Nil
//
// COUNCIL — Payment side:
//   • REPAYMENT LOANS (GOVT)  → Expenditure, sector = COUNCIL,
//                                 loanRepayGovt non-zero → repayGovt
//                                 = grossAmount
//   • REPAYMENT LOANS (OTHER) → Expenditure, sector = COUNCIL,
//                                 loanRepayOther non-zero → repayOther
//                                 = grossAmount
//   • PAYMENTS LOANS/ADVANCES → Expenditure, sector = COUNCIL,
//                                 majorHead = "661" → loansAdvances
//                                 = grossAmount
//
// STATE — Receipt side:
//   • LOANS FROM GOVT.        → StateChallan, majorHead = "7610",
//                                 sector = STATE → loansGovt =
//                                 totalAmount
//   • LOANS FROM OTHER SOURCES, H/B LOAN, Car Loan, OTHER RECEIPTS
//     → Nil
//
// STATE — Payment side:
//   • REPAYMENT LOANS (GOVT)  → Expenditure, sector = STATE,
//                                 loanRepayGovt non-zero → repayGovt
//                                 = grossAmount
//   • REPAYMENT LOANS (OTHER) → Expenditure, sector = STATE,
//                                 loanRepayOther non-zero → repayOther
//                                 = grossAmount
//   • PAYMENTS LOANS/ADVANCES → Nil
//
// CONSOLIDATED → STATE's rows + COUNCIL's rows, merged.
// any other sector → no rule defined, empty result.
//
// All queries below are date-filtered when `dateRange` is provided
// (Challan → challanDate, ChallanFromBill → voucharDate,
// StateChallan → challanDate, Expenditure → voucherDate) — this
// mirrors getDateRangeFromParams / getFyRange usage in Forms 4/5A/5B/5C.
// ─────────────────────────────────────────────────────────────

const FORM5D_COUNCIL_HB_LOAN_AMOUNT_TYPE = "Building Loan";
const FORM5D_COUNCIL_CAR_LOAN_AMOUNT_TYPE = "Car Loan";

const FORM5D_COUNCIL_LOANS_GOVT_SUBMAJOR = "66001";
const FORM5D_COUNCIL_LOANS_OTHER_SUBMAJOR = "66002";

const FORM5D_STATE_LOANS_GOVT_MAJORHEAD = "7610";

const FORM5D_COUNCIL_LOANS_ADVANCES_MAJORHEAD = "661";

const safe = (v) => {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
};

const emptyReceipt = () => ({
    loansGovt: 0,
    loansOther: 0,
    hbLoan: 0,
    carLoan: 0,
    otherReceipts: 0,
});

const emptyPayment = () => ({
    repayGovt: 0,
    repayOther: 0,
    loansAdvances: 0,
});

// ════════════════════════════════════════════════════════════
// COUNCIL — Receipt side
// ════════════════════════════════════════════════════════════
const getForm5DCouncilReceiptRows = async (dateRange) => {
    const challanDateWhere = dateRange
        ? { challanDate: { gte: dateRange.from, lte: dateRange.to } }
        : {};
    const cfbDateWhere = dateRange
        ? { voucharDate: { gte: dateRange.from, lte: dateRange.to } }
        : {};

    const [loansGovtRows, loansOtherRows, hbLoanRows, carLoanRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                subMajorHead: FORM5D_COUNCIL_LOANS_GOVT_SUBMAJOR,
                ...challanDateWhere,
            },
            orderBy: { challanDate: "asc" },
        }),
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                subMajorHead: FORM5D_COUNCIL_LOANS_OTHER_SUBMAJOR,
                ...challanDateWhere,
            },
            orderBy: { challanDate: "asc" },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: FORM5D_COUNCIL_HB_LOAN_AMOUNT_TYPE,
                ...cfbDateWhere,
            },
            orderBy: { voucharDate: "asc" },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: FORM5D_COUNCIL_CAR_LOAN_AMOUNT_TYPE,
                ...cfbDateWhere,
            },
            orderBy: { voucharDate: "asc" },
        }),
    ]);

    logger.info(
        `Form5D (COUNCIL receipt): loansGovt(Challan 66001)=${loansGovtRows.length}, ` +
        `loansOther(Challan 66002)=${loansOtherRows.length}, hbLoan(CFB)=${hbLoanRows.length}, ` +
        `carLoan(CFB)=${carLoanRows.length}`
    );

    const rows = [
        ...loansGovtRows.map((row) => {
            const amount = safe(row.amount);
            return {
                id: `CH-RCPT-COUNCIL-GOVT-${row.id}`,
                source: "challan",
                cashBookItemNo: row.challanNo ?? "-",
                ...emptyReceipt(),
                loansGovt: amount,
                totalReceipts: amount,
            };
        }),
        ...loansOtherRows.map((row) => {
            const amount = safe(row.amount);
            return {
                id: `CH-RCPT-COUNCIL-OTHER-${row.id}`,
                source: "challan",
                cashBookItemNo: row.challanNo ?? "-",
                ...emptyReceipt(),
                loansOther: amount,
                totalReceipts: amount,
            };
        }),
        ...hbLoanRows.map((row) => {
            const amount = safe(row.amount);
            return {
                id: `CFB-RCPT-COUNCIL-HB-${row.id}`,
                source: "challanFromBill",
                cashBookItemNo: row.challanNo ?? "-",
                ...emptyReceipt(),
                hbLoan: amount,
                totalReceipts: amount,
            };
        }),
        ...carLoanRows.map((row) => {
            const amount = safe(row.amount);
            return {
                id: `CFB-RCPT-COUNCIL-CAR-${row.id}`,
                source: "challanFromBill",
                cashBookItemNo: row.challanNo ?? "-",
                ...emptyReceipt(),
                carLoan: amount,
                totalReceipts: amount,
            };
        }),
    ];

    return rows;
};

// ════════════════════════════════════════════════════════════
// COUNCIL — Payment side
// ════════════════════════════════════════════════════════════
const getForm5DCouncilPaymentRows = async (dateRange) => {
    const dateWhere = dateRange
        ? { voucherDate: { gte: dateRange.from, lte: dateRange.to } }
        : {};

    const [repayGovtRows, repayOtherRows, loansAdvancesRows] = await Promise.all([
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "COUNCIL", ...dateWhere },
            select: { id: true, voucherNo: true, loanRepayGovt: true, grossAmount: true },
            orderBy: { voucherDate: "asc" },
        }),
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "COUNCIL", ...dateWhere },
            select: { id: true, voucherNo: true, loanRepayOther: true, grossAmount: true },
            orderBy: { voucherDate: "asc" },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                majorHead: FORM5D_COUNCIL_LOANS_ADVANCES_MAJORHEAD,
                ...dateWhere,
            },
            select: { id: true, voucherNo: true, grossAmount: true },
            orderBy: { voucherDate: "asc" },
        }),
    ]);

    const repayGovtFiltered = repayGovtRows.filter((row) => safe(row.loanRepayGovt) !== 0);
    const repayOtherFiltered = repayOtherRows.filter((row) => safe(row.loanRepayOther) !== 0);

    logger.info(
        `Form5D (COUNCIL payment): repayGovt=${repayGovtFiltered.length} ` +
        `(of ${repayGovtRows.length}), repayOther=${repayOtherFiltered.length} ` +
        `(of ${repayOtherRows.length}), loansAdvances(majorHead 661)=${loansAdvancesRows.length}`
    );

    const rows = [
        ...repayGovtFiltered.map((row) => {
            const amount = safe(row.grossAmount);
            return {
                id: `E-PMT-COUNCIL-REPAYGOVT-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                ...emptyPayment(),
                repayGovt: amount,
                totalPayments: amount,
            };
        }),
        ...repayOtherFiltered.map((row) => {
            const amount = safe(row.grossAmount);
            return {
                id: `E-PMT-COUNCIL-REPAYOTHER-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                ...emptyPayment(),
                repayOther: amount,
                totalPayments: amount,
            };
        }),
        ...loansAdvancesRows.map((row) => {
            const amount = safe(row.grossAmount);
            return {
                id: `E-PMT-COUNCIL-LOANADV-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                ...emptyPayment(),
                loansAdvances: amount,
                totalPayments: amount,
            };
        }),
    ];

    return rows;
};

const getForm5DCouncilRows = async (dateRange) => {
    const [receiptRows, paymentRows] = await Promise.all([
        getForm5DCouncilReceiptRows(dateRange),
        getForm5DCouncilPaymentRows(dateRange),
    ]);
    return { receiptRows, paymentRows };
};

// ════════════════════════════════════════════════════════════
// STATE — Receipt side
// ════════════════════════════════════════════════════════════
const getForm5DStateReceiptRows = async (dateRange) => {
    const dateWhere = dateRange
        ? { challanDate: { gte: dateRange.from, lte: dateRange.to } }
        : {};

    const rows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
            majorHead: FORM5D_STATE_LOANS_GOVT_MAJORHEAD,
            ...dateWhere,
        },
        orderBy: { challanDate: "asc" },
    });

    logger.info(`Form5D (STATE receipt): loansGovt(StateChallan 7610)=${rows.length}`);

    return rows.map((row) => {
        const amount = safe(row.totalAmount);
        return {
            id: `SC-RCPT-STATE-GOVT-${row.id}`,
            source: "stateChallan",
            cashBookItemNo: row.challanNo ?? "-",
            ...emptyReceipt(),
            loansGovt: amount,
            totalReceipts: amount,
        };
    });
};

// ════════════════════════════════════════════════════════════
// STATE — Payment side
// ════════════════════════════════════════════════════════════
const getForm5DStatePaymentRows = async (dateRange) => {
    const dateWhere = dateRange
        ? { voucherDate: { gte: dateRange.from, lte: dateRange.to } }
        : {};

    const [repayGovtRows, repayOtherRows] = await Promise.all([
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "STATE", ...dateWhere },
            select: { id: true, voucherNo: true, loanRepayGovt: true, grossAmount: true },
            orderBy: { voucherDate: "asc" },
        }),
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "STATE", ...dateWhere },
            select: { id: true, voucherNo: true, loanRepayOther: true, grossAmount: true },
            orderBy: { voucherDate: "asc" },
        }),
    ]);

    const repayGovtFiltered = repayGovtRows.filter((row) => safe(row.loanRepayGovt) !== 0);
    const repayOtherFiltered = repayOtherRows.filter((row) => safe(row.loanRepayOther) !== 0);

    logger.info(
        `Form5D (STATE payment): repayGovt=${repayGovtFiltered.length} ` +
        `(of ${repayGovtRows.length}), repayOther=${repayOtherFiltered.length} ` +
        `(of ${repayOtherRows.length})`
    );

    const rows = [
        ...repayGovtFiltered.map((row) => {
            const amount = safe(row.grossAmount);
            return {
                id: `E-PMT-STATE-REPAYGOVT-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                ...emptyPayment(),
                repayGovt: amount,
                totalPayments: amount,
            };
        }),
        ...repayOtherFiltered.map((row) => {
            const amount = safe(row.grossAmount);
            return {
                id: `E-PMT-STATE-REPAYOTHER-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                ...emptyPayment(),
                repayOther: amount,
                totalPayments: amount,
            };
        }),
        // PAYMENTS LOANS/ADVANCES — Nil for STATE, no rows generated.
    ];

    return rows;
};

const getForm5DStateRows = async (dateRange) => {
    const [receiptRows, paymentRows] = await Promise.all([
        getForm5DStateReceiptRows(dateRange),
        getForm5DStatePaymentRows(dateRange),
    ]);
    return { receiptRows, paymentRows };
};

export const getForm5DData = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Form 5D data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        const dateRange = getDateRangeFromParams(from, to);

        logger.info(`Form5D resolved dateRange: ${JSON.stringify(dateRange)}`);

        let receiptRows = [];
        let paymentRows = [];

        if (isStateSector) {
            const stateData = await getForm5DStateRows(dateRange);
            receiptRows = stateData.receiptRows;
            paymentRows = stateData.paymentRows;
        } else if (isCouncilSector) {
            const councilData = await getForm5DCouncilRows(dateRange);
            receiptRows = councilData.receiptRows;
            paymentRows = councilData.paymentRows;
        } else if (isConsolidated) {
            const [stateData, councilData] = await Promise.all([
                getForm5DStateRows(dateRange),
                getForm5DCouncilRows(dateRange),
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
//
// COUNCIL — Receipt side:
//   RECOVERIES OF CPF SUBSCRIPTIONS → ChallanFromBill, majorHead="661",
//     sector=COUNCIL → cpfSub. Same records ALSO feed payment-side
//     remitCpf below (dual-posted).
//   SECURITY DEPOSIT → ChallanFromBill, majorHead="664",
//     amountType="Security Deposits", sector=COUNCIL → securityDep
//   EARNEST MONEY DEPOSIT → ChallanFromBill, majorHead="664",
//     amountType="Earnest Money", sector=COUNCIL → earnestMoney
//   Deposit received from Govt for transferred item → Nil
//   Cheques drawn during month → ALL Expenditure, sector=COUNCIL →
//     chequesDrawn = grossAmount
//
// COUNCIL — Payment side:
//   Payment of CPF balance advances → Expenditure, majorHead="662",
//     sector=COUNCIL → cpfAdvances = grossAmount
//   Remittance of CPF Contribution to P.O. → SAME ChallanFromBill
//     majorHead="661"/sector=COUNCIL records as receipt cpfSub above
//     (dual-posted) → remitCpf = amount
//   Payment of security deposit → Expenditure, majorHead="664",
//     securityDeposit field non-zero, sector=COUNCIL → paySecurityDep
//     = grossAmount
//   Repayment of Earnest money deposit → Expenditure, majorHead="664",
//     earnestMoney field non-zero, sector=COUNCIL → repayEarnest =
//     grossAmount
//   Payment in respect of transferred item → Nil
//   Remittance to Treasury (PLA) → Challan (challanType=COUNCIL) +
//     ChallanFromBill (sector=COUNCIL), both filtered to majorHead IN
//     (001-016, 661, 664) → remittanceTreasury = amount
//
// STATE — Receipt side (structure UNCHANGED from before, majorHead
// filter ADDED to the deposit-type query):
//   RECOVERIES OF CPF SUBSCRIPTIONS → Nil
//   SECURITY DEPOSIT → ChallanFromBill, majorHead="8443",
//     amountType="Security Deposits", sector=STATE → securityDep
//   EARNEST MONEY DEPOSIT → ChallanFromBill, majorHead="8443",
//     amountType="Earnest Money", sector=STATE → earnestMoney
//   Deposit received from Govt for transferred item → ALL
//     StateChallan (sector=STATE) → govtDeposit = totalAmount. Same
//     records ALSO feed payment-side remittanceTreasury (dual-posted).
//   Cheques drawn during month → ALL Expenditure, sector=STATE →
//     chequesDrawn = grossAmount. Same records ALSO feed payment-side
//     transferItems (dual-posted).
//
// STATE — Payment side:
//   Payment of CPF balance advances → Nil
//   Remittance of CPF Contribution to P.O. → Nil
//   Payment of security deposit → SAME records as receipt securityDep
//     above (dual-posted) → paySecurityDep = amount
//   Repayment of Earnest money deposit → SAME records as receipt
//     earnestMoney above (dual-posted) → repayEarnest = amount
//   Payment in respect of transferred item → SAME Expenditure rows as
//     receipt chequesDrawn above (dual-posted) → transferItems =
//     grossAmount
//   Remittance to Treasury (PLA) → SAME StateChallan rows as receipt
//     govtDeposit above (dual-posted) → remittanceTreasury =
//     totalAmount
//
// CONSOLIDATED → STATE's rows + COUNCIL's rows, merged.
// any other sector → no rule defined, empty result.
//
// All queries are date-filtered on from/to (Expenditure→voucherDate,
// Challan→challanDate, ChallanFromBill→voucharDate,
// StateChallan→challanDate).
// ─────────────────────────────────────────────────────────────

// ── COUNCIL majorHead constants ──
const FORM5E_COUNCIL_CPF_MAJORHEAD = "662";
const FORM5E_COUNCIL_DEPOSIT_MAJORHEAD = "664"; // Security Deposit / Earnest Money source, both receipt + payment
const FORM5E_COUNCIL_CPF_ADVANCE_MAJORHEAD = "662";

// Same "Amount Remitted" majorHead range as Form 4 / Form 5A:
// 001-016, plus 661 and 664.
const FORM5E_AMOUNT_REMITTED_MAJOR_HEADS = [
    ...Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(3, "0")), // 001..016
    "661",
    "664",
];

// ── STATE majorHead / amountType constants ──
const FORM5E_STATE_DEPOSIT_MAJORHEAD = "8443";
const FORM5E_STATE_DEDUCTION_TYPES = [
    "Security Deposits",
    "Earnest Money",
];

const safeForm5E = (v) => {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
};

const normalizeHead = (v) => (v == null ? "" : v.toString().trim());

// ─────────────────────────────
// DATE RANGE HELPER
// ─────────────────────────────
const buildDateFilter = (dateField, from, to) => {
    if (!from || !to) return {};
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999); // include the whole "to" day
    return { [dateField]: { gte: start, lte: end } };
};

// ════════════════════════════════════════════════════════════
// STATE — same structure as before; only change is the
// majorHead="8443" filter added to the deduction-type query.
// ════════════════════════════════════════════════════════════
const getForm5EStateRows = async (from, to) => {
    const expenditureDateFilter = buildDateFilter("voucherDate", from, to);
    const stateChallanDateFilter = buildDateFilter("challanDate", from, to);
    const cfbDateFilter = buildDateFilter("voucharDate", from, to);

    const [expenditureRows, stateChallanRows, stateDeductionRows] = await Promise.all([
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "STATE", ...expenditureDateFilter },
            select: {
                id: true,
                voucherNo: true,
                sector: true,
                grossAmount: true,
            },
            orderBy: { voucherDate: "asc" },
        }),
        prisma.stateChallan.findMany({
            where: { sector: "STATE", ...stateChallanDateFilter },
            select: {
                id: true,
                challanNo: true,
                totalAmount: true,
            },
            orderBy: { challanDate: "asc" },
        }),
        // NEW: majorHead="8443" filter added, per updated spec.
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                majorHead: FORM5E_STATE_DEPOSIT_MAJORHEAD,
                amountType: { in: FORM5E_STATE_DEDUCTION_TYPES },
                ...cfbDateFilter,
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
        `Form5E (STATE): expenditure=${expenditureRows.length}, stateChallan=${stateChallanRows.length}, ` +
        `stateDeduction(majorHead 8443)=${stateDeductionRows.length}`
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
// COUNCIL — REBUILT per new spec.
// ════════════════════════════════════════════════════════════
const getForm5ECouncilRows = async (from, to) => {
    const expenditureDateFilter = buildDateFilter("voucherDate", from, to);
    const challanDateFilter = buildDateFilter("challanDate", from, to);
    const cfbDateFilter = buildDateFilter("voucharDate", from, to);

    const [
        cpfRows,
        securityDepositRows,
        earnestMoneyRows,
        expenditureRows,
        remittanceChallanRows,
        remittanceCfbRows,
    ] = await Promise.all([
        // RECOVERIES OF CPF SUBSCRIPTIONS (receipt) / Remittance of
        // CPF Contribution to P.O. (payment) — dual-posted from the
        // same records.
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                majorHead: FORM5E_COUNCIL_CPF_MAJORHEAD,
                ...cfbDateFilter,
            },
            select: { id: true, challanNo: true, amount: true },
            orderBy: { voucharDate: "asc" },
        }),
        // SECURITY DEPOSIT (receipt)
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                majorHead: FORM5E_COUNCIL_DEPOSIT_MAJORHEAD,
                amountType: "Security Deposits",
                ...cfbDateFilter,
            },
            select: { id: true, challanNo: true, amount: true },
            orderBy: { voucharDate: "asc" },
        }),
        // EARNEST MONEY DEPOSIT (receipt)
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                majorHead: FORM5E_COUNCIL_DEPOSIT_MAJORHEAD,
                amountType: "Earnest Money",
                ...cfbDateFilter,
            },
            select: { id: true, challanNo: true, amount: true },
            orderBy: { voucharDate: "asc" },
        }),
        // Expenditure (COUNCIL) — feeds: chequesDrawn (all rows),
        // cpfAdvances (majorHead=662), paySecurityDep/repayEarnest
        // (majorHead=664, respective column non-zero).
        prisma.expenditure.findMany({
            where: { isActive: true, sector: "COUNCIL", ...expenditureDateFilter },
            select: {
                id: true,
                voucherNo: true,
                majorHead: true,
                grossAmount: true,
                securityDeposit: true,
                earnestMoney: true,
            },
            orderBy: { voucherDate: "asc" },
        }),
        // Remittance to Treasury — Challan side, majorHead 001-016/661/664
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                majorHead: { in: FORM5E_AMOUNT_REMITTED_MAJOR_HEADS },
                ...challanDateFilter,
            },
            select: { id: true, challanNo: true, amount: true },
            orderBy: { challanDate: "asc" },
        }),
        // Remittance to Treasury — ChallanFromBill side, majorHead 001-016/661/664
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: ["COUNCIL", "STATE"] },
                majorHead: { in: FORM5E_AMOUNT_REMITTED_MAJOR_HEADS },
                ...cfbDateFilter,
            },
            select: { id: true, challanNo: true, amount: true },
            orderBy: { voucharDate: "asc" },
        }),
    ]);

    logger.info(
        `Form5E (COUNCIL): cpf(majorHead 661)=${cpfRows.length}, securityDep(664)=${securityDepositRows.length}, ` +
        `earnestMoney(664)=${earnestMoneyRows.length}, expenditure=${expenditureRows.length}, ` +
        `remittanceChallan=${remittanceChallanRows.length}, remittanceCfb=${remittanceCfbRows.length}`
    );

    // ── Split Expenditure rows into the payment-side buckets ──
    const cpfAdvanceRows = expenditureRows.filter(
        (row) => normalizeHead(row.majorHead) === FORM5E_COUNCIL_CPF_ADVANCE_MAJORHEAD
    );
    const paySecDepRows = expenditureRows.filter(
        (row) =>
            normalizeHead(row.majorHead) === FORM5E_COUNCIL_DEPOSIT_MAJORHEAD &&
            safeForm5E(row.securityDeposit) !== 0
    );
    const repayEarnestRows = expenditureRows.filter(
        (row) =>
            normalizeHead(row.majorHead) === FORM5E_COUNCIL_DEPOSIT_MAJORHEAD &&
            safeForm5E(row.earnestMoney) !== 0
    );

    logger.info(
        `Form5E (COUNCIL) expenditure buckets: cpfAdvance(662)=${cpfAdvanceRows.length}, ` +
        `paySecDep(664,secDep≠0)=${paySecDepRows.length}, repayEarnest(664,earnest≠0)=${repayEarnestRows.length}`
    );

    // ══════════════════════════════════════════════════════════
    // RECEIPT ROWS
    // ══════════════════════════════════════════════════════════
    const receiptFromCpf = cpfRows.map((row) => {
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

    const receiptFromSecurityDeposit = securityDepositRows.map((row) => {
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

    const receiptFromEarnestMoney = earnestMoneyRows.map((row) => {
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

    // "Deposit received from Govt for transferred item" → Nil, no rows.

    const receiptFromCheques = expenditureRows.map((row) => {
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
        ...receiptFromCheques,
    ];

    // ══════════════════════════════════════════════════════════
    // PAYMENT ROWS
    // ══════════════════════════════════════════════════════════
    const paymentFromCpfAdvance = cpfAdvanceRows.map((row) => {
        const amt = safeForm5E(row.grossAmount);
        if (amt === 0) return null;
        return {
            id: `E-CPFADV-P-${row.id}`,
            vrNo: row.voucherNo ?? "-",
            cpfAdvances: amt,
            remitCpf: 0,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    // Dual-posted from the same records as receipt cpfSub above.
    const paymentFromRemitCpf = cpfRows.map((row) => {
        const amt = safeForm5E(row.amount);
        if (amt === 0) return null;
        return {
            id: `CFB-CPF-P-${row.id}`,
            vrNo: row.challanNo ?? "-",
            cpfAdvances: 0,
            remitCpf: amt,
            paySecurityDep: 0,
            repayEarnest: 0,
            transferItems: 0,
            remittanceTreasury: 0,
            totalPayment: amt,
        };
    }).filter(Boolean);

    const paymentFromSecDep = paySecDepRows.map((row) => {
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

    const paymentFromRepayEarnest = repayEarnestRows.map((row) => {
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

    // "Payment in respect of transferred item" → Nil, no rows.

    const paymentFromRemittanceChallan = remittanceChallanRows.map((row) => {
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

    const paymentFromRemittanceCfb = remittanceCfbRows.map((row) => {
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

    const paymentRows = [
        ...paymentFromCpfAdvance,
        ...paymentFromRemitCpf,
        ...paymentFromSecDep,
        ...paymentFromRepayEarnest,
        ...paymentFromRemittanceChallan,
        ...paymentFromRemittanceCfb,
    ];

    logger.info(
        `Form5E (COUNCIL): receiptRows=${receiptRows.length}, paymentRows=${paymentRows.length}`
    );

    return { receiptRows, paymentRows };
};

export const getForm5EData = async (sector, dateRange = {}) => {
    const { from, to } = dateRange;

    console.log("getForm5EData for filter:", from, to);

    try {
        logger.info(
            `Fetching Form 5E data for sector: ${sector ?? "ALL"}, range: ${from ?? "-"} to ${to ?? "-"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let receiptRows = [];
        let paymentRows = [];

        if (isStateSector) {
            const stateData = await getForm5EStateRows(from, to);
            receiptRows = stateData.receiptRows;
            paymentRows = stateData.paymentRows;
        } else if (isCouncilSector) {
            const councilData = await getForm5ECouncilRows(from, to);
            receiptRows = councilData.receiptRows;
            paymentRows = councilData.paymentRows;
        } else if (isConsolidated) {
            const [stateData, councilData] = await Promise.all([
                getForm5EStateRows(from, to),
                getForm5ECouncilRows(from, to),
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
            `remittanceTotal=${paymentTotals.remittanceTreasury}`
        );

        return { receiptRows, paymentRows, receiptTotals, paymentTotals };
    } catch (error) {
        logger.error(`Error fetching Form 5E data: ${error.message}`);
        throw error;
    }
};



// ─────────────────────────────────────────────────────────────
// FORM 6 - Classified cum Consolidated Abstract
// (unchanged — already has the from/to filter)
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

// 🔸 Shared helper — builds a Prisma date-range `where` fragment for
// a given date field, only when both `from` and `to` are supplied.
// `to` is pushed to the end of that day (23:59:59.999) so the whole
// "to" date is included. Returns `{}` when either bound is missing,
// so callers can safely spread it into their `where` unconditionally.
const buildDateRangeWhere = (from, to, field) => {
    if (!from || !to) return {};
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { [field]: { gte: start, lte: end } };
};

export const getForm6Data = async (sector, dateRange) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 6 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const where = { isActive: true };

        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        // Apply voucherDate range filter when from/to are provided.
        Object.assign(where, buildDateRangeWhere(from, to, "voucherDate"));

        logger.info(
            `Form6: Fetched rows from Expenditure table (date-filtered: ${!!(from && to)})`
        );

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

        // 🔸 No sector filter here — Expenditure rows in this call can
        // belong to COUNCIL or STATE (or both, for CONSOLIDATED), so we
        // load the full Heads table rather than scoping to one sector.
        const headsFullChainMap = await getHeadsFullChainMap();

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
                    classification: buildStateChallanClassification(row, headsFullChainMap),
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

            if (monthName) {
                grouped[fullHeadCode].months[monthName] += amount;
                grandTotalMonths[monthName] += amount;
            }

            grouped[fullHeadCode].total += amount;
            grandTotal += amount;
        });

        const result = Object.values(grouped).sort((a, b) =>
            a.headCode.localeCompare(b.headCode)
        );

        logger.info(`Form 6 total head groups: ${result.length}`);

        return {
            rows: result,
            grandTotalMonths,
            grandTotal,
        };
    } catch (error) {
        logger.error(`Error fetching Form 6 data: ${error.message}`);
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────
// FORM 7 - Month wise register
//
// SECTOR RULES:
// - sector === "COUNCIL"      → Challan + ChallanFromBill, both
//                                 filtered to majorHead IN
//                                 (001-016, 661, 664) and sector/
//                                 challanType IN (COUNCIL, STATE).
// - sector === "STATE"        → StateChallan ONLY (sector=STATE),
//                                 unfiltered by majorHead.
// - sector === "CONSOLIDATED" → COUNCIL's rule + STATE's rule
//                                 combined.
// - any other sector          → no rule defined, empty result.
//
// 🔸 NEW: optional { from, to } date range, mirroring Form6.
//   - Challan / ChallanFromBill / StateChallan are each filtered on
//     their own date field (challanDate / voucharDate / challanDate)
//     using the same inclusive whole-day range as Form6.
//   - Filter only applies when BOTH from and to are supplied.
// ─────────────────────────────────────────────────────────────

// Same "Amount Remitted" majorHead range as Form 4 / Form 5A:
// 001-016, plus 661 and 664.
const FORM7_AMOUNT_REMITTED_MAJOR_HEADS = [
    ...Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(3, "0")), // 001..016
    "661",
    "664",
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

// ════════════════════════════════════════════════════════════
// COUNCIL — Challan + ChallanFromBill, majorHead 001-016/661/664,
// sector/challanType IN (COUNCIL, STATE)
// 🔸 dateRange applied: Challan on challanDate, ChallanFromBill on voucharDate
// ════════════════════════════════════════════════════════════
const getForm7CouncilRows = async (dateRange = {}) => {
    const { from, to } = dateRange;
    const remittanceSectors = ["COUNCIL", "STATE"];

    const [challanRows, challanFromBillRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: { in: remittanceSectors },
                majorHead: { in: FORM7_AMOUNT_REMITTED_MAJOR_HEADS },
                ...buildDateRangeWhere(from, to, "challanDate"),
            },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: remittanceSectors },
                majorHead: { in: FORM7_AMOUNT_REMITTED_MAJOR_HEADS },
                ...buildDateRangeWhere(from, to, "voucharDate"),
            },
        }),
    ]);

    logger.info(
        `Form7 (COUNCIL): challan(majorHead-filtered, sector IN COUNCIL,STATE)=${challanRows.length}, ` +
        `challanFromBill(majorHead-filtered, sector IN COUNCIL,STATE)=${challanFromBillRows.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    return { challanRows, challanFromBillRows };
};

// ════════════════════════════════════════════════════════════
// STATE — StateChallan ONLY, unfiltered by majorHead
// 🔸 dateRange applied on challanDate
// ════════════════════════════════════════════════════════════
const getForm7StateRows = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const stateChallanRows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
            ...buildDateRangeWhere(from, to, "challanDate"),
        },
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
    });

    logger.info(
        `Form7 (STATE): stateChallan=${stateChallanRows.length}, date-filtered: ${!!(from && to)}`
    );

    return { stateChallanRows };
};

export const getForm7Data = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 7 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let challanRows = [];
        let challanFromBillRows = [];
        let stateChallanRows = [];

        if (isStateSector) {
            const stateData = await getForm7StateRows(dateRange);
            stateChallanRows = stateData.stateChallanRows;
        } else if (isCouncilSector) {
            const councilData = await getForm7CouncilRows(dateRange);
            challanRows = councilData.challanRows;
            challanFromBillRows = councilData.challanFromBillRows;
        } else if (isConsolidated) {
            const [councilData, stateData] = await Promise.all([
                getForm7CouncilRows(dateRange),
                getForm7StateRows(dateRange),
            ]);
            challanRows = councilData.challanRows;
            challanFromBillRows = councilData.challanFromBillRows;
            stateChallanRows = stateData.stateChallanRows;
        } else {
            logger.info(
                `Form7: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        logger.info(
            `Form7: Rows going into grouping — challan=${challanRows.length}, ` +
            `challanFromBill=${challanFromBillRows.length}, stateChallan=${stateChallanRows.length}`
        );

        // 🔸 Shared name-lookup maps, loaded once per call and reused
        // across all sources below.
        const needsChallanHeadsMap = challanRows.length > 0;
        const needsHeads3LevelMap = challanFromBillRows.length > 0;
        const needsHeadsFullChainMap = stateChallanRows.length > 0;

        const [challanHeadsMap, heads3LevelMap, headsFullChainMap] = await Promise.all([
            needsChallanHeadsMap ? getChallanHeadsNameMap() : Promise.resolve(null),
            needsHeads3LevelMap ? getHeads3LevelMap() : Promise.resolve(null),
            needsHeadsFullChainMap ? getHeadsFullChainMap("STATE") : Promise.resolve(null),
        ]);

        // ── Step 1: group by full head code ─────────────────────
        const grouped = {};
        const grandTotalMonths = emptyMonths();
        let grandTotal = 0;

        // Process Challan
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
                    // 🔸 challan → ChallanHeads (parent-aware)
                    classification: buildChallanClassification(
                        row.majorHead,
                        row.subMajorHead,
                        row.minorHead,
                        challanHeadsMap
                    ),
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

        // Process ChallanFromBill
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
                    // 🔸 challanFromBill → Heads (3-level)
                    classification: buildThreeLevelClassification(
                        row.majorHead,
                        row.subMajor,
                        row.minorHead,
                        heads3LevelMap
                    ),
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
                    // 🔸 stateChallan → Heads (full 7-level chain)
                    classification: buildStateChallanClassification(row, headsFullChainMap),
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