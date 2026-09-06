import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

const buildDateRangeWhere = (from, to, field) => {
    if (!from || !to) return {};
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { [field]: { gte: start, lte: end } };
};
// ─────────────────────────────────────────────────────────────
// FORM 7A - Compilation Sheet
// Data from: Expenditure table
// Grouped by: majorHead → minorHead → detailHead
// Shows subtotal after each detailHead, minorHead, majorHead group
//
// 🔸 NEW: optional { from, to } date range, same as Form6/Form7 —
// filters on voucherDate, inclusive whole-day range, only applied
// when BOTH from and to are supplied.
// ─────────────────────────────────────────────────────────────
export const getForm7AData = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 7A data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const where = { isActive: true };

        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        // Apply voucherDate range filter when from/to are provided.
        Object.assign(where, buildDateRangeWhere(from, to, "voucherDate"));

        const rows = await prisma.expenditure.findMany({
            where,
            select: {
                id: true,
                majorHead: true,
                minorHead: true,
                detailHead: true,
                voucherNo: true,
                voucherDate: true,
                grossAmount: true,
                sector: true,
            },
            orderBy: [
                { majorHead: "asc" },
                { minorHead: "asc" },
                { detailHead: "asc" },
            ],
        });

        logger.info(
            `Form7A: Fetched ${rows.length} rows from Expenditure table (date-filtered: ${!!(from && to)})`
        );

        // ── Group: majorHead → minorHead → detailHead ────────────
        // Structure:
        // {
        //   "0028": {
        //     majorHead: "0028",
        //     majorTotal: 0,
        //     minorHeads: {
        //       "101": {
        //         minorHead: "101",
        //         minorTotal: 0,
        //         detailHeads: {
        //           "001": {
        //             detailHead: "001",
        //             detailTotal: 0,
        //             entries: [ { voucherNo, date, amount } ]
        //           }
        //         }
        //       }
        //     }
        //   }
        // }

        const grouped = {};
        let grandTotal = 0;

        rows.forEach((row) => {
            const mh = row.majorHead ?? "Unknown";
            const mnh = row.minorHead ?? "-";
            const dh = row.detailHead ?? "-";
            const amt = parseFloat(row.grossAmount ?? 0);

            // Initialize majorHead
            if (!grouped[mh]) {
                grouped[mh] = {
                    majorHead: mh,
                    majorTotal: 0,
                    minorHeads: {},
                };
            }

            // Initialize minorHead
            if (!grouped[mh].minorHeads[mnh]) {
                grouped[mh].minorHeads[mnh] = {
                    minorHead: mnh,
                    minorTotal: 0,
                    detailHeads: {},
                };
            }

            // Initialize detailHead
            if (!grouped[mh].minorHeads[mnh].detailHeads[dh]) {
                grouped[mh].minorHeads[mnh].detailHeads[dh] = {
                    detailHead: dh,
                    detailTotal: 0,
                    entries: [],
                };
            }

            // Push entry
            grouped[mh].minorHeads[mnh].detailHeads[dh].entries.push({
                id: row.id,
                voucherNo: row.voucherNo ?? "-",
                date: row.voucherDate
                    ? new Date(row.voucherDate).toLocaleDateString()
                    : "-",
                amount: amt,
            });

            // Add to totals at each level
            grouped[mh].minorHeads[mnh].detailHeads[dh].detailTotal += amt;
            grouped[mh].minorHeads[mnh].minorTotal += amt;
            grouped[mh].majorTotal += amt;
            grandTotal += amt;
        });

        // Convert to sorted arrays
        const result = Object.values(grouped)
            .sort((a, b) => a.majorHead.localeCompare(b.majorHead))
            .map((mhGroup) => ({
                ...mhGroup,
                minorHeads: Object.values(mhGroup.minorHeads)
                    .sort((a, b) => a.minorHead.localeCompare(b.minorHead))
                    .map((mnhGroup) => ({
                        ...mnhGroup,
                        detailHeads: Object.values(mnhGroup.detailHeads)
                            .sort((a, b) => a.detailHead.localeCompare(b.detailHead)),
                    })),
            }));

        logger.info(`Form 7A total majorHead groups: ${result.length}`);

        return { groups: result, grandTotal };
    } catch (error) {
        logger.error(`Error fetching Form 7A data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// FORM 7B - Compilation Sheet (Receipts)
//
// SECTOR RULES (REPLACED — now matches Form7's COUNCIL/STATE rule):
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
// ChallanTwo is REMOVED entirely — not part of the new spec.
//
// 🔸 dateRange support (same as Form6/Form7/Form7A):
//   - challan          filtered on challanDate
//   - challanFromBill  filtered on voucharDate
//   - stateChallan     filtered on challanDate
//   - only applied when BOTH from and to are supplied
//
// Grouped by: majorHead → minorHead
// Shows subtotal after each minorHead and majorHead group
// ─────────────────────────────────────────────────────────────

// Same "Amount Remitted" majorHead range as Form 7 / Form 4 / Form 5A:
// 001-016, plus 661 and 664.
const FORM7B_AMOUNT_REMITTED_MAJOR_HEADS = [
    ...Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(3, "0")), // 001..016
    "661",
    "664",
];

// ════════════════════════════════════════════════════════════
// COUNCIL — Challan + ChallanFromBill, majorHead 001-016/661/664,
// sector/challanType IN (COUNCIL, STATE)
// 🔸 dateRange applied: Challan on challanDate, ChallanFromBill on voucharDate
// ════════════════════════════════════════════════════════════
const getForm7BCouncilRows = async (dateRange = {}) => {
    const { from, to } = dateRange;
    const remittanceSectors = ["COUNCIL", "STATE"];

    const [challanRows, challanFromBillRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: { in: remittanceSectors },
                majorHead: { in: FORM7B_AMOUNT_REMITTED_MAJOR_HEADS },
                ...buildDateRangeWhere(from, to, "challanDate"),
            },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: remittanceSectors },
                majorHead: { in: FORM7B_AMOUNT_REMITTED_MAJOR_HEADS },
                ...buildDateRangeWhere(from, to, "voucharDate"),
            },
        }),
    ]);

    logger.info(
        `Form7B (COUNCIL): challan(majorHead-filtered, sector IN COUNCIL,STATE)=${challanRows.length}, ` +
        `challanFromBill(majorHead-filtered, sector IN COUNCIL,STATE)=${challanFromBillRows.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    return { challanRows, challanFromBillRows };
};

// ════════════════════════════════════════════════════════════
// STATE — StateChallan ONLY, unfiltered by majorHead
// 🔸 dateRange applied on challanDate
// ════════════════════════════════════════════════════════════
const getForm7BStateRows = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const stateChallanRows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
            ...buildDateRangeWhere(from, to, "challanDate"),
        },
        select: {
            id: true,
            challanNo: true,
            challanDate: true,
            totalAmount: true,
            majorHead: true,
            minorHead: true,
        },
        orderBy: { challanDate: "asc" },
    });

    logger.info(
        `Form7B (STATE): stateChallan=${stateChallanRows.length}, date-filtered: ${!!(from && to)}`
    );

    return { stateChallanRows };
};

export const getForm7BData = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 7B data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        let challanRows = [];
        let challanFromBillRows = [];
        let stateChallanRows = [];

        if (isStateSector) {
            const stateData = await getForm7BStateRows(dateRange);
            stateChallanRows = stateData.stateChallanRows;
        } else if (isCouncilSector) {
            const councilData = await getForm7BCouncilRows(dateRange);
            challanRows = councilData.challanRows;
            challanFromBillRows = councilData.challanFromBillRows;
        } else if (isConsolidated) {
            const [councilData, stateData] = await Promise.all([
                getForm7BCouncilRows(dateRange),
                getForm7BStateRows(dateRange),
            ]);
            challanRows = councilData.challanRows;
            challanFromBillRows = councilData.challanFromBillRows;
            stateChallanRows = stateData.stateChallanRows;
        } else {
            logger.info(
                `Form7B: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        logger.info(
            `Form7B: Rows going into grouping — challan=${challanRows.length}, ` +
            `challanFromBill=${challanFromBillRows.length}, stateChallan=${stateChallanRows.length}`
        );

        // ── Sanitize all rows into same plain shape ───────────────
        const allEntries = [
            // From challan
            ...challanRows.map((row) => ({
                majorHead: row.majorHead ?? "Unknown",
                minorHead: row.minorHead ?? "-",
                cashbookNo: row.challanNo ?? "-",
                date: row.challanDate
                    ? new Date(row.challanDate).toLocaleDateString()
                    : "-",
                amount: parseFloat(row.amount?.toString() ?? "0"),
                source: "challan",
            })),

            // From challanFromBill
            ...challanFromBillRows.map((row) => ({
                majorHead: row.majorHead ?? "Unknown",
                minorHead: row.minorHead ?? "-",
                cashbookNo: row.challanNo ?? "-",
                date: row.voucharDate
                    ? new Date(row.voucharDate).toLocaleDateString()
                    : "-",
                amount: parseFloat(row.amount?.toString() ?? "0"),
                source: "challanFromBill",
            })),

            // ─────────────────────────────────────────────────────
            // From stateChallan
            // date = challanDate
            // Only include rows where amount > 0
            // For sector = STATE, this is the ONLY source contributing entries.
            // ─────────────────────────────────────────────────────
            ...stateChallanRows
                .filter((row) => row.totalAmount != null && row.totalAmount > 0)
                .map((row) => ({
                    majorHead: row.majorHead ?? "Unknown",
                    minorHead: row.minorHead ?? "-",
                    cashbookNo: row.challanNo ?? "-",
                    date: row.challanDate
                        ? new Date(row.challanDate).toLocaleDateString()
                        : "-",
                    amount: parseFloat((row.totalAmount).toFixed(2)),
                    source: "stateChallan",
                })),
        ];

        // ── Group: majorHead → minorHead ─────────────────────────
        const grouped = {};
        let grandTotal = 0;

        allEntries.forEach((entry) => {
            const mh = entry.majorHead;
            const mnh = entry.minorHead;
            const amt = entry.amount;

            if (!grouped[mh]) {
                grouped[mh] = {
                    majorHead: mh,
                    majorTotal: 0,
                    minorHeads: {},
                };
            }

            if (!grouped[mh].minorHeads[mnh]) {
                grouped[mh].minorHeads[mnh] = {
                    minorHead: mnh,
                    minorTotal: 0,
                    entries: [],
                };
            }

            grouped[mh].minorHeads[mnh].entries.push({
                cashbookNo: entry.cashbookNo,
                date: entry.date,
                amount: amt,
            });

            grouped[mh].minorHeads[mnh].minorTotal += amt;
            grouped[mh].majorTotal += amt;
            grandTotal += amt;
        });

        // ── Convert to sorted plain arrays ───────────────────────
        const result = Object.values(grouped)
            .sort((a, b) => a.majorHead.localeCompare(b.majorHead))
            .map((mhGroup) => ({
                majorHead: mhGroup.majorHead,
                majorTotal: mhGroup.majorTotal,
                minorHeads: Object.values(mhGroup.minorHeads)
                    .sort((a, b) => a.minorHead.localeCompare(b.minorHead))
                    .map((mnhGroup) => ({
                        minorHead: mnhGroup.minorHead,
                        minorTotal: mnhGroup.minorTotal,
                        entries: mnhGroup.entries,
                    })),
            }));

        logger.info(`Form 7B total majorHead groups: ${result.length}`);

        return { groups: result, grandTotal };
    } catch (error) {
        logger.error(`Error fetching Form 7B data: ${error.message}`);
        throw error;
    }
};



// ─────────────────────────────────────────────────────────────
// FORM 8 - Receipt Schedule (Revenue Head)
//
// SECTOR RULES (REPLACED):
// - sector === "COUNCIL"
//     Revenue Receipt of the Council:
//       (a) Challan, majorHead IN 001–016, no sector filter.
//       (b) challanFromBill, sector IN (COUNCIL, STATE),
//           majorHead IN 001–016.
//     Grants in Aid / Other Misc Receipt: nil (always 0).
//
// - sector === "STATE"
//     Revenue Receipt of the Council: nil (always 0).
//     Grants in Aid received from Govt:
//       StateChallan, majorHead 2011–3999 AND detailHead IN (31, 32)
//       — every matching entry included.
//     Other Misc Receipt:
//       StateChallan, majorHead 2011–3999, EXCLUDING detailHead 31/32.
//
// - sector === "CONSOLIDATED" → COUNCIL's rows + STATE's rows, merged.
// - any other sector          → no rule defined, empty result.
//
// HEAD NAME RESOLUTION:
//   - Challan / challanFromBill rows store head *codes* — resolved to
//     names via the parent-aware ChallanHeads table.
//   - StateChallan rows store head *codes* — resolved to names via the
//     flat, sector-scoped Heads table (full chain match).
//   - A code of "0"/"00"/empty resolves to name: null and is left out
//     of the printed nomenclature line.
//   - Each row carries both a `classification` array
//     ({ level, code, name }[]) and a pre-joined `nomenclature` string
//     ("Name - Code", one level per line) for direct display.
//
// 🔸 dateRange support (same as Form6/7/7A/7B):
//   - challan          filtered on challanDate
//   - challanFromBill  filtered on voucharDate
//   - stateChallan     filtered on challanDate
//   - only applied when BOTH from and to are supplied
// ─────────────────────────────────────────────────────────────

const FORM8_COUNCIL_REVENUE_MAJOR_HEAD_MIN = 1;
const FORM8_COUNCIL_REVENUE_MAJOR_HEAD_MAX = 16;

const FORM8_STATE_MAJOR_HEAD_MIN = 2011;
const FORM8_STATE_MAJOR_HEAD_MAX = 3999;

const FORM8_STATE_GRANTS_DETAIL_HEADS = ["31", "32"];

// A majorHead in the [min, max] numeric range, tolerant of
// zero-padding ("001", "0016", "2011", etc).
const isMajorHeadInRange = (majorHead, min, max) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= min && num <= max;
};

// A head code counts as "empty" (→ name: null, per spec) when it's
// missing, blank, "0", or "00".
const isEmptyHeadCode = (code) => {
    if (code === null || code === undefined) return true;
    const trimmed = code.toString().trim();
    return trimmed === "" || trimmed === "0" || trimmed === "00";
};

// ── ChallanHeads (parent-aware) index — used for Challan & challanFromBill ──
// ChallanHeads links each level's code+name to its own parent's code,
// so the same code can be reused legitimately under different parents.
const buildChallanHeadsIndex = async () => {
    const heads = await prisma.challanHeads.findMany({ where: { isActive: true } });

    const majorIndex = new Map();      // majorHeadCode -> name
    const subMajorIndex = new Map();   // `${majorHeadCode}|${subMajorCode}` -> name
    const minorIndex = new Map();      // `${subMajorCode}|${minorHeadCode}` -> name
    const subHeadIndex = new Map();    // `${minorHeadCode}|${subHeadCode}` -> name
    const subSubHeadIndex = new Map(); // `${subHeadCode}|${subSubHeadCode}` -> name
    const detailHeadIndex = new Map(); // `${subSubHeadCode}|${detailHeadCode}` -> name

    heads.forEach((h) => {
        if (!isEmptyHeadCode(h.majorHeadCode)) majorIndex.set(h.majorHeadCode, h.majorHead);
        if (!isEmptyHeadCode(h.subMajorCode)) subMajorIndex.set(`${h.subMajorParentCode}|${h.subMajorCode}`, h.subMajor);
        if (!isEmptyHeadCode(h.minorHeadCode)) minorIndex.set(`${h.minorHeadParentCode}|${h.minorHeadCode}`, h.minorHead);
        if (!isEmptyHeadCode(h.subHeadCode)) subHeadIndex.set(`${h.subHeadParentCode}|${h.subHeadCode}`, h.subHead);
        if (!isEmptyHeadCode(h.subSubHeadCode)) subSubHeadIndex.set(`${h.subSubHeadParentCode}|${h.subSubHeadCode}`, h.subSubHead);
        if (!isEmptyHeadCode(h.detailHeadCode)) detailHeadIndex.set(`${h.detailHeadParentCode}|${h.detailHeadCode}`, h.detailHead);
    });

    return { majorIndex, subMajorIndex, minorIndex, subHeadIndex, subSubHeadIndex, detailHeadIndex };
};

// Resolve a { level, code, name }[] chain for a Challan/challanFromBill
// row's codes, walking the parent-aware ChallanHeads indices level by
// level. Only levels present on `codes` are included (challanFromBill
// only has 3 levels; Challan has 6).
const resolveChallanHeadsChain = (codes, index) => {
    const { majorHead, subMajorHead, minorHead, subHead, subSubHead, detailHead } = codes;
    const chain = [];

    const push = (level, code, name) => {
        chain.push({ level, code: code ?? null, name: isEmptyHeadCode(code) ? null : name ?? null });
    };

    push("majorHead", majorHead, index.majorIndex.get(majorHead));
    if (subMajorHead !== undefined) {
        push("subMajorHead", subMajorHead, index.subMajorIndex.get(`${majorHead}|${subMajorHead}`));
    }
    if (minorHead !== undefined) {
        push("minorHead", minorHead, index.minorIndex.get(`${subMajorHead}|${minorHead}`));
    }
    if (subHead !== undefined) {
        push("subHead", subHead, index.subHeadIndex.get(`${minorHead}|${subHead}`));
    }
    if (subSubHead !== undefined) {
        push("subSubHead", subSubHead, index.subSubHeadIndex.get(`${subHead}|${subSubHead}`));
    }
    if (detailHead !== undefined) {
        push("detailHead", detailHead, index.detailHeadIndex.get(`${subSubHead}|${detailHead}`));
    }

    return chain;
};

// ── Heads (flat full-chain) index — used for StateChallan ──
// Heads has no parent-code columns: each row is one complete path
// (major → subDetail) scoped to a sector, so we key by the exact
// combination of codes on the row.
const buildHeadsChainKey = (obj) =>
    [
        obj.majorHeadCode,
        obj.subMajorCode,
        obj.minorHeadCode,
        obj.subHeadCode,
        obj.subSubHeadCode,
        obj.detailHeadCode,
        obj.subDetailHeadCode,
    ]
        .map((c) => (c ?? "").toString().trim())
        .join("|");

const buildHeadsFullChainIndex = async (sector) => {
    const heads = await prisma.heads.findMany({ where: { isActive: true, sector } });
    const map = new Map();
    heads.forEach((h) => map.set(buildHeadsChainKey(h), h));
    return map;
};

// Resolve a { level, code, name }[] chain for a StateChallan row
// against the flat Heads full-chain index.
const resolveStateChallanHeadsChain = (row, headsIndex) => {
    const key = buildHeadsChainKey({
        majorHeadCode: row.majorHead,
        subMajorCode: row.subMajorHead,
        minorHeadCode: row.minorHead,
        subHeadCode: row.subHead,
        subSubHeadCode: row.subSubHead,
        detailHeadCode: row.detailHead,
        subDetailHeadCode: row.subDetailHead,
    });
    const match = headsIndex.get(key);

    return [
        ["majorHead", row.majorHead, match?.majorHead],
        ["subMajorHead", row.subMajorHead, match?.subMajor],
        ["minorHead", row.minorHead, match?.minorHead],
        ["subHead", row.subHead, match?.subHead],
        ["subSubHead", row.subSubHead, match?.subSubHead],
        ["detailHead", row.detailHead, match?.detailHead],
        ["subDetailHead", row.subDetailHead, match?.subDetailHead],
    ]
        .filter(([, code]) => code !== undefined && code !== null)
        .map(([level, code, name]) => ({
            level,
            code,
            name: isEmptyHeadCode(code) ? null : name ?? null,
        }));
};

// "MajorHeadName - Code" / "SubMajorName - Code" / ... one level per
// line, skipping levels that resolved to name: null.
const buildNomenclatureFromChain = (chain) => {
    const lines = chain.filter((c) => c.name !== null).map((c) => `${c.name} - ${c.code}`);
    return lines.length > 0 ? lines.join("\n") : "-";
};

// ════════════════════════════════════════════════════════════
// COUNCIL
// Revenue Receipt = Challan (majorHead 001-016, no sector filter)
//                  + challanFromBill (sector IN COUNCIL,STATE, majorHead 001-016)
// Grants in Aid / Misc Receipt = nil
// ════════════════════════════════════════════════════════════
const getForm8CouncilRows = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const [challanRows, challanFromBillRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                ...buildDateRangeWhere(from, to, "challanDate"),
            },
            select: {
                id: true,
                challanNo: true,
                challanDate: true,
                majorHead: true,
                subMajorHead: true,
                minorHead: true,
                subHead: true,
                subSubHead: true,
                detailHead: true,
                amount: true,
            },
            orderBy: { challanDate: "asc" },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: ["COUNCIL", "STATE"] },
                ...buildDateRangeWhere(from, to, "voucharDate"),
            },
            select: {
                id: true,
                challanNo: true,
                voucharDate: true,
                majorHead: true,
                subMajor: true,
                minorHead: true,
                amount: true,
            },
            orderBy: { voucharDate: "asc" },
        }),
    ]);

    // majorHead isn't reliably comparable in SQL across zero-padding
    // variants, so the 001–016 range is applied in JS.
    const revenueChallanRows = challanRows.filter((row) =>
        isMajorHeadInRange(row.majorHead, FORM8_COUNCIL_REVENUE_MAJOR_HEAD_MIN, FORM8_COUNCIL_REVENUE_MAJOR_HEAD_MAX)
    );
    const revenueChallanFromBillRows = challanFromBillRows.filter((row) =>
        isMajorHeadInRange(row.majorHead, FORM8_COUNCIL_REVENUE_MAJOR_HEAD_MIN, FORM8_COUNCIL_REVENUE_MAJOR_HEAD_MAX)
    );

    logger.info(
        `Form8 (COUNCIL): challan(majorHead 001-016)=${revenueChallanRows.length}, ` +
        `challanFromBill(sector IN COUNCIL,STATE, majorHead 001-016)=${revenueChallanFromBillRows.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    const challanHeadsIndex = await buildChallanHeadsIndex();
    const rows = [];

    revenueChallanRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        const classification = resolveChallanHeadsChain(
            {
                majorHead: row.majorHead,
                subMajorHead: row.subMajorHead,
                minorHead: row.minorHead,
                subHead: row.subHead,
                subSubHead: row.subSubHead,
                detailHead: row.detailHead,
            },
            challanHeadsIndex
        );

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            classification,
            nomenclature: buildNomenclatureFromChain(classification),
            councilRevenue: amount,
            grantsInAid: 0,
            miscReceipt: 0,
            total: amount,
            source: "challan-revenue",
        });
    });

    revenueChallanFromBillRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        const classification = resolveChallanHeadsChain(
            { majorHead: row.majorHead, subMajorHead: row.subMajor, minorHead: row.minorHead },
            challanHeadsIndex
        );

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            classification,
            nomenclature: buildNomenclatureFromChain(classification),
            councilRevenue: amount,
            grantsInAid: 0,
            miscReceipt: 0,
            total: amount,
            source: "challanFromBill-revenue",
        });
    });

    logger.info(`Form8 (COUNCIL): total rows=${rows.length}`);

    return rows;
};

// ════════════════════════════════════════════════════════════
// STATE
// Grants in Aid = StateChallan, majorHead 2011-3999, detailHead IN (31,32)
// Other Misc    = StateChallan, majorHead 2011-3999, detailHead NOT IN (31,32)
// Revenue Receipt = nil
// ════════════════════════════════════════════════════════════
const getForm8StateRows = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const stateChallanRows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
            ...buildDateRangeWhere(from, to, "challanDate"),
        },
        select: {
            id: true,
            challanNo: true,
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

    const rangeRows = stateChallanRows.filter((row) =>
        isMajorHeadInRange(row.majorHead, FORM8_STATE_MAJOR_HEAD_MIN, FORM8_STATE_MAJOR_HEAD_MAX)
    );

    const grantsRows = rangeRows.filter((row) =>
        FORM8_STATE_GRANTS_DETAIL_HEADS.includes((row.detailHead ?? "").toString().trim())
    );
    const miscRows = rangeRows.filter(
        (row) => !FORM8_STATE_GRANTS_DETAIL_HEADS.includes((row.detailHead ?? "").toString().trim())
    );

    logger.info(
        `Form8 (STATE): stateChallan(majorHead 2011-3999)=${rangeRows.length}, ` +
        `grants(detailHead 31/32)=${grantsRows.length}, misc(other detailHead)=${miscRows.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    const headsIndex = await buildHeadsFullChainIndex("STATE");
    const rows = [];

    const pushStateRow = (row, bucket) => {
        if (row.totalAmount == null || row.totalAmount === 0) return;
        const amount = parseFloat(row.totalAmount.toFixed(2));
        const classification = resolveStateChallanHeadsChain(row, headsIndex);

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            classification,
            nomenclature: buildNomenclatureFromChain(classification),
            councilRevenue: 0,
            grantsInAid: bucket === "grants" ? amount : 0,
            miscReceipt: bucket === "misc" ? amount : 0,
            total: amount,
            source: bucket === "grants" ? "stateChallan-grants" : "stateChallan-misc",
        });
    };

    grantsRows.forEach((row) => pushStateRow(row, "grants"));
    miscRows.forEach((row) => pushStateRow(row, "misc"));

    return rows;
};

export const getForm8Data = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 8 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let rows = [];

        if (isStateSector) {
            rows = await getForm8StateRows(dateRange);
        } else if (isCouncilSector) {
            rows = await getForm8CouncilRows(dateRange);
        } else if (isConsolidated) {
            const [stateRows, councilRows] = await Promise.all([
                getForm8StateRows(dateRange),
                getForm8CouncilRows(dateRange),
            ]);
            rows = [...stateRows, ...councilRows];
        } else {
            logger.info(`Form8: no rule defined for sector "${sector}" — returning empty result`);
        }

        const totals = rows.reduce(
            (acc, row) => ({
                councilRevenue: acc.councilRevenue + row.councilRevenue,
                grantsInAid: acc.grantsInAid + row.grantsInAid,
                miscReceipt: acc.miscReceipt + row.miscReceipt,
                total: acc.total + row.total,
            }),
            { councilRevenue: 0, grantsInAid: 0, miscReceipt: 0, total: 0 }
        );

        logger.info(`Form 8 total rows: ${rows.length}`);

        return { rows, totals };
    } catch (error) {
        logger.error(`Error fetching Form 8 data: ${error.message}`);
        throw error;
    }
};





// ─────────────────────────────────────────────────────────────
// FORM 9 - Payment Schedule (Revenue Head)
// Data from: Expenditure table
// Columns: voucherNo, majorHead, detailHead (dept), payOfficers,
//          payEstablishment, allowanceHonorary, contingencies,
//          grantsInAid, works, transferPayment, grossAmount (total)
// Bottom: grand total for each column
//
// SECTOR RULES:
// - sector === "COUNCIL"      → Expenditure, majorHead IN 201-224,
//                                 sector = COUNCIL.
// - sector === "STATE"        → Expenditure, majorHead IN 2011-3999,
//                                 sector = STATE.
// - sector === "CONSOLIDATED" → COUNCIL's rows + STATE's rows,
//                                 merged.
// - any other sector          → no rule defined, empty result.
//
// 🔸 dateRange support (same as Form6/7/7A/7B/8):
//   - Expenditure filtered on voucherDate
//   - only applied when BOTH from and to are supplied
// ─────────────────────────────────────────────────────────────

const FORM9_COUNCIL_MAJOR_HEAD_MIN = 201;
const FORM9_COUNCIL_MAJOR_HEAD_MAX = 224;

const FORM9_STATE_MAJOR_HEAD_MIN = 2011;
const FORM9_STATE_MAJOR_HEAD_MAX = 3999;

// A majorHead in the [min, max] numeric range, tolerant of
// zero-padding ("0201", "201", "2011", etc).
const isMajorHeadInRangeForm9 = (majorHead, min, max) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= min && num <= max;
};

const sanitizeForm9Row = (row) => {
    const payOfficers = parseFloat(row.payOfficers?.toString() ?? "0");
    const payEstablishment = parseFloat(row.payEstablishment?.toString() ?? "0");
    const allowanceHonorary = parseFloat(row.allowanceHonorary?.toString() ?? "0");
    const contingencies = parseFloat(row.contingencies?.toString() ?? "0");
    const grantsInAid = parseFloat(row.grantsInAid?.toString() ?? "0");
    const works = parseFloat(row.works?.toString() ?? "0");
    const transferPayment = parseFloat(row.transferPayment?.toString() ?? "0");

    // Total = sum of all amount columns
    const totalPayment =
        payOfficers + payEstablishment + allowanceHonorary +
        contingencies + grantsInAid + works + transferPayment;

    return {
        id: row.id,
        voucherNo: row.voucherNo ?? "-",
        majorHead: row.majorHead ?? "-",
        detailHead: row.detailHead ?? "-",
        payOfficers,
        payEstablishment,
        allowanceHonorary,
        contingencies,
        grantsInAid,
        works,
        transferPayment,
        totalPayment,
    };
};

// ════════════════════════════════════════════════════════════
// COUNCIL — Expenditure, majorHead 201-224, sector = COUNCIL
// ════════════════════════════════════════════════════════════
const getForm9CouncilRows = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "COUNCIL",
            ...buildDateRangeWhere(from, to, "voucherDate"),
        },
        select: {
            id: true,
            voucherNo: true,
            voucherDate: true,
            majorHead: true,
            detailHead: true,
            payOfficers: true,
            payEstablishment: true,
            allowanceHonorary: true,
            contingencies: true,
            grantsInAid: true,
            works: true,
            transferPayment: true,
        },
        orderBy: { voucherDate: "asc" },
    });

    const filtered = rows.filter((row) =>
        isMajorHeadInRangeForm9(row.majorHead, FORM9_COUNCIL_MAJOR_HEAD_MIN, FORM9_COUNCIL_MAJOR_HEAD_MAX)
    );

    logger.info(
        `Form9 (COUNCIL): fetched=${rows.length}, majorHead(201-224)=${filtered.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    return filtered.map(sanitizeForm9Row);
};

// ════════════════════════════════════════════════════════════
// STATE — Expenditure, majorHead 2011-3999, sector = STATE
// ════════════════════════════════════════════════════════════
const getForm9StateRows = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            ...buildDateRangeWhere(from, to, "voucherDate"),
        },
        select: {
            id: true,
            voucherNo: true,
            voucherDate: true,
            majorHead: true,
            detailHead: true,
            payOfficers: true,
            payEstablishment: true,
            allowanceHonorary: true,
            contingencies: true,
            grantsInAid: true,
            works: true,
            transferPayment: true,
        },
        orderBy: { voucherDate: "asc" },
    });

    const filtered = rows.filter((row) =>
        isMajorHeadInRangeForm9(row.majorHead, FORM9_STATE_MAJOR_HEAD_MIN, FORM9_STATE_MAJOR_HEAD_MAX)
    );

    logger.info(
        `Form9 (STATE): fetched=${rows.length}, majorHead(2011-3999)=${filtered.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    return filtered.map(sanitizeForm9Row);
};

export const getForm9Data = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 9 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isCouncilSector = sector === "COUNCIL";
        const isStateSector = sector === "STATE";
        const isConsolidated = sector === "CONSOLIDATED";

        let sanitized = [];

        if (isCouncilSector) {
            sanitized = await getForm9CouncilRows(dateRange);
        } else if (isStateSector) {
            sanitized = await getForm9StateRows(dateRange);
        } else if (isConsolidated) {
            const [councilRows, stateRows] = await Promise.all([
                getForm9CouncilRows(dateRange),
                getForm9StateRows(dateRange),
            ]);
            sanitized = [...councilRows, ...stateRows];
        } else {
            logger.info(`Form9: no rule defined for sector "${sector}" — returning empty result`);
        }

        // Grand totals per column
        const grandTotals = sanitized.reduce(
            (acc, row) => ({
                payOfficers: acc.payOfficers + row.payOfficers,
                payEstablishment: acc.payEstablishment + row.payEstablishment,
                allowanceHonorary: acc.allowanceHonorary + row.allowanceHonorary,
                contingencies: acc.contingencies + row.contingencies,
                grantsInAid: acc.grantsInAid + row.grantsInAid,
                works: acc.works + row.works,
                transferPayment: acc.transferPayment + row.transferPayment,
                totalPayment: acc.totalPayment + row.totalPayment,
            }),
            {
                payOfficers: 0,
                payEstablishment: 0,
                allowanceHonorary: 0,
                contingencies: 0,
                grantsInAid: 0,
                works: 0,
                transferPayment: 0,
                totalPayment: 0,
            }
        );

        logger.info(`Form 9 total rows: ${sanitized.length}`);

        return { rows: sanitized, grandTotals };
    } catch (error) {
        logger.error(`Error fetching Form 9 data: ${error.message}`);
        throw error;
    }
};



// ─────────────────────────────────────────────────────────────
// FORM 10 - Receipts and Payment Schedules (Dept-Deposit Heads)
//
// SECTOR RULES:
// - sector === "COUNCIL"
//     Receipt:
//       (a) Challan, majorHead IN 661-665.
//       (b) challanFromBill, sector = COUNCIL, majorHead IN
//           (8443, 661, 662, 663, 664, 665).
//     Payment:
//       (a) Expenditure, majorHead IN 661-665, sector = COUNCIL.
//       (b) challanFromBill, sector = COUNCIL, majorHead IN
//           (8443, 662).
//
// - sector === "STATE"
//     Receipt: challanFromBill, sector = STATE, majorHead = 8443.
//     Payment: challanFromBill, sector = STATE, majorHead = 8443.
//
// - sector === "CONSOLIDATED" → COUNCIL's rows + STATE's rows, merged.
// - any other sector          → no rule defined, empty result.
//
// CASH BOOK ITEM NO:
//   - Challan          → challanNo
//   - challanFromBill  → challanNo
//   - Expenditure      → voucherNo
//
// NAME OF THE WORK/SCHEME:
//   Head codes are resolved to head NAMES via the parent-aware
//   ChallanHeads table (same lookup used for Form 8) — Challan rows
//   resolve all 6 levels (major→detailHead), challanFromBill rows
//   resolve 3 levels (major/subMajor/minor), Expenditure rows
//   resolve all 6 levels. A code of "0"/"00"/empty resolves to
//   name: null and is skipped in the printed string.
//
// 🔸 dateRange support (same as Form6/7/7A/7B/8/9):
//   - Challan          filtered on challanDate
//   - challanFromBill  filtered on voucharDate
//   - Expenditure      filtered on voucherDate
//   - only applied when BOTH from and to are supplied
// ─────────────────────────────────────────────────────────────

const FORM10_COUNCIL_HEAD_MIN = 661;
const FORM10_COUNCIL_HEAD_MAX = 665;

const FORM10_CFB_RECEIPT_MAJOR_HEADS = ["8443", "661", "662", "663", "664", "665"];
const FORM10_CFB_PAYMENT_MAJOR_HEADS = ["8443", "662"];
const FORM10_STATE_CFB_MAJOR_HEAD = "8443";

const isMajorHeadInRangeForm10 = (majorHead, min, max) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= min && num <= max;
};

const isMajorHeadInListForm10 = (majorHead, targets) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    if (Number.isNaN(num)) return false;
    return targets.some((t) => parseInt(t, 10) === num);
};

const isEmptyHeadCodeForm10 = (code) => {
    if (code === null || code === undefined) return true;
    const trimmed = code.toString().trim();
    return trimmed === "" || trimmed === "0" || trimmed === "00";
};

// ── ChallanHeads (parent-aware) index — reused pattern from Form 8 ──
const buildChallanHeadsIndexForm10 = async () => {
    const heads = await prisma.challanHeads.findMany({ where: { isActive: true } });

    const majorIndex = new Map();
    const subMajorIndex = new Map();
    const subMajorFallback = new Map();
    const minorIndex = new Map();
    const minorFallback = new Map();
    const subHeadIndex = new Map();
    const subHeadFallback = new Map();
    const subSubHeadIndex = new Map();
    const subSubHeadFallback = new Map();
    const detailHeadIndex = new Map();
    const detailHeadFallback = new Map();

    heads.forEach((h) => {
        if (!isEmptyHeadCodeForm10(h.majorHeadCode)) majorIndex.set(h.majorHeadCode, h.majorHead);

        if (!isEmptyHeadCodeForm10(h.subMajorCode)) {
            subMajorIndex.set(`${h.subMajorParentCode}|${h.subMajorCode}`, h.subMajor);
            if (!subMajorFallback.has(h.subMajorCode)) subMajorFallback.set(h.subMajorCode, h.subMajor);
        }
        if (!isEmptyHeadCodeForm10(h.minorHeadCode)) {
            minorIndex.set(`${h.minorHeadParentCode}|${h.minorHeadCode}`, h.minorHead);
            if (!minorFallback.has(h.minorHeadCode)) minorFallback.set(h.minorHeadCode, h.minorHead);
        }
        if (!isEmptyHeadCodeForm10(h.subHeadCode)) {
            subHeadIndex.set(`${h.subHeadParentCode}|${h.subHeadCode}`, h.subHead);
            if (!subHeadFallback.has(h.subHeadCode)) subHeadFallback.set(h.subHeadCode, h.subHead);
        }
        if (!isEmptyHeadCodeForm10(h.subSubHeadCode)) {
            subSubHeadIndex.set(`${h.subSubHeadParentCode}|${h.subSubHeadCode}`, h.subSubHead);
            if (!subSubHeadFallback.has(h.subSubHeadCode)) subSubHeadFallback.set(h.subSubHeadCode, h.subSubHead);
        }
        if (!isEmptyHeadCodeForm10(h.detailHeadCode)) {
            detailHeadIndex.set(`${h.detailHeadParentCode}|${h.detailHeadCode}`, h.detailHead);
            if (!detailHeadFallback.has(h.detailHeadCode)) detailHeadFallback.set(h.detailHeadCode, h.detailHead);
        }
    });

    return {
        majorIndex,
        subMajorIndex, subMajorFallback,
        minorIndex, minorFallback,
        subHeadIndex, subHeadFallback,
        subSubHeadIndex, subSubHeadFallback,
        detailHeadIndex, detailHeadFallback,
    };
};

// Resolve a name chain for a row's codes — parent-scoped match first,
// falling back to a code-only match across the whole table. Only
// levels present on `codes` are included (challanFromBill has 3;
// Challan/Expenditure have 6).
const resolveWorkSchemeName = (codes, index) => {
    const { majorHead, subMajorHead, minorHead, subHead, subSubHead, detailHead } = codes;
    const chain = [];

    const resolve = (scopedMap, fallbackMap, scopeKey, code) => {
        if (isEmptyHeadCodeForm10(code)) return null;
        return scopedMap.get(scopeKey) ?? fallbackMap.get(code) ?? null;
    };

    const push = (code, name) => {
        if (!isEmptyHeadCodeForm10(code) && name) chain.push(`${name} - ${code}`);
    };

    push(majorHead, isEmptyHeadCodeForm10(majorHead) ? null : index.majorIndex.get(majorHead) ?? null);
    if (subMajorHead !== undefined) {
        push(subMajorHead, resolve(index.subMajorIndex, index.subMajorFallback, `${majorHead}|${subMajorHead}`, subMajorHead));
    }
    if (minorHead !== undefined) {
        push(minorHead, resolve(index.minorIndex, index.minorFallback, `${subMajorHead}|${minorHead}`, minorHead));
    }
    if (subHead !== undefined) {
        push(subHead, resolve(index.subHeadIndex, index.subHeadFallback, `${minorHead}|${subHead}`, subHead));
    }
    if (subSubHead !== undefined) {
        push(subSubHead, resolve(index.subSubHeadIndex, index.subSubHeadFallback, `${subHead}|${subSubHead}`, subSubHead));
    }
    if (detailHead !== undefined) {
        push(detailHead, resolve(index.detailHeadIndex, index.detailHeadFallback, `${subSubHead}|${detailHead}`, detailHead));
    }

    return chain.length > 0 ? chain.join("\n") : "-";
};

// ════════════════════════════════════════════════════════════
// COUNCIL
// ════════════════════════════════════════════════════════════
const getForm10CouncilRows = async (dateRange = {}, challanHeadsIndex) => {
    const { from, to } = dateRange;

    const [challanRows, expenditureRows, challanFromBillRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                ...buildDateRangeWhere(from, to, "challanDate"),
            },
            select: {
                id: true,
                challanNo: true,
                challanDate: true,
                majorHead: true,
                subMajorHead: true,
                minorHead: true,
                subHead: true,
                subSubHead: true,
                detailHead: true,
                amount: true,
                remarks: true,
            },
            orderBy: { challanDate: "asc" },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...buildDateRangeWhere(from, to, "voucherDate"),
            },
            select: {
                id: true,
                voucherNo: true,
                voucherDate: true,
                majorHead: true,
                subMajorHead: true,
                minorHead: true,
                subHead: true,
                subSubHead: true,
                detailHead: true,
                grossAmount: true,
                remarks: true,
            },
            orderBy: { voucherDate: "asc" },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...buildDateRangeWhere(from, to, "voucharDate"),
            },
            select: {
                id: true,
                challanNo: true,
                voucharDate: true,
                majorHead: true,
                subMajor: true,
                minorHead: true,
                amount: true,
            },
            orderBy: { voucharDate: "asc" },
        }),
    ]);

    const receiptChallanRows = challanRows.filter((row) =>
        isMajorHeadInRangeForm10(row.majorHead, FORM10_COUNCIL_HEAD_MIN, FORM10_COUNCIL_HEAD_MAX)
    );
    const paymentExpenditureRows = expenditureRows.filter((row) =>
        isMajorHeadInRangeForm10(row.majorHead, FORM10_COUNCIL_HEAD_MIN, FORM10_COUNCIL_HEAD_MAX)
    );
    const receiptChallanFromBillRows = challanFromBillRows.filter((row) =>
        isMajorHeadInListForm10(row.majorHead, FORM10_CFB_RECEIPT_MAJOR_HEADS)
    );
    const paymentChallanFromBillRows = challanFromBillRows.filter((row) =>
        isMajorHeadInListForm10(row.majorHead, FORM10_CFB_PAYMENT_MAJOR_HEADS)
    );

    logger.info(
        `Form10 (COUNCIL): challan(661-665)=${receiptChallanRows.length}, ` +
        `expenditure(661-665,COUNCIL)=${paymentExpenditureRows.length}, ` +
        `challanFromBill-receipt(8443/661-665,COUNCIL)=${receiptChallanFromBillRows.length}, ` +
        `challanFromBill-payment(8443/662,COUNCIL)=${paymentChallanFromBillRows.length}, ` +
        `date-filtered: ${!!(from && to)}`
    );

    const rows = [];

    // Receipt — Challan (661-665) — cashBookItemNo = challanNo
    receiptChallanRows.forEach((row) => {
        const receipt = parseFloat(row.amount ?? "0");
        if (!receipt) return;

        rows.push({
            id: `C-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            workScheme: resolveWorkSchemeName(
                {
                    majorHead: row.majorHead,
                    subMajorHead: row.subMajorHead,
                    minorHead: row.minorHead,
                    subHead: row.subHead,
                    subSubHead: row.subSubHead,
                    detailHead: row.detailHead,
                },
                challanHeadsIndex
            ),
            receipt,
            payment: 0,
            remarks: row.remarks ?? "-",
            source: "challan-receipt",
        });
    });

    // Payment — Expenditure (661-665, COUNCIL) — cashBookItemNo = voucherNo
    paymentExpenditureRows.forEach((row) => {
        const payment = parseFloat(row.grossAmount?.toString() ?? "0");
        if (!payment) return;

        rows.push({
            id: `E-${row.id}`,
            cashBookItemNo: row.voucherNo ?? "-",
            workScheme: resolveWorkSchemeName(
                {
                    majorHead: row.majorHead,
                    subMajorHead: row.subMajorHead,
                    minorHead: row.minorHead,
                    subHead: row.subHead,
                    subSubHead: row.subSubHead,
                    detailHead: row.detailHead,
                },
                challanHeadsIndex
            ),
            receipt: 0,
            payment,
            remarks: row.remarks ?? "-",
            source: "expenditure-payment",
        });
    });

    // Receipt — challanFromBill (COUNCIL, 8443/661-665) — cashBookItemNo = challanNo
    receiptChallanFromBillRows.forEach((row) => {
        const receipt = parseFloat(row.amount?.toString() ?? "0");
        if (!receipt) return;

        rows.push({
            id: `CFB-R-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            workScheme: resolveWorkSchemeName(
                { majorHead: row.majorHead, subMajorHead: row.subMajor, minorHead: row.minorHead },
                challanHeadsIndex
            ),
            receipt,
            payment: 0,
            remarks: "-",
            source: "challanFromBill-council-receipt",
        });
    });

    // Payment — challanFromBill (COUNCIL, 8443/662) — cashBookItemNo = challanNo
    paymentChallanFromBillRows.forEach((row) => {
        const payment = parseFloat(row.amount?.toString() ?? "0");
        if (!payment) return;

        rows.push({
            id: `CFB-P-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            workScheme: resolveWorkSchemeName(
                { majorHead: row.majorHead, subMajorHead: row.subMajor, minorHead: row.minorHead },
                challanHeadsIndex
            ),
            receipt: 0,
            payment,
            remarks: "-",
            source: "challanFromBill-council-payment",
        });
    });

    return rows;
};

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
const getForm10StateRows = async (dateRange = {}, challanHeadsIndex) => {
    const { from, to } = dateRange;

    const challanFromBillRows = await prisma.challanFromBill.findMany({
        where: {
            isActive: true,
            sector: "STATE",
            ...buildDateRangeWhere(from, to, "voucharDate"),
        },
        select: {
            id: true,
            challanNo: true,
            voucharDate: true,
            majorHead: true,
            subMajor: true,
            minorHead: true,
            amount: true,
        },
        orderBy: { voucharDate: "asc" },
    });

    const matchRows = challanFromBillRows.filter((row) =>
        isMajorHeadInListForm10(row.majorHead, [FORM10_STATE_CFB_MAJOR_HEAD])
    );

    logger.info(
        `Form10 (STATE): challanFromBill(8443,STATE)=${matchRows.length}, date-filtered: ${!!(from && to)}`
    );

    const rows = [];

    matchRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        rows.push({
            id: `CFB-${row.id}`,
            cashBookItemNo: row.challanNo ?? "-",
            workScheme: resolveWorkSchemeName(
                { majorHead: row.majorHead, subMajorHead: row.subMajor, minorHead: row.minorHead },
                challanHeadsIndex
            ),
            receipt: amount,
            payment: amount,
            remarks: "-",
            source: "challanFromBill-state",
        });
    });

    return rows;
};

export const getForm10Data = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 10 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isCouncilSector = sector === "COUNCIL";
        const isStateSector = sector === "STATE";
        const isConsolidated = sector === "CONSOLIDATED";

        // Shared head-name index — same table/lookup for Challan,
        // challanFromBill, and Expenditure rows.
        const challanHeadsIndex = await buildChallanHeadsIndexForm10();

        let rows = [];

        if (isCouncilSector) {
            rows = await getForm10CouncilRows(dateRange, challanHeadsIndex);
        } else if (isStateSector) {
            rows = await getForm10StateRows(dateRange, challanHeadsIndex);
        } else if (isConsolidated) {
            const [councilRows, stateRows] = await Promise.all([
                getForm10CouncilRows(dateRange, challanHeadsIndex),
                getForm10StateRows(dateRange, challanHeadsIndex),
            ]);
            rows = [...councilRows, ...stateRows];
        } else {
            logger.info(`Form10: no rule defined for sector "${sector}" — returning empty result`);
        }

        const totalReceipts = rows.reduce((sum, r) => sum + r.receipt, 0);
        const totalPayments = rows.reduce((sum, r) => sum + r.payment, 0);
        const netAmount = totalReceipts - totalPayments;

        logger.info(`Form 10 total rows: ${rows.length}`);

        return {
            rows,
            summary: {
                totalReceipts,
                totalPayments,
                netAmount,
            },
        };
    } catch (error) {
        logger.error(`Error fetching Form 10 data: ${error.message}`);
        throw error;
    }
};











// ─────────────────────────────────────────────────────────────
// FORM 11 - Treasury (PLA) Reconciliation Statement
// Month-wise carry-forward table (like Statement 3's Ways & Means).
//
// Row 1 (Balance)     = previous month's Row 4 (carry-forward).
//                        April (month 1 of FY) = fixed opening
//                        balance figure FORM11_APRIL_OPENING_BALANCE
//                        (3066841548.00) for every sector, including
//                        CONSOLIDATED (not doubled).
// Row 2 (Add)         = amount credited but not yet accounted for by
//                        Treasury — sector-specific sources below,
//                        summed by month using each record's own
//                        voucher/challan date.
// Row 3 (Less)        = cheques drawn — sector-specific Expenditure,
//                        summed by month using voucherDate.
// Row 4 (Balance)     = Row1 + Row2 - Row3. Becomes next month's Row 1.
//
// SECTOR RULES:
// - COUNCIL:
//     Row 2 = Challan (challanType=COUNCIL, ALL rows)
//           + challanFromBill (sector IN [COUNCIL, STATE] AND
//             majorHead IN the treasury major-head list:
//             001–016, 661, 664)
//     Row 3 = Expenditure (sector=COUNCIL), ALL rows — no majorHead
//             filter. The majorHead list only applies to
//             challanFromBill, not Expenditure.
//
// - STATE:
//     Row 2 = StateChallan (sector=STATE, ALL rows) ONLY.
//             challanFromBill is NOT part of STATE's Row 2 at all —
//             every challanFromBill row that qualifies (sector
//             COUNCIL or STATE + majorHead in the treasury list)
//             is credited to COUNCIL only, and any challanFromBill
//             row that doesn't match that filter is not counted in
//             Form 11 at all.
//     Row 3 = Expenditure (sector=STATE), ALL rows — no majorHead
//             filter.
//
// - CONSOLIDATED = COUNCIL's monthly Row2/Row3 + STATE's, merged.
//   April opening balance is the SAME single hardcoded figure for
//   STATE/COUNCIL/CONSOLIDATED — CONSOLIDATED does not double it.
//
// MONTH-WISE FILTER BEHAVIOR:
//   The 12-month FY table (April→March) is always built in full,
//   with normal carry-forward from month to month — April's Balance
//   is always the fixed opening figure, and each later month's
//   Balance is the prior month's computed Closing Balance. Applying
//   a `from`/`to` date range narrows which underlying transaction
//   rows get counted into their respective months (e.g. a filter
//   scoped to just May only affects May's Add/Less figures — it
//   does not change the table's row structure or how April's
//   opening balance is set). Filtering to the full financial year
//   naturally reproduces: April Balance = fixed opening figure,
//   and Row 4 (Closing Balance) accumulates normally through March.
//
// 🔸 dateRange support (same as the other forms):
//   - Challan          filtered on challanDate
//   - challanFromBill  filtered on voucharDate
//   - StateChallan     filtered on challanDate
//   - Expenditure      filtered on voucherDate
//   - only applied when BOTH from and to are supplied
// ─────────────────────────────────────────────────────────────

// Major heads that route a challanFromBill (recovery challan) row into
// COUNCIL's Row 2, regardless of whether its own `sector` is COUNCIL or
// STATE. Adjust padding here if the DB stores these differently.
const FORM11_TREASURY_MAJOR_HEADS = [
    "001", "002", "003", "004", "005", "006", "007", "008",
    "009", "010", "011", "012", "013", "014", "015", "016",
    "661", "664",
];

// Fixed April opening balance for every sector (STATE, COUNCIL,
// CONSOLIDATED) — not summed/doubled across sectors.
const FORM11_APRIL_OPENING_BALANCE = 3066841548;

// Financial year months: April(4) to March(3).
const FORM11_FY_MONTHS = [
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

const getMonthNumForm11 = (date) => (date ? new Date(date).getMonth() + 1 : null);

// Sum `amountField` bucketed by the month of `dateField`. Every row
// with a valid date counts — no mismatch/comparison filter.
const sumByMonthForm11 = (records, dateField, amountField) => {
    const map = new Map();
    for (const r of records) {
        const m = getMonthNumForm11(r[dateField]);
        if (!m) continue;
        map.set(m, (map.get(m) ?? 0) + Number(r[amountField] ?? 0));
    }
    return map;
};

const mergeMonthlyMapsForm11 = (mapA, mapB) => {
    const merged = new Map(mapA);
    for (const [m, amt] of mapB) {
        merged.set(m, (merged.get(m) ?? 0) + amt);
    }
    return merged;
};

// ════════════════════════════════════════════════════════════
// COUNCIL — Row2/Row3 monthly maps
// ════════════════════════════════════════════════════════════
const buildForm11CouncilMonthlyMaps = async (dateRange = {}) => {
    const { from, to } = dateRange;

    const [challanRows, cfbTreasuryRows, expenditureRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                challanType: "COUNCIL",
                ...buildDateRangeWhere(from, to, "challanDate"),
            },
            select: { amount: true, challanDate: true },
        }),
        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: { in: ["COUNCIL", "STATE"] },
                majorHead: { in: FORM11_TREASURY_MAJOR_HEADS },
                ...buildDateRangeWhere(from, to, "voucharDate"),
            },
            select: { amount: true, voucharDate: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...buildDateRangeWhere(from, to, "voucherDate"),
            },
            select: { grossAmount: true, voucherDate: true },
        }),
    ]);

    logger.info(
        `Form11 (COUNCIL): challan=${challanRows.length}, ` +
        `challanFromBill(sector IN [COUNCIL,STATE], majorHead treasury-list)=${cfbTreasuryRows.length}, ` +
        `expenditure=${expenditureRows.length}, date-filtered: ${!!(from && to)}`
    );

    const challanByMonth = sumByMonthForm11(challanRows, "challanDate", "amount");
    const cfbByMonth = sumByMonthForm11(cfbTreasuryRows, "voucharDate", "amount");

    const row2ByMonth = mergeMonthlyMapsForm11(challanByMonth, cfbByMonth);
    const row3ByMonth = sumByMonthForm11(expenditureRows, "voucherDate", "grossAmount");

    return { row2ByMonth, row3ByMonth };
};

// ════════════════════════════════════════════════════════════
// STATE — Row2/Row3 monthly maps
// ════════════════════════════════════════════════════════════
const buildForm11StateMonthlyMaps = async (dateRange = {}) => {
    const { from, to } = dateRange;

    // NOTE: STATE's Row 2 is StateChallan ONLY. challanFromBill is not
    // included here — qualifying challanFromBill rows are credited to
    // COUNCIL instead (see buildForm11CouncilMonthlyMaps above).
    const [stateChallanRows, expenditureRows] = await Promise.all([
        prisma.stateChallan.findMany({
            where: {
                sector: "STATE",
                isActive: true,
                ...buildDateRangeWhere(from, to, "challanDate"),
            },
            select: { totalAmount: true, challanDate: true },
        }),
        prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...buildDateRangeWhere(from, to, "voucherDate"),
            },
            select: { grossAmount: true, voucherDate: true },
        }),
    ]);

    logger.info(
        `Form11 (STATE): stateChallan=${stateChallanRows.length}, ` +
        `expenditure=${expenditureRows.length}, date-filtered: ${!!(from && to)}`
    );

    const row2ByMonth = sumByMonthForm11(stateChallanRows, "challanDate", "totalAmount");
    const row3ByMonth = sumByMonthForm11(expenditureRows, "voucherDate", "grossAmount");

    return { row2ByMonth, row3ByMonth };
};

export const getForm11Data = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        logger.info(
            `Fetching Form 11 data for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL-TIME"}, to: ${to ?? "ALL-TIME"}`
        );

        const isCouncilSector = sector === "COUNCIL";
        const isStateSector = sector === "STATE";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        let row2ByMonth = new Map();
        let row3ByMonth = new Map();

        if (isCouncilSector) {
            const maps = await buildForm11CouncilMonthlyMaps(dateRange);
            row2ByMonth = maps.row2ByMonth;
            row3ByMonth = maps.row3ByMonth;
        } else if (isStateSector) {
            const maps = await buildForm11StateMonthlyMaps(dateRange);
            row2ByMonth = maps.row2ByMonth;
            row3ByMonth = maps.row3ByMonth;
        } else if (isConsolidated) {
            const [councilMaps, stateMaps] = await Promise.all([
                buildForm11CouncilMonthlyMaps(dateRange),
                buildForm11StateMonthlyMaps(dateRange),
            ]);
            row2ByMonth = mergeMonthlyMapsForm11(councilMaps.row2ByMonth, stateMaps.row2ByMonth);
            row3ByMonth = mergeMonthlyMapsForm11(councilMaps.row3ByMonth, stateMaps.row3ByMonth);
        } else {
            logger.info(`Form11: no rule defined for sector "${sector}" — returning empty result`);
        }

        // ── Build month-wise carry-forward rows ──────────────────
        // April's Balance is always the fixed opening figure; every
        // later month's Balance carries forward the previous month's
        // computed Closing Balance. A date-range filter only affects
        // which underlying rows land in row2ByMonth/row3ByMonth for
        // their respective months — it does not alter this structure.
        let carryForward = 0;
        let totalRow2 = 0;
        let totalRow3 = 0;

        const monthlyRows = FORM11_FY_MONTHS.map(({ month, num }, index) => {
            const balance = index === 0 ? FORM11_APRIL_OPENING_BALANCE : carryForward;

            const addAmount = row2ByMonth.get(num) ?? 0;
            const lessAmount = row3ByMonth.get(num) ?? 0;
            const closingBalance = balance + addAmount - lessAmount;

            carryForward = closingBalance;
            totalRow2 += addAmount;
            totalRow3 += lessAmount;

            return {
                monthNum: num,
                month,
                balance: balance.toFixed(2),
                addAmount: addAmount.toFixed(2),
                lessAmount: lessAmount.toFixed(2),
                closingBalance: closingBalance.toFixed(2),
            };
        });

        // Total row — Balance shows the FY's opening figure (April's),
        // Add/Less are summed across all 12 months, Closing Balance is
        // the final month's (March's) running balance — i.e. exactly
        // "given amount + Row2 total - Row3 total" for the full FY.
        monthlyRows.push({
            monthNum: null,
            month: "Total",
            balance: FORM11_APRIL_OPENING_BALANCE.toFixed(2),
            addAmount: totalRow2.toFixed(2),
            lessAmount: totalRow3.toFixed(2),
            closingBalance: carryForward.toFixed(2),
        });

        // ── Backward-compatible annual 4-row summary ─────────────
        const rows = [
            {
                number: 1,
                head: "Balance as shown in the Treasury Pass Book (PLA)",
                amount: FORM11_APRIL_OPENING_BALANCE,
                showTotal: true,
            },
            {
                number: 2,
                head: "Add amount credited by the Council but not accounted for by the Treasury",
                amount: totalRow2,
                showTotal: false,
            },
            {
                number: 3,
                head: "Less Cheques drawn by the Council but not encashed in Treasury",
                amount: totalRow3,
                showTotal: false,
            },
            {
                number: 4,
                head: "Balance as per Cash Book of the Council",
                amount: carryForward,
                showTotal: true,
            },
        ];

        logger.info(`Form 11 monthly rows built: ${monthlyRows.length}`);

        return { rows, monthlyRows };
    } catch (error) {
        logger.error(`Error fetching Form 11 data: ${error.message}`);
        throw error;
    }
};