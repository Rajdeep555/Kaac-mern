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
//   challan         → all active, use challanDate
//   challanTwo      → grantsInAid amount only, use kaacChallanDate
//   challanFromBill → only specific amountTypes, use voucharDate
// Grouped by: majorHead → minorHead
// Shows subtotal after each minorHead and majorHead group
// ─────────────────────────────────────────────────────────────

const FORM7B_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

export const getForm7BData = async (sector) => {
    try {
        logger.info(`Fetching Form 7B data for sector: ${sector ?? "ALL"}`);

        // ── Build where clauses ──────────────────────────────────
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
            amountType: { in: FORM7B_ALLOWED_AMOUNT_TYPES },
        };
        if (sector && sector !== "CONSOLIDATED") {
            challanFromBillWhere.sector = sector;
        }

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        // ── Fetch all tables in parallel ─────────────────────────
        const [
            challanRows,
            challanTwoRows,
            challanFromBillRows,
            stateChallanRows,               // ← NEW
        ] = await Promise.all([
            prisma.challan.findMany({ where: challanWhere }),
            prisma.challanTwo.findMany({ where: challanTwoWhere }),
            prisma.challanFromBill.findMany({ where: challanFromBillWhere }),

            // ── NEW: StateChallan (STATE / CONSOLIDATED only) ────
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

            // From challanTwo — use grantsInAid as amount
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
            // NEW — From stateChallan
            // amount  = totalAmount * 100000 (stored in lakhs)
            // date    = challanDate
            // Only include rows where converted amount > 0
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
                    amount: parseFloat((row.totalAmount * 100000).toFixed(2)),
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
                    entries: [],
                };
            }

            // Push plain entry
            grouped[mh].minorHeads[mnh].entries.push({
                cashbookNo: entry.cashbookNo,
                date: entry.date,
                amount: amt,
            });

            // Accumulate totals
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
// Data from 3 tables: challan, challanTwo, challanFromBill
//
// Column logic:
//   challan:
//     departmentId 8001–8016 → councilRevenue
//     departmentId 8017      → grantsInAid
//     else                   → miscReceipt
//   challanTwo:
//     grantsInAid field      → grantsInAid column
//   challanFromBill:
//     amount                 → councilRevenue column
// ─────────────────────────────────────────────────────────────

const FORM8_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

export const getForm8Data = async (sector) => {
    try {
        logger.info(`Fetching Form 8 data for sector: ${sector ?? "ALL"}`);

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
            amountType: { in: FORM8_ALLOWED_AMOUNT_TYPES },
        };
        if (sector && sector !== "CONSOLIDATED") {
            challanFromBillWhere.sector = sector;
        }

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        const [
            challanRows,
            challanTwoRows,
            challanFromBillRows,
            stateChallanRows,               // ← NEW
        ] = await Promise.all([
            prisma.challan.findMany({
                where: challanWhere,
                include: {
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            }),
            prisma.challanTwo.findMany({ where: challanTwoWhere }),
            prisma.challanFromBill.findMany({ where: challanFromBillWhere }),

            // ── NEW: StateChallan (STATE / CONSOLIDATED only) ────
            // No isActive field on model — filter by sector = "STATE"
            includeStateChallans
                ? prisma.stateChallan.findMany({
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
                })
                : Promise.resolve([]),

        ]);

        logger.info(
            `Form8: challan=${challanRows.length}, challanTwo=${challanTwoRows.length}, ` +
            `challanFromBill=${challanFromBillRows.length}, stateChallan=${stateChallanRows.length}`
        );

        const rows = [];

        // 1. Challan rows — column logic based on department.code
        challanRows.forEach((row) => {
            const deptCode = row.department?.code ?? "";
            const deptName = row.department?.name ?? "-";
            const amount = parseFloat(row.amount?.toString() ?? "0");

            let councilRevenue = 0;
            let grantsInAid = 0;
            let miscReceipt = 0;

            const codeNum = parseInt(deptCode, 10);

            if (!isNaN(codeNum) && codeNum >= 8001 && codeNum <= 8016) {
                councilRevenue = amount;
            } else if (!isNaN(codeNum) && codeNum === 8017) {
                grantsInAid = amount;
            } else {
                miscReceipt = amount;
            }

            rows.push({
                cbItemNo: row.challanNo ?? "-",
                nomenclature: `${row.majorHead ?? ""} - ${deptCode} ${deptName}`.trim(),
                councilRevenue,
                grantsInAid,
                miscReceipt,
                total: amount,
                source: "challan",
            });
        });

        // 2. ChallanTwo rows — grantsInAid column
        challanTwoRows.forEach((row) => {
            const amount = parseFloat(row.grantsInAid?.toString() ?? "0");
            if (!amount) return;

            rows.push({
                cbItemNo: row.kaacChallanNo ?? "-",
                nomenclature: "Grants in Aid from Govt.",
                councilRevenue: 0,
                grantsInAid: amount,
                miscReceipt: 0,
                total: amount,
                source: "challanTwo",
            });
        });

        // 3. ChallanFromBill rows — councilRevenue column
        challanFromBillRows.forEach((row) => {
            const amount = parseFloat(row.amount?.toString() ?? "0");

            rows.push({
                cbItemNo: row.challanNo ?? "-",
                nomenclature: row.amountType ?? "-",
                councilRevenue: amount,
                grantsInAid: 0,
                miscReceipt: 0,
                total: amount,
                source: "challanFromBill",
            });
        });

        // ─────────────────────────────────────────────────────────
        // 4. NEW — StateChallan rows
        //    Maps to grantsInAid column:
        //    "Grants-in-aid received from the Govt"
        //    amount = totalAmount * 100000 (stored in lakhs)
        //    Skip rows where totalAmount is null or zero
        // ─────────────────────────────────────────────────────────
        stateChallanRows.forEach((row) => {
            if (row.totalAmount == null || row.totalAmount === 0) return;

            const amount = parseFloat((row.totalAmount * 100000).toFixed(2));

            // Build nomenclature from all 7 head levels — skip null/empty parts
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
                nomenclature,                       // ← full head chain
                councilRevenue: 0,
                grantsInAid: amount,
                miscReceipt: 0,
                total: amount,
                source: "stateChallan",
            });
        });

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
// Data from: Expenditure table
// Receipt  = securityDepositsDeduction
// Payment  = grossAmount where grantNo IN ['63', '64']
// Columns: voucherNo, workName, receipt, payment, remarks
// ─────────────────────────────────────────────────────────────

export const getForm10Data = async (sector) => {
    try {
        logger.info(`Fetching Form 10 data for sector: ${sector ?? "ALL"}`);

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
                        ? parseFloat((r.totalAmount * 100000).toFixed(2))
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

