import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";


// ─────────────────────────────────────────────────────────────
// FORM 7A - Compilation Sheet
// Data from: Expenditure table
// Grouped by: majorHead → minorHead → detailHead
// Shows subtotal after each detailHead, minorHead, majorHead group
// ─────────────────────────────────────────────────────────────
export const getForm7AData = async (sector) => {
    try {
        logger.info(`Fetching Form 7A data for sector: ${sector ?? "ALL"}`);

        const where = { isActive: true };

        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

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

        logger.info(`Form7A: Fetched ${rows.length} rows from Expenditure table`);

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
// Data from 3 tables:
//   challan         → use challanDate
//                     - sector = STATE            → skipped (stateChallan is the only source)
//                     - sector = COUNCIL/CONSOLIDATED → ALL active rows, no challanType filter
//                     - any other sector          → filtered by challanType
//   challanTwo      → grantsInAid amount only, use kaacChallanDate
//                     - sector = STATE / COUNCIL  → skipped
//                     - sector = CONSOLIDATED     → all rows, no filter
//                     - any other sector          → filtered by sector
//   challanFromBill → use voucharDate
//                     - sector = STATE   → skipped
//                     - sector = COUNCIL → union of:
//                         (a) sector = STATE   AND amountType IN allowed 4 types
//                         (b) sector = COUNCIL AND amountType NOT IN excluded types
//                     - sector = CONSOLIDATED → union of:
//                         (a) sector != COUNCIL AND amountType IN allowed 4 types
//                         (b) sector = COUNCIL AND amountType NOT IN excluded types
//                     - any other sector → filtered by sector, amountType IN allowed 4 types (unchanged)
//   stateChallan    → totalAmount * 100000, use challanDate
//                     (STATE / CONSOLIDATED only; the ONLY source when sector = STATE)
// Grouped by: majorHead → minorHead
// Shows subtotal after each minorHead and majorHead group
// ─────────────────────────────────────────────────────────────

const FORM7B_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// Amount types EXCLUDED when pulling COUNCIL-sector challanFromBill rows for Form 7B
const FORM7B_COUNCIL_EXCLUDED_AMOUNT_TYPES = [
    "CGST",
    "SGST",
    "IGST",
    "ITAX",
    "MDRRF",
    "DMFT",
    "Labour Cess",
    "IT Forest Royalty",
    "VAT",
    "Advance Payment",
];

// ── challanFromBill fetch strategy, split out because the rule differs per sector ──
const getForm7BChallanFromBillRows = (sector, isCouncilOnly, isConsolidated) => {
    if (isCouncilOnly) {
        // (a) STATE rows restricted to the 4 allowed amount types
        // (b) COUNCIL rows excluding the Form7B-specific excluded types
        return Promise.all([
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "STATE",
                    amountType: { in: FORM7B_ALLOWED_AMOUNT_TYPES },
                },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    amountType: { notIn: FORM7B_COUNCIL_EXCLUDED_AMOUNT_TYPES },
                },
            }),
        ]).then(([stateTypedRows, councilRows]) => [...stateTypedRows, ...councilRows]);
    }

    if (isConsolidated) {
        // (a) every non-COUNCIL sector, restricted to the 4 allowed amount types (original rule)
        // (b) COUNCIL sector, broader rule — excluding only the Form7B-specific excluded types
        return Promise.all([
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    amountType: { in: FORM7B_ALLOWED_AMOUNT_TYPES },
                    NOT: { sector: "COUNCIL" },
                },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    amountType: { notIn: FORM7B_COUNCIL_EXCLUDED_AMOUNT_TYPES },
                },
            }),
        ]).then(([genericAllowedRows, councilRows]) => [...genericAllowedRows, ...councilRows]);
    }

    // any other specific sector — original, unchanged behaviour
    return prisma.challanFromBill.findMany({
        where: {
            isActive: true,
            amountType: { in: FORM7B_ALLOWED_AMOUNT_TYPES },
            sector,
        },
    });
};

export const getForm7BData = async (sector) => {
    try {
        logger.info(`Fetching Form 7B data for sector: ${sector ?? "ALL"}`);

        const isStateOnly = sector === "STATE";
        const isCouncilOnly = sector === "COUNCIL";
        const isConsolidated = !sector || sector === "CONSOLIDATED";

        // ── Build where clauses ──────────────────────────────────
        // Challan: COUNCIL/CONSOLIDATED → all rows, no challanType filter
        const challanWhere = { isActive: true };
        if (!isStateOnly && !isCouncilOnly && !isConsolidated) {
            challanWhere.challanType = sector;
        }

        // ChallanTwo: STATE/COUNCIL → skipped, CONSOLIDATED → no filter
        const challanTwoWhere = { isActive: true };
        if (sector && sector !== "CONSOLIDATED" && sector !== "STATE") {
            challanTwoWhere.sector = sector;
        }

        const includeStateChallans = isStateOnly || isConsolidated;

        // ── Fetch all tables in parallel ─────────────────────────
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
                : getForm7BChallanFromBillRows(sector, isCouncilOnly, isConsolidated),

            // StateChallan (STATE / CONSOLIDATED only)
            // No isActive field on model — filter by sector = "STATE"
            includeStateChallans
                ? prisma.stateChallan.findMany({
                    where: { sector: "STATE" },
                    select: {
                        id: true,
                        challanNo: true,
                        challanDate: true,
                        totalAmount: true,
                        majorHead: true,
                        minorHead: true,
                    },
                    orderBy: { challanDate: "asc" },
                })
                : Promise.resolve([]),
        ]);

        logger.info(
            `Form7B: challan=${challanRows.length}, challanTwo=${challanTwoRows.length}, ` +
            `challanFromBill=${challanFromBillRows.length}, stateChallan=${stateChallanRows.length}`
        );

        // ── Sanitize all rows into same plain shape ───────────────
        const allEntries = [
            // From challan (no-op for sector = STATE — challanRows is [])
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

            // From challanTwo — use grantsInAid as amount (no-op for STATE/COUNCIL)
            ...challanTwoRows
                .filter((row) => row.grantsInAid && parseFloat(row.grantsInAid.toString()) > 0)
                .map((row) => ({
                    majorHead: row.majorHead ?? "Unknown",
                    minorHead: row.minorHead ?? "-",
                    cashbookNo: row.kaacChallanNo ?? "-",
                    date: row.kaacChallanDate
                        ? new Date(row.kaacChallanDate).toLocaleDateString()
                        : "-",
                    amount: parseFloat(row.grantsInAid.toString()),
                    source: "challanTwo",
                })),

            // From challanFromBill (no-op for sector = STATE — challanFromBillRows is [])
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
            // amount  = totalAmount * 100000 (stored in lakhs)
            // date    = challanDate
            // Only include rows where converted amount > 0
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
// SECTOR RULES:
// - sector === "STATE"        → UNCHANGED. StateChallan ONLY, mapped
//                                 to grantsInAid. Extracted verbatim
//                                 into getForm8StateRows() below.
// - sector === "COUNCIL"      → REBUILT.
//                                 • Name of Deptt: head code chain
//                                   (+ amountType for ChallanFromBill
//                                   rows) as nomenclature.
//                                 • Revenue Receipt (councilRevenue):
//                                   (a) Challan table, majorHead
//                                       numeric range 1–16, NO sector
//                                       filter.
//                                   (b) ChallanFromBill, sector IN
//                                       [COUNCIL, STATE], amountType
//                                       in the 4 treasury types
//                                       (Professional Tax, Forest
//                                       Royalty, MC Forest Royalty,
//                                       Monopoly) — cross-sector pull
//                                       from STATE is intentional.
//                                 • Grants in Aid (grantsInAid):
//                                       Challan table, majorHead =
//                                       "017", NO sector filter.
//                                 • Other Misc Receipt (miscReceipt):
//                                       ChallanFromBill, sector =
//                                       COUNCIL, amountType in
//                                       ["House Rent",
//                                       "Other Deductions"].
//                                 • ChallanTwo is no longer used at
//                                   all for COUNCIL.
// - sector === "CONSOLIDATED" → STATE's rows + COUNCIL's rows,
//                                 merged before computing totals.
// - any other sector          → no rule defined, empty result.
// ─────────────────────────────────────────────────────────────

const FORM8_COUNCIL_REVENUE_TREASURY_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "MC Forest Royalty",
    "Monopoly",
];

const FORM8_COUNCIL_MISC_TYPES = ["House Rent", "Other Deductions"];

const isMajorHeadInCouncilRevenueRangeForm8 = (majorHead) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= 1 && num <= 16;
};

const buildChallanNomenclatureForm8 = (row) =>
    [
        row.majorHead,
        row.subMajorHead,
        row.minorHead,
        row.subHead,
        row.subSubHead,
        row.detailHead,
    ]
        .filter((p) => p && p.toString().trim() !== "")
        .join(" - ") || "-";

// ════════════════════════════════════════════════════════════
// STATE — UNCHANGED logic, extracted verbatim into its own
// function so CONSOLIDATED can call it alongside COUNCIL.
// ════════════════════════════════════════════════════════════
const getForm8StateRows = async () => {
    const stateChallanRows = await prisma.stateChallan.findMany({
        where: { sector: "STATE" },
        select: {
            id: true,
            challanNo: true,
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

    logger.info(`Form8 (STATE): stateChallan=${stateChallanRows.length}`);

    const rows = [];

    stateChallanRows.forEach((row) => {
        if (row.totalAmount == null || row.totalAmount === 0) return;

        const amount = parseFloat((row.totalAmount).toFixed(2));

        const nomenclature = [
            row.majorHead,
            row.subMajorHead,
            row.minorHead,
            row.subHead,
            row.subSubHead,
            row.detailHead,
            row.subDetailHead,
        ]
            .filter((p) => p && p.trim() !== "")
            .join(" - ") || "-";

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            nomenclature,
            councilRevenue: 0,
            grantsInAid: amount,
            miscReceipt: 0,
            total: amount,
            source: "stateChallan",
        });
    });

    return rows;
};

// ════════════════════════════════════════════════════════════
// COUNCIL — REBUILT logic.
// ════════════════════════════════════════════════════════════
const getForm8CouncilRows = async () => {
    const [challanRows, challanFromBillTreasuryRows, challanFromBillMiscRows] =
        await Promise.all([
            // ALL Challan rows, no sector/challanType filter — split
            // into revenue (majorHead 1-16) and grants (majorHead
            // "017") buckets in JS below.
            prisma.challan.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    challanNo: true,
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
            // Cross-sector: COUNCIL's own + STATE's treasury-type rows
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: { in: ["COUNCIL", "STATE"] },
                    amountType: { in: FORM8_COUNCIL_REVENUE_TREASURY_TYPES },
                },
                select: {
                    id: true,
                    challanNo: true,
                    amountType: true,
                    amount: true,
                },
                orderBy: { voucharDate: "asc" },
            }),
            // COUNCIL-only misc receipt types
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    amountType: { in: FORM8_COUNCIL_MISC_TYPES },
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
        `Form8 (COUNCIL): challan=${challanRows.length}, challanFromBillTreasury=${challanFromBillTreasuryRows.length}, ` +
        `challanFromBillMisc=${challanFromBillMiscRows.length}`
    );

    const revenueChallanRows = challanRows.filter((row) =>
        isMajorHeadInCouncilRevenueRangeForm8(row.majorHead)
    );
    const grantsChallanRows = challanRows.filter(
        (row) => row.majorHead?.toString().trim() === "017"
    );

    const rows = [];

    // 1. Revenue Receipt — Challan majorHead 1-16
    revenueChallanRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            nomenclature: buildChallanNomenclatureForm8(row),
            councilRevenue: amount,
            grantsInAid: 0,
            miscReceipt: 0,
            total: amount,
            source: "challan-revenue",
        });
    });

    // 2. Revenue Receipt — ChallanFromBill treasury types, COUNCIL + STATE
    challanFromBillTreasuryRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            nomenclature: row.amountType ?? "-",
            councilRevenue: amount,
            grantsInAid: 0,
            miscReceipt: 0,
            total: amount,
            source: "challanFromBill-revenue",
        });
    });

    // 3. Grants in Aid — Challan majorHead = "017"
    grantsChallanRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            nomenclature: buildChallanNomenclatureForm8(row),
            councilRevenue: 0,
            grantsInAid: amount,
            miscReceipt: 0,
            total: amount,
            source: "challan-grants",
        });
    });

    // 4. Other Misc Receipt — ChallanFromBill, COUNCIL only, House Rent / Other Deductions
    challanFromBillMiscRows.forEach((row) => {
        const amount = parseFloat(row.amount?.toString() ?? "0");
        if (!amount) return;

        rows.push({
            cbItemNo: row.challanNo ?? "-",
            nomenclature: row.amountType ?? "-",
            councilRevenue: 0,
            grantsInAid: 0,
            miscReceipt: amount,
            total: amount,
            source: "challanFromBill-misc",
        });
    });

    logger.info(`Form8 (COUNCIL): total rows=${rows.length}`);

    return rows;
};

export const getForm8Data = async (sector) => {
    try {
        logger.info(`Fetching Form 8 data for sector: ${sector ?? "ALL"}`);

        const isStateSector = sector === "STATE";
        const isCouncilSector = sector === "COUNCIL";
        const isConsolidated = sector === "CONSOLIDATED";

        let rows = [];

        if (isStateSector) {
            rows = await getForm8StateRows();
        } else if (isCouncilSector) {
            rows = await getForm8CouncilRows();
        } else if (isConsolidated) {
            const [stateRows, councilRows] = await Promise.all([
                getForm8StateRows(),
                getForm8CouncilRows(),
            ]);
            rows = [...stateRows, ...councilRows];
        } else {
            logger.info(
                `Form8: no rule defined for sector "${sector}" — returning empty result`
            );
        }

        // Column totals
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
// Columns: voucherNo, detailHead (dept), payOfficers,
//          payEstablishment, allowanceHonorary, contingencies,
//          grantsInAid, works, grossAmount (total)
// Bottom: grand total for each column
// ─────────────────────────────────────────────────────────────

export const getForm9Data = async (sector) => {
    try {
        logger.info(`Fetching Form 9 data for sector: ${sector ?? "ALL"}`);

        const where = { isActive: true };
        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        const rows = await prisma.expenditure.findMany({
            where,
            select: {
                id: true,
                voucherNo: true,
                voucherDate: true,
                detailHead: true,
                payOfficers: true,
                payEstablishment: true,
                allowanceHonorary: true,
                contingencies: true,
                grantsInAid: true,
                works: true,
                transferPayment: true, // 👈 added
                grossAmount: true,
            },
            orderBy: { voucherDate: "asc" },
        });

        logger.info(`Form9: Fetched ${rows.length} rows from Expenditure table`);

        const sanitized = rows.map((row) => {
            const payOfficers = parseFloat(row.payOfficers?.toString() ?? "0");
            const payEstablishment = parseFloat(row.payEstablishment?.toString() ?? "0");
            const allowanceHonorary = parseFloat(row.allowanceHonorary?.toString() ?? "0");
            const contingencies = parseFloat(row.contingencies?.toString() ?? "0");
            const grantsInAid = parseFloat(row.grantsInAid?.toString() ?? "0");
            const works = parseFloat(row.works?.toString() ?? "0");
            const transferPayment = parseFloat(row.transferPayment?.toString() ?? "0"); // 👈 added

            // Total = sum of all amount columns
            const totalPayment =
                payOfficers + payEstablishment + allowanceHonorary +
                contingencies + grantsInAid + works + transferPayment;

            return {
                id: row.id,
                voucherNo: row.voucherNo ?? "-",
                detailHead: row.detailHead ?? "-",
                payOfficers,
                payEstablishment,
                allowanceHonorary,
                contingencies,
                grantsInAid,
                works,
                transferPayment,   // 👈 added
                totalPayment,      // recalculated to include transferPayment
            };
        });

        // Grand totals per column
        const grandTotals = sanitized.reduce(
            (acc, row) => ({
                payOfficers: acc.payOfficers + row.payOfficers,
                payEstablishment: acc.payEstablishment + row.payEstablishment,
                allowanceHonorary: acc.allowanceHonorary + row.allowanceHonorary,
                contingencies: acc.contingencies + row.contingencies,
                grantsInAid: acc.grantsInAid + row.grantsInAid,
                works: acc.works + row.works,
                transferPayment: acc.transferPayment + row.transferPayment, // 👈 added
                totalPayment: acc.totalPayment + row.totalPayment,
            }),
            {
                payOfficers: 0,
                payEstablishment: 0,
                allowanceHonorary: 0,
                contingencies: 0,
                grantsInAid: 0,
                works: 0,
                transferPayment: 0, // 👈 added
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
// COUNCIL / CONSOLIDATED (unchanged):
//   Data from: Expenditure table only
//   Receipt  = securityDepositsDeduction
//   Payment  = grossAmount where grantNo IN ['63', '64']
//   Columns: voucherNo, workName, receipt, payment, remarks
//
// STATE (new):
//   Cash book item no = challanNo (StateChallan rows) / voucherNo (Expenditure rows)
//   Name of Work/Scheme = head code, majorHead → detailHead (subDetailHead excluded)
//   Receipt  = StateChallan.totalAmount
//   Payment  = Expenditure.grossAmount
//   Remarks  = remarks (from whichever table the row came from)
// ─────────────────────────────────────────────────────────────

// Build "majorHead - subMajorHead - ... - detailHead" skipping empty parts.
// Deliberately excludes subDetailHead per Form 10 STATE spec.
const buildForm10HeadCode = (row) =>
    [
        row.majorHead,
        row.subMajorHead,
        row.minorHead,
        row.subHead,
        row.subSubHead,
        row.detailHead,
    ]
        .filter((p) => p && p.toString().trim() !== "")
        .join(" - ") || "-";

export const getForm10Data = async (sector) => {
    try {
        logger.info(`Fetching Form 10 data for sector: ${sector ?? "ALL"}`);

        const isStateOnly = sector === "STATE";

        // ═══════════════════════════════════════════════════════
        // STATE — Receipt from StateChallan, Payment from Expenditure
        // ═══════════════════════════════════════════════════════
        if (isStateOnly) {
            const [stateChallanRows, expenditureRows] = await Promise.all([
                prisma.stateChallan.findMany({
                    where: { sector: "STATE", isActive: true },
                    select: {
                        id: true,
                        challanNo: true,
                        totalAmount: true,
                        majorHead: true,
                        subMajorHead: true,
                        minorHead: true,
                        subHead: true,
                        subSubHead: true,
                        detailHead: true,
                        remarks: true,
                    },
                    orderBy: { challanDate: "asc" },
                }),
                prisma.expenditure.findMany({
                    where: { isActive: true, sector: "STATE" },
                    select: {
                        id: true,
                        voucherNo: true,
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
            ]);

            logger.info(
                `Form10 (STATE): stateChallan=${stateChallanRows.length}, expenditure=${expenditureRows.length}`
            );

            const rows = [];

            // Receipt rows — from StateChallan
            stateChallanRows.forEach((row) => {
                const receipt =
                    row.totalAmount != null
                        ? parseFloat((row.totalAmount).toFixed(2))
                        : 0;

                if (receipt === 0) return;

                rows.push({
                    id: `SC-${row.id}`,
                    cashBookItemNo: row.challanNo ?? "-",
                    workScheme: buildForm10HeadCode(row),
                    receipt,
                    payment: 0,
                    remarks: row.remarks ?? "-",
                    source: "stateChallan",
                });
            });

            // Payment rows — from Expenditure (grossAmount)
            expenditureRows.forEach((row) => {
                const payment = parseFloat(row.grossAmount?.toString() ?? "0");

                if (payment === 0) return;

                rows.push({
                    id: `E-${row.id}`,
                    cashBookItemNo: row.voucherNo ?? "-",
                    workScheme: buildForm10HeadCode(row),
                    receipt: 0,
                    payment,
                    remarks: row.remarks ?? "-",
                    source: "expenditure",
                });
            });

            const totalReceipts = rows.reduce((sum, r) => sum + r.receipt, 0);
            const totalPayments = rows.reduce((sum, r) => sum + r.payment, 0);
            const netAmount = totalReceipts - totalPayments;

            logger.info(`Form 10 (STATE) total rows: ${rows.length}`);

            return {
                rows,
                summary: {
                    totalReceipts,
                    totalPayments,
                    netAmount,
                },
            };
        }

        // ═══════════════════════════════════════════════════════
        // COUNCIL / CONSOLIDATED — original logic, unchanged
        // ═══════════════════════════════════════════════════════
        const where = { isActive: true };
        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        const rows = await prisma.expenditure.findMany({
            where,
            select: {
                id: true,
                voucherNo: true,
                workName: true,
                grantNo: true,
                securityDepositsDeduction: true,
                grossAmount: true,
                remarks: true,
            },
            orderBy: { voucherDate: "asc" },
        });

        logger.info(`Form10: Fetched ${rows.length} rows from Expenditure table`);

        // ── Sanitize and apply column logic ─────────────────────
        const sanitized = rows.map((row) => {
            // Receipt = securityDepositsDeduction (always)
            const receipt = parseFloat(
                row.securityDepositsDeduction?.toString() ?? "0"
            );

            // Payment = grossAmount only if grantNo is "63" or "64"
            const grantNo = row.grantNo?.toString().trim() ?? "";
            const payment =
                grantNo === "63" || grantNo === "64"
                    ? parseFloat(row.grossAmount?.toString() ?? "0")
                    : 0;

            return {
                id: row.id,
                voucherNo: row.voucherNo ?? "-",
                workName: row.workName ?? "-",
                receipt,
                payment,
                remarks: row.remarks ?? "-",
            };
        });

        // Only keep rows that have at least one non-zero value
        const filtered = sanitized.filter(
            (row) => row.receipt > 0 || row.payment > 0
        );

        // ── Summary totals ───────────────────────────────────────
        const totalReceipts = filtered.reduce((sum, r) => sum + r.receipt, 0);
        const totalPayments = filtered.reduce((sum, r) => sum + r.payment, 0);
        const netAmount = totalReceipts - totalPayments;

        logger.info(`Form 10 total rows: ${filtered.length}`);

        return {
            rows: filtered,
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
//
// Row 1: TreasuryPla → sum of amount
// Row 2: Sum of:
//   - challan       → amount where treasuryChallanNo is null/empty
//   - challanTwo    → amount where treasuryChallanNo is null/empty
//   - challanFromBill → amount where specific amountTypes
//                       AND treasuryChallanNo is null/empty
// Row 3: Expenditure → grossAmount where treasuryVoucherNo is null/empty
// Row 4: Row1 + Row2 - Row3 (calculated)
// ─────────────────────────────────────────────────────────────

const FORM11_ALLOWED_AMOUNT_TYPES = [
    "CGST", "SGST", "IGST", "Labour Cess", "ITAX",
    "MDRRF", "DMFT", "IT Forest Royalty", "VAT",
    "CPF Council Share", "CPF Contribution", "CPF Advance",
];

const isEmptyOrNull = (val) =>
    val === null || val === undefined || val === "" ||
    val === "0" || val === 0;

export const getForm11Data = async (sector) => {
    try {
        logger.info(`Fetching Form 11 data for sector: ${sector ?? "ALL"}`);

        // ── Where clauses ────────────────────────────────────────
        const treasuryWhere = { isActive: true };
        if (sector && sector !== "CONSOLIDATED") {
            treasuryWhere.sector = sector;
        }

        const challanWhere = { isActive: true };
        if (sector && sector !== "CONSOLIDATED") {
            challanWhere.challanType = sector;
        }

        const challanTwoWhere = { isActive: true };
        if (sector && sector !== "CONSOLIDATED") {
            challanTwoWhere.sector = sector;
        }

        const challanFromBillWhere = {
            isActive: true,
            amountType: { in: FORM11_ALLOWED_AMOUNT_TYPES },
        };
        if (sector && sector !== "CONSOLIDATED") {
            challanFromBillWhere.sector = sector;
        }

        const expenditureWhere = { isActive: true };
        if (sector && sector !== "CONSOLIDATED") {
            expenditureWhere.sector = sector;
        }

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        // ── Fetch all tables in parallel ─────────────────────────
        const [
            treasuryRows,
            challanRows,
            challanTwoRows,
            challanFromBillRows,
            expenditureRows,
            stateChallanRows,               // ← NEW
        ] = await Promise.all([
            prisma.treasuryPla.findMany({
                where: treasuryWhere,
                select: { amount: true },
            }),
            prisma.challan.findMany({
                where: challanWhere,
                select: { amount: true, treasuryChallanNo: true },
            }),
            prisma.challanTwo.findMany({
                where: challanTwoWhere,
                select: { amount: true, treasuryChallanNo: true },
            }),
            prisma.challanFromBill.findMany({
                where: challanFromBillWhere,
                select: { amount: true, treasuryChallanNo: true },
            }),
            prisma.expenditure.findMany({
                where: expenditureWhere,
                select: { grossAmount: true, treasuryVoucherNo: true },
            }),

            // ── NEW: StateChallan (STATE / CONSOLIDATED only) ────
            // No isActive field on model — filter by sector = "STATE"
            // Only fetch the two fields needed for Row 2 calculation
            includeStateChallans
                ? prisma.stateChallan.findMany({
                    where: { sector: "STATE" },
                    select: {
                        totalAmount: true,
                        treasuryChallanNo: true,
                    },
                })
                : Promise.resolve([]),
        ]);

        logger.info(
            `Form11: treasury=${treasuryRows.length}, challan=${challanRows.length}, ` +
            `challanTwo=${challanTwoRows.length}, challanFromBill=${challanFromBillRows.length}, ` +
            `expenditure=${expenditureRows.length}, stateChallan=${stateChallanRows.length}`
        );

        // ── Row 1: TreasuryPla total ─────────────────────────────
        const row1Amount = treasuryRows.reduce(
            (sum, r) => sum + parseFloat(r.amount?.toString() ?? "0"),
            0
        );

        // ── Row 2: Credited by Council but not accounted by Treasury
        // challan — no treasuryChallanNo
        const challanUnaccounted = challanRows
            .filter((r) => isEmptyOrNull(r.treasuryChallanNo))
            .reduce((sum, r) => sum + parseFloat(r.amount?.toString() ?? "0"), 0);

        // challanTwo — no treasuryChallanNo
        const challanTwoUnaccounted = challanTwoRows
            .filter((r) => isEmptyOrNull(r.treasuryChallanNo))
            .reduce((sum, r) => sum + parseFloat(r.amount?.toString() ?? "0"), 0);

        // challanFromBill — specific amountTypes + no treasuryChallanNo
        const challanFromBillUnaccounted = challanFromBillRows
            .filter((r) => isEmptyOrNull(r.treasuryChallanNo))
            .reduce((sum, r) => sum + parseFloat(r.amount?.toString() ?? "0"), 0);

        // ─────────────────────────────────────────────────────────
        // NEW — StateChallan: no treasuryChallanNo
        // amount = totalAmount * 100000 (stored in lakhs)
        // ─────────────────────────────────────────────────────────
        const stateChallanUnaccounted = stateChallanRows
            .filter((r) => isEmptyOrNull(r.treasuryChallanNo))
            .reduce(
                (sum, r) =>
                    sum +
                    (r.totalAmount != null
                        ? parseFloat((r.totalAmount).toFixed(2))
                        : 0),
                0
            );

        const row2Amount =
            challanUnaccounted +
            challanTwoUnaccounted +
            challanFromBillUnaccounted +
            stateChallanUnaccounted;        // ← NEW

        // ── Row 3: Cheques drawn but not encashed ────────────────
        const row3Amount = expenditureRows
            .filter((r) => isEmptyOrNull(r.treasuryVoucherNo))
            .reduce(
                (sum, r) => sum + parseFloat(r.grossAmount?.toString() ?? "0"),
                0
            );

        // ── Row 4: Row1 + Row2 - Row3 ────────────────────────────
        const row4Amount = row1Amount + row2Amount - row3Amount;

        logger.info(
            `Form11: row1=${row1Amount}, row2=${row2Amount}, row3=${row3Amount}, row4=${row4Amount}`
        );

        return {
            rows: [
                {
                    number: 1,
                    head: "Balance as shown in the Treasury Pass Book (PLA)",
                    amount: row1Amount,
                    showTotal: true,
                },
                {
                    number: 2,
                    head: "Add amount credited by the Council but not accounted for by the Treasury",
                    amount: row2Amount,
                    showTotal: false,
                },
                {
                    number: 3,
                    head: "Less Cheques drawn by the Council but not encashed in Treasury",
                    amount: row3Amount,
                    showTotal: false,
                },
                {
                    number: 4,
                    head: "Balance as per Cash Book of the Council",
                    amount: row4Amount,
                    showTotal: true,
                },
            ],
            // Breakdown for transparency
            breakdown: {
                row2: {
                    challan: challanUnaccounted,
                    challanTwo: challanTwoUnaccounted,
                    challanFromBill: challanFromBillUnaccounted,
                    stateChallan: stateChallanUnaccounted,   // ← NEW
                },
            },
        };
    } catch (error) {
        logger.error(`Error fetching Form 11 data: ${error.message}`);
        throw error;
    }
};

