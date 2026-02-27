import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// FORM 4 - Register of Remittances to Treasury (PLA)
// Data comes from 4 tables: challan, challanTwo, challanFromBill,
// stateChallan (STATE sector only)
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

// Helper — now variadic to support any number of head levels
const buildClassification = (...parts) => {
    return (
        parts.filter((part) => part && part.trim() !== "").join(" / ") || "-"
    );
};

// ─────────────────────────────────────────────────────────────

const getForm4ChallanRows = async (sector) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.challanType = sector;
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

const getForm4ChallanTwoRows = async (sector) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
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

const getForm4ChallanFromBillRows = async (sector) => {
    const where = {
        isActive: true,
        amountType: { in: ALLOWED_AMOUNT_TYPES },
    };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
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
// NEW — StateChallan rows (STATE sector only)
// Amount is stored in lakhs → multiply by 100000
// Classification spans all 7 head levels
// isActive check: StateChallan has no isActive field in the
// schema above, so we filter by sector = "STATE" only.
// If you add isActive to the model later, add it to `where`.
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
                ? parseFloat((row.totalAmount * 100000).toFixed(2))
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
// Fetches all tables in parallel, merges and sorts by date
// StateChallan is only fetched when sector is STATE or CONSOLIDATED
// ─────────────────────────────────────────────────────────────
export const getForm4Data = async (sector) => {
    try {
        logger.info(`Fetching Form 4 data for sector: ${sector ?? "ALL"}`);

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        const [
            challanRows,
            challanTwoRows,
            challanFromBillRows,
            stateChallanRows,       // ← NEW
        ] = await Promise.all([
            getForm4ChallanRows(sector),
            getForm4ChallanTwoRows(sector),
            getForm4ChallanFromBillRows(sector),
            includeStateChallans            // ← only runs when relevant
                ? getForm4StateChallanRows()
                : Promise.resolve([]),
        ]);

        const allRows = [
            ...challanRows,
            ...challanTwoRows,
            ...challanFromBillRows,
            ...stateChallanRows,            // ← NEW
        ];

        const sorted = allRows.sort((a, b) => new Date(a.date) - new Date(b.date));

        logger.info(`Form 4 total rows returned: ${sorted.length}`);

        return sorted;
    } catch (error) {
        logger.error(`Error fetching Form 4 data: ${error.message}`);
        throw error;
    }
};


// ----------------------------------------------------------

// ─────────────────────────────────────────────────────────────
// FORM 5A - Classified Abstract of Receipts
// Data comes from 3 tables: challan, challanFromBill,
// stateChallan (STATE sector only)
// ─────────────────────────────────────────────────────────────

const FORM5A_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// ─────────────────────────────────────────────────────────────

const getForm5AChallanRows = async (sector) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.challanType = sector;
    }

    const rows = await prisma.challan.findMany({ where });

    logger.info(
        `Form5A: Fetched ${rows.length} rows from Challan for sector: ${sector ?? "ALL"}`
    );

    return rows.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        sector: row.challanType ?? null,
        source: "challan",
    }));
};

const getForm5AChallanFromBillRows = async (sector) => {
    const where = {
        isActive: true,
        amountType: { in: FORM5A_ALLOWED_AMOUNT_TYPES },
    };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Form5A: Fetched ${rows.length} rows from ChallanFromBill for sector: ${sector ?? "ALL"}`
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
// NEW — StateChallan rows (STATE sector only)
// Amount stored in lakhs → multiply by 100000
// Classification uses all head levels, but Form 5A groups
// by majorHead so only majorHead drives the grouping key.
// subMajor → subMajorHead, minorHead → minorHead (direct fields)
// No isActive field on StateChallan model — filter by sector only
// ─────────────────────────────────────────────────────────────
const getForm5AStateChallanRows = async () => {
    const rows = await prisma.stateChallan.findMany({
        where: {
            sector: "STATE",
        },
        orderBy: { challanDate: "asc" },
    });

    logger.info(
        `Form5A: Fetched ${rows.length} rows from StateChallan`
    );

    return rows.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount:
            row.totalAmount != null
                ? parseFloat((row.totalAmount * 100000).toFixed(2))
                : 0,
        sector: "STATE",
        source: "stateChallan",
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

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        // Fetch all tables in parallel
        const [challanRows, challanFromBillRows, stateChallanRows] =
            await Promise.all([
                getForm5AChallanRows(sector),
                getForm5AChallanFromBillRows(sector),
                includeStateChallans            // ← only runs when relevant
                    ? getForm5AStateChallanRows()
                    : Promise.resolve([]),
            ]);

        // Merge all rows
        const allRows = [
            ...challanRows,
            ...challanFromBillRows,
            ...stateChallanRows,               // ← NEW
        ];

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


// ─────────────────────────────────────────────────────────────
// FORM 5B - Classified Abstract of Expenditure
// Data comes from: Expenditure table
// Filter: expenditureType = "REVENUE"
// Grouped by majorHead — total row if multiple entries
// ─────────────────────────────────────────────────────────────

export const getForm5BData = async (sector) => {
    try {
        logger.info(`Fetching Form 5B data for sector: ${sector ?? "ALL"}`);

        const where = {
            isActive: true,
            expenditureType: "REVENUE", // only REVENUE type
        };

        // Filter by sector if not CONSOLIDATED
        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        const rows = await prisma.expenditure.findMany({ where });

        logger.info(`Form5B: Fetched ${rows.length} rows from Expenditure table`);

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
// Same as Form 5B but expenditureType = "CAPITAL"
// ─────────────────────────────────────────────────────────────

export const getForm5CData = async (sector) => {
    try {
        logger.info(`Fetching Form 5C data for sector: ${sector ?? "ALL"}`);

        const where = {
            isActive: true,
            expenditureType: "CAPITAL", // only CAPITAL type (5B uses REVENUE)
        };

        if (sector && sector !== "CONSOLIDATED") {
            where.sector = sector;
        }

        const rows = await prisma.expenditure.findMany({ where });

        logger.info(`Form5C: Fetched ${rows.length} rows from Expenditure table`);

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
// FORM 5D - Classified cum Consolidated Abstract
//           Receipts and Payments — Debt Head
//
// Receipt side rows come from TWO sources (shown together):
//   1. ChallanTwo  → loansReceivedGovt, loansReceivedOther
//   2. Expenditure → loanAdvances (BUILDING_LOAN, CAR_LOAN),
//                    houseRent + otherDeductions + advanceRecovery
//
// Payment side rows come from ONE source:
//   1. Expenditure → loanRepayGovt, loanRepayOther, loansAdvances
// ─────────────────────────────────────────────────────────────

export const getForm5DData = async (sector) => {
    try {
        logger.info(`Fetching Form 5D data for sector: ${sector ?? "ALL"}`);

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};

        const [challanTwoRows, expenditureRows] = await Promise.all([
            prisma.challanTwo.findMany({
                where: { isActive: true, ...sectorFilter },
                orderBy: { kaacChallanDate: "asc" },
            }),
            prisma.expenditure.findMany({
                where: { isActive: true, ...sectorFilter },
                select: {
                    id: true,
                    voucherNo: true,
                    voucherDate: true,
                    // Receipt side fields available in actual schema
                    carLoanRecovery: true,  // → Car Loan
                    houseLoanRecovery: true,  // → H/B Loan
                    // securityDepositsDeduction: true, // → Other Receipts
                    // cpfRecovery: true,  // → Other Receipts
                    houseRent: true, // -> other receipts
                    advanceRecovery: true, // -> other receipts
                    otherDeductions: true, // -> other receipts
                    // Payment side fields available in actual schema
                    // grantsInAid: true,
                    // transferPayment: true,
                    // netAmount: true,
                    loanRepayGovt: true, // → Repayment loans(Govt)
                    loansAdvances: true,// → Payment of loans/advances made by council
                    loanRepayOther: true, // → Repayment loans (other sources)
                },
                orderBy: { voucherDate: "asc" },
            }),
        ]);

        logger.info(
            `Form5D raw: challanTwo=${challanTwoRows.length}, expenditure=${expenditureRows.length}`
        );

        const safe = (v) => {
            if (v === null || v === undefined) return 0;
            const n = parseFloat(v.toString());
            return isNaN(n) ? 0 : n;
        };

        // ── Receipt rows from ChallanTwo ─────────────────────────
        const receiptRowsChallanTwo = challanTwoRows.map((row) => {
            const loansGovt = safe(row.loansReceivedGovt);
            const loansOther = safe(row.loansReceivedOther);

            return {
                id: `CT-${row.id}`,
                source: "challanTwo",
                cashBookItemNo: row.kaacChallanNo ?? "-",
                loansGovt,
                loansOther,
                hbLoan: 0,
                carLoan: 0,
                otherReceipts: 0,
                totalReceipts: loansGovt + loansOther,
            };
        });

        // ── Receipt rows from Expenditure ────────────────────────
        // Mapping from actual Expenditure fields:
        // H/B Loan        → houseLoanRecovery
        // Car Loan        → carLoanRecovery
        // Other Receipts  → securityDepositsDeduction + cpfRecovery
        const receiptRowsExpenditure = expenditureRows.map((row) => {
            const hbLoan = safe(row.houseLoanRecovery);
            const carLoan = safe(row.carLoanRecovery);
            const otherReceipts =
                safe(row.houseRent) + safe(row.advanceRecovery) + safe(row.otherDeductions);
            const totalReceipts = hbLoan + carLoan + otherReceipts;

            if (totalReceipts === 0) return null;

            return {
                id: `E-RCPT-${row.id}`,
                source: "expenditureReceipt",
                cashBookItemNo: row.voucherNo ?? "-",
                loansGovt: 0,
                loansOther: 0,
                hbLoan,
                carLoan,
                otherReceipts,
                totalReceipts,
            };
        }).filter(Boolean);

        const receiptRows = [
            ...receiptRowsChallanTwo,
            ...receiptRowsExpenditure,
        ];

        // ── Payment rows from Expenditure ────────────────────────
        // Mapping from actual Expenditure fields:
        // Repayment loans (Govt)         → netAmount
        // Repayment loans (Other)        → transferPayment
        // Payment of loans & advances    → grantsInAid
        const paymentRows = expenditureRows.map((row) => {
            const repayGovt = safe(row.loanRepayGovt);
            const repayOther = safe(row.loanRepayOther);
            const loansAdv = safe(row.loansAdvances);
            const total = repayGovt + repayOther + loansAdv;

            if (total === 0) return null;

            return {
                id: `E-PMT-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                repayGovt,
                repayOther,
                loansAdvances: loansAdv,
                totalPayments: total,
            };
        }).filter(Boolean);

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
            `Form5D done: receiptRows=${receiptRows.length}, paymentRows=${paymentRows.length}`
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
// RECEIPT SIDE:
//   Expenditure    → cpfCouncil+cpfContribution+cpfRecovery,
//                    securityDepositsDeduction, earnestMoneyDeduction,
//                    grossAmount (cheques drawn)
//   ChallanTwo     → grantsInAid (Deposits from Govt)
//   StateChallan   → totalAmount * 100000 (STATE / CONSOLIDATED only)
//
// PAYMENT SIDE:
//   Expenditure    → cpfCouncil+cpfContribution+cpfRecovery (remittance CPF),
//                    securityDeposit, earnestMoney, transferPayment,
//                    earnestMoneyDeduction+securityDepositsDeduction (remit treasury)
//   Challan        → amount (remittance to treasury PLAs)
//   ChallanTwo     → amount (remittance to treasury PLAs)
//   ChallanFromBill → specific amountTypes (remittance to treasury PLAs)
// ─────────────────────────────────────────────────────────────


const FORM5E_TREASURY_TYPES = [
    "Professional Tax",
    "Monopoly",
    "MC Forest Royalty",
    "Forest Royalty",
];

export const getForm5EData = async (sector) => {
    try {
        logger.info(`Fetching Form 5E data for sector: ${sector ?? "ALL"}`);

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};
        const challanSectorFilter =
            sector && sector !== "CONSOLIDATED" ? { challanType: sector } : {};

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        const [
            expenditureRows,
            challanTwoRows,
            challanRows,
            challanFromBillRows,
            stateChallanRows,
        ] = await Promise.all([
            prisma.expenditure.findMany({
                where: { isActive: true, ...sectorFilter },
                select: {
                    id: true,
                    voucherNo: true,
                    sector: true,               // ← per-row sector check
                    cpfCouncil: true,
                    cpfContribution: true,
                    cpfRecovery: true,
                    securityDepositsDeduction: true,
                    earnestMoneyDeduction: true,
                    grossAmount: true,
                    securityDeposit: true,
                    earnestMoney: true,
                    transferPayment: true,
                    grantsInAid: true,          // ← STATE transferItems
                    works: true,                // ← STATE transferItems
                },
                orderBy: { voucherDate: "asc" },
            }),
            prisma.challanTwo.findMany({
                where: { isActive: true, ...sectorFilter },
                select: {
                    id: true,
                    kaacChallanNo: true,
                    grantsInAid: true,
                    amount: true,
                },
                orderBy: { kaacChallanDate: "asc" },
            }),
            prisma.challan.findMany({
                where: { isActive: true, ...challanSectorFilter },
                select: {
                    id: true,
                    challanNo: true,
                    amount: true,
                },
                orderBy: { challanDate: "asc" },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    amountType: { in: FORM5E_TREASURY_TYPES },
                    ...sectorFilter,
                },
                select: {
                    id: true,
                    challanNo: true,
                    amountType: true,
                    amount: true,
                },
                orderBy: { voucharDate: "asc" },
            }),
            includeStateChallans
                ? prisma.stateChallan.findMany({
                    where: { sector: "STATE" },
                    select: {
                        id: true,
                        challanNo: true,
                        totalAmount: true,
                    },
                    orderBy: { challanDate: "asc" },
                })
                : Promise.resolve([]),
        ]);

        logger.info(
            `Form5E: expenditure=${expenditureRows.length}, challanTwo=${challanTwoRows.length}, ` +
            `challan=${challanRows.length}, challanFromBill=${challanFromBillRows.length}, ` +
            `stateChallan=${stateChallanRows.length}`
        );

        const safe = (v) => {
            if (v === null || v === undefined) return 0;
            const n = parseFloat(v.toString());
            return isNaN(n) ? 0 : n;
        };

        // ══════════════════════════════════════════════════════════
        // RECEIPT ROWS
        // ══════════════════════════════════════════════════════════

        // 1. Expenditure receipt rows
        const receiptFromExpenditure = expenditureRows.map((row) => {
            const cpfSub = safe(row.cpfCouncil) + safe(row.cpfContribution) + safe(row.cpfRecovery);
            const secDep = safe(row.securityDepositsDeduction);
            const earnest = safe(row.earnestMoneyDeduction);
            const govtDep = 0;
            const cheques = safe(row.grossAmount);
            const total = cpfSub + secDep + earnest + govtDep + cheques;

            if (total === 0) return null;

            return {
                id: `E-R-${row.id}`,
                cashBookItemNo: row.voucherNo ?? "-",
                cpfSub,
                securityDep: secDep,
                earnestMoney: earnest,
                govtDeposit: govtDep,
                chequesDrawn: cheques,
                totalReceipt: total,
            };
        }).filter(Boolean);

        // 2. ChallanTwo receipt rows
        const receiptFromChallanTwo = challanTwoRows.map((row) => {
            const govtDep = safe(row.grantsInAid);
            if (govtDep === 0) return null;

            return {
                id: `CT-R-${row.id}`,
                cashBookItemNo: row.kaacChallanNo ?? "-",
                cpfSub: 0,
                securityDep: 0,
                earnestMoney: 0,
                govtDeposit: govtDep,
                chequesDrawn: 0,
                totalReceipt: govtDep,
            };
        }).filter(Boolean);

        // 3. StateChallan receipt rows (STATE / CONSOLIDATED only)
        const receiptFromStateChallan = stateChallanRows.map((row) => {
            const govtDep =
                row.totalAmount != null
                    ? parseFloat((row.totalAmount * 100000).toFixed(2))
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

        const receiptRows = [
            ...receiptFromExpenditure,
            ...receiptFromChallanTwo,
            ...receiptFromStateChallan,
        ];

        // ══════════════════════════════════════════════════════════
        // PAYMENT ROWS
        // ══════════════════════════════════════════════════════════

        // 1. Expenditure payment rows
        const paymentFromExpenditure = expenditureRows.map((row) => {
            const cpfAdvances = 0;
            const remitCpf = safe(row.cpfCouncil) + safe(row.cpfContribution) + safe(row.cpfRecovery);
            const paySecDep = safe(row.securityDeposit);
            const repayEarnest = safe(row.earnestMoney);
            const remitTreasury = safe(row.earnestMoneyDeduction) + safe(row.securityDepositsDeduction);

            // ─────────────────────────────────────────────────────
            // Per-row sector check — NOT the query-level sector param
            //
            // STATE rows:   transferItems = transferPayment + grantsInAid + works
            // COUNCIL rows: transferItems = transferPayment only
            //
            // This ensures CONSOLIDATED mode doesn't incorrectly add
            // grantsInAid from COUNCIL expenditure rows into transferItems
            // ─────────────────────────────────────────────────────
            const isStateRow = row.sector === "STATE";
            const transferItems = isStateRow
                ? safe(row.transferPayment) + safe(row.grantsInAid) + safe(row.works)
                : safe(row.transferPayment);

            const total =
                cpfAdvances + remitCpf + paySecDep +
                repayEarnest + transferItems + remitTreasury;

            if (total === 0) return null;

            return {
                id: `E-P-${row.id}`,
                vrNo: row.voucherNo ?? "-",
                cpfAdvances,
                remitCpf,
                paySecurityDep: paySecDep,
                repayEarnest,
                transferItems,
                remittanceTreasury: remitTreasury,
                totalPayment: total,
            };
        }).filter(Boolean);

        // 2. Challan payment rows
        const paymentFromChallan = challanRows.map((row) => {
            const remitTreasury = safe(row.amount);
            if (remitTreasury === 0) return null;

            return {
                id: `C-P-${row.id}`,
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

        // 3. ChallanTwo payment rows — remittanceTreasury (amount field)
        const paymentFromChallanTwo = challanTwoRows.map((row) => {
            const remitTreasury = safe(row.amount);
            if (remitTreasury === 0) return null;

            return {
                id: `CT-P-${row.id}`,
                vrNo: row.kaacChallanNo ?? "-",
                cpfAdvances: 0,
                remitCpf: 0,
                paySecurityDep: 0,
                repayEarnest: 0,
                transferItems: 0,
                remittanceTreasury: remitTreasury,
                totalPayment: remitTreasury,
            };
        }).filter(Boolean);

        // 4. ChallanFromBill payment rows
        const paymentFromChallanFromBill = challanFromBillRows.map((row) => {
            const remitTreasury = safe(row.amount);
            if (remitTreasury === 0) return null;

            return {
                id: `CFB-P-${row.id}`,
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

        const paymentRows = [
            ...paymentFromExpenditure,
            ...paymentFromChallan,
            ...paymentFromChallanTwo,
            ...paymentFromChallanFromBill,
        ];

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
//   challanTwo      → grantsInAid amount only, use kaacChallanDate
//   challanFromBill → only 'Professional Tax', 'Forest Royalty',
//                     'Monopoly', 'MC Forest Royalty', use voucharDate
//   stateChallan    → totalAmount * 100000, use challanDate
//                     (STATE / CONSOLIDATED only)
// Rows = full head code, Columns = months (JAN-DEC)
// ─────────────────────────────────────────────────────────────

const FORM7_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "Monopoly",
    "MC Forest Royalty",
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

export const getForm7Data = async (sector) => {
    try {
        logger.info(`Fetching Form 7 data for sector: ${sector ?? "ALL"}`);

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
            amountType: { in: FORM7_ALLOWED_AMOUNT_TYPES },
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
            stateChallanRows,           // ← NEW
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

        // Process ChallanTwo — grantsInAid only
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
        // NEW — Process StateChallan
        // amount = totalAmount * 100000 (stored in lakhs)
        // date   = challanDate
        // headCode uses all 7 levels available on the model
        // ─────────────────────────────────────────────────────────
        stateChallanRows.forEach((row) => {
            const amount =
                row.totalAmount != null
                    ? parseFloat((row.totalAmount * 100000).toFixed(2))
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

        // Build final result with majorHead grouping
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



