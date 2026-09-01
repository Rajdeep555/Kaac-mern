import { Prisma } from "@prisma/client";
import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// STATEMENT 1 - Summary of Transactions
// Two columns: previous period + current period (based on from/to)
//
// SECTOR RULES
// ------------
// Every getter below takes `sector` = "STATE" | "COUNCIL" | undefined/null/"CONSOLIDATED".
// - "STATE"   → state-specific rules (kept as-is from the previous version
//               unless explicitly called out below).
// - "COUNCIL" → council-specific rules (new, per spec).
// - anything else (no sector / "CONSOLIDATED") → CONSOLIDATED, computed as
//   STATE-result + COUNCIL-result for that same function/date range. This
//   guarantees the consolidated statement is always the true sum of the two
//   sectors, now that their underlying rules diverge on several lines.
//
// Date column per table (confirmed against schema):
//   challan          → challanDate
//   cashReceipt      → date
//   expenditure      → voucherDate
//   challanTwo       → kaacChallanDate
//   challanFromBill  → voucharDate   (NOT voucherDate — no 'e')
//   stateChallan     → challanDate
// ─────────────────────────────────────────────────────────────

// Builds a Prisma-style { gte, lte } range from raw from/to date strings
const getDateRangeFromParams = (from, to) => {
    if (!from && !to) return null;
    const range = {};
    if (from) range.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) range.lte = new Date(`${to}T23:59:59.999Z`);
    return range;
};

const safeNum = (val) => Number(val ?? 0);

// Shifts a "YYYY-MM-DD" string by `delta` whole years (e.g. -1 for the
// previous financial year), keeping month/day fixed. Used to build the
// "previous period" column from the same from/to filter the user picked.
const shiftYear = (dateStr, delta) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCFullYear(d.getUTCFullYear() + delta);
    return d.toISOString().slice(0, 10);
};

// Major/minor head values are stored as strings across these tables.
// These helpers keep the parseInt-and-compare style already used in the file.
const parseHead = (v) => parseInt(v, 10);
const headEquals = (v, target) => parseHead(v) === target;
const headInRange = (v, min, max) => {
    const n = parseHead(v);
    return !Number.isNaN(n) && n >= min && n <= max;
};
const headExcluded = (v, list) => list.includes(parseHead(v));

// ─────────────────────────────────────────────────────────────
// amountType values used in `challanFromBill`, mapped from the
// corresponding Expenditure deduction field name. Used to build the
// council-side amountType filter lists below.
// ─────────────────────────────────────────────────────────────
const AMOUNT_TYPE = {
    earnestMoneyDeduction: "Earnest Money",
    ptax: "Professional Tax",
    carLoanRecovery: "Car Loan",
    houseLoanRecovery: "Building Loan",
    houseRent: "House Rent",
    securityDepositsDeduction: "Security Deposits",
    monopoly: "Monopoly",
    forestRoyalty: "Forest Royalty",
    mcForestRoyalty: "MC Forest Royalty",
    advanceRecovery: "Advance Payment",
    otherDeductions: "Other Deductions",
    cgst: "CGST",
    sgst: "SGST",
    igst: "IGST",
    itax: "ITAX",
    mdrrf: "MDRRF",
    dmft: "DMFT",
    labourCess: "Labour Cess",
    itForestRoyalty: "IT Forest Royalty",
    vat: "VAT",
    cpfCouncil: "CPF Council Share",
    cpfContribution: "CPF Contribution",
    cpfRecovery: "CPF Advance",
};

// Council-side amountType groupings (challanFromBill.amountType)
const COUNCIL_REVENUE_RECEIPT_TYPES = [
    AMOUNT_TYPE.ptax,
    AMOUNT_TYPE.forestRoyalty,
    AMOUNT_TYPE.mcForestRoyalty,
    AMOUNT_TYPE.houseRent,
    AMOUNT_TYPE.monopoly,
];

const COUNCIL_TAXES_DEDUCTED_TYPES = [
    AMOUNT_TYPE.cgst,
    AMOUNT_TYPE.dmft,
    AMOUNT_TYPE.igst,
    AMOUNT_TYPE.itForestRoyalty,
    AMOUNT_TYPE.itax,
    AMOUNT_TYPE.labourCess,
    AMOUNT_TYPE.mdrrf,
    AMOUNT_TYPE.sgst,
    AMOUNT_TYPE.vat,
];

const COUNCIL_SECURITY_DEDUCTED_TYPES = [
    AMOUNT_TYPE.securityDepositsDeduction, // "Security Deposits"
    AMOUNT_TYPE.earnestMoneyDeduction, // "Earnest Money"
];

const COUNCIL_OTHER_RECOVERIES_TYPES = [
    AMOUNT_TYPE.cpfCouncil,
    AMOUNT_TYPE.cpfContribution,
    AMOUNT_TYPE.cpfRecovery,
    AMOUNT_TYPE.otherDeductions,
];

const COUNCIL_OTHER_DEPOSITS_TYPES = [
    AMOUNT_TYPE.cpfCouncil,
    AMOUNT_TYPE.cpfContribution,
    AMOUNT_TYPE.cpfRecovery,
];

// majorHeads excluded from Council "Total Revenue Receipts" challan pull
const COUNCIL_REVENUE_RECEIPT_EXCLUDED_HEADS = [661, 662, 663, 664];

// ─────────────────────────────────────────────────────────────
// RECEIPT SIDE FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 1. Total Revenue Receipts
// STATE:   challan (challanType STATE) + stateChallan (majorHead 2011–3999)
// COUNCIL: challan (challanType COUNCIL), EXCLUDING majorHead 661/662/663/664
//          + challanFromBill (amountType in council revenue list, sector in [COUNCIL, STATE])
const getTotalRevenueReceipts = async (sector, dateRange) => {
    if (sector === "STATE") {
        const [challans, stateChallanRows] = await Promise.all([
            prisma.challan.findMany({
                where: {
                    isActive: true,
                    challanType: "STATE",
                    ...(dateRange ? { challanDate: dateRange } : {}),
                },
                select: { amount: true },
            }),
            prisma.stateChallan.findMany({
                where: {
                    sector: "STATE",
                    ...(dateRange ? { challanDate: dateRange } : {}),
                },
                select: { totalAmount: true, majorHead: true },
            }),
        ]);

        const challanTotal = challans.reduce((s, r) => s + safeNum(r.amount), 0);
        const stateChallanTotal = stateChallanRows.reduce((s, r) => {
            if (!headInRange(r.majorHead, 2011, 3999)) return s;
            return s + safeNum(r.totalAmount);
        }, 0);

        return challanTotal + stateChallanTotal;
    }

    if (sector === "COUNCIL") {
        const [challans, cfbRows] = await Promise.all([
            prisma.challan.findMany({
                where: {
                    isActive: true,
                    challanType: "COUNCIL",
                    ...(dateRange ? { challanDate: dateRange } : {}),
                },
                select: { amount: true, majorHead: true },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    amountType: { in: COUNCIL_REVENUE_RECEIPT_TYPES },
                    sector: { in: ["COUNCIL", "STATE"] },
                    ...(dateRange ? { voucharDate: dateRange } : {}),
                },
                select: { amount: true },
            }),
        ]);

        const challanTotal = challans
            .filter((r) => !headExcluded(r.majorHead, COUNCIL_REVENUE_RECEIPT_EXCLUDED_HEADS))
            .reduce((s, r) => s + safeNum(r.amount), 0);

        const cfbTotal = cfbRows.reduce((s, r) => s + safeNum(r.amount), 0);

        return challanTotal + cfbTotal;
    }

    // CONSOLIDATED
    const [stateTotal, councilTotal] = await Promise.all([
        getTotalRevenueReceipts("STATE", dateRange),
        getTotalRevenueReceipts("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 2. Total Expenditure on Revenue Account
// STATE:   Expenditure, majorHead 2011–3999, sector STATE
// COUNCIL: Expenditure, majorHead 201–224, sector COUNCIL
const getTotalRevenueExpenditure = async (sector, dateRange) => {
    if (sector === "STATE") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headInRange(r.majorHead, 2011, 3999));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    if (sector === "COUNCIL") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headInRange(r.majorHead, 201, 224));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getTotalRevenueExpenditure("STATE", dateRange),
        getTotalRevenueExpenditure("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 3. Total Capital Receipts
// STATE:   state_challans, majorHead 4000–5999, sector STATE (unchanged)
// COUNCIL: nil
const getTotalCapitalReceipts = async (sector, dateRange) => {
    if (sector === "COUNCIL") return 0;

    if (sector === "STATE") {
        const rows = await prisma.$queryRaw`
            SELECT "totalAmount"
            FROM "state_challans"
            WHERE "isActive" = true
              AND CAST("majorHead" AS INTEGER) BETWEEN 4000 AND 5999
              AND "sector" = 'STATE'::"Sector"

              ${dateRange
                ? Prisma.sql`
                    AND "challanDate" >= ${dateRange.gte}
                    AND "challanDate" <= ${dateRange.lte}
                  `
                : Prisma.empty}
        `;

        return rows.reduce((s, r) => s + safeNum(r.totalAmount), 0);
    }

    // CONSOLIDATED
    const [stateTotal, councilTotal] = await Promise.all([
        getTotalCapitalReceipts("STATE", dateRange),
        getTotalCapitalReceipts("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 4. Total Expenditure on Capital Account
// STATE:   Expenditure, majorHead 4001–5999, sector STATE (unchanged)
// COUNCIL: Expenditure, majorHead 440–443, sector COUNCIL
const getTotalCapitalExpenditure = async (sector, dateRange) => {
    if (sector === "STATE") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headInRange(r.majorHead, 4001, 5999));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    if (sector === "COUNCIL") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headInRange(r.majorHead, 440, 443));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getTotalCapitalExpenditure("STATE", dateRange),
        getTotalCapitalExpenditure("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 5. Loan Received from State Govt
// STATE:   challanTwo.loansReceivedGovt, sector STATE (unchanged)
// COUNCIL: nil
const getLoanFromStateGovt = async (sector, dateRange) => {
    if (sector === "COUNCIL") return 0;

    if (sector === "STATE") {
        const rows = await prisma.challanTwo.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { kaacChallanDate: dateRange } : {}),
            },
            select: { loansReceivedGovt: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.loansReceivedGovt), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getLoanFromStateGovt("STATE", dateRange),
        getLoanFromStateGovt("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 6. Loan Received from Other Sources
// STATE:   challanTwo.loansReceivedOther, sector STATE (unchanged)
// COUNCIL: nil
const getLoanFromOtherSources = async (sector, dateRange) => {
    if (sector === "COUNCIL") return 0;

    if (sector === "STATE") {
        const rows = await prisma.challanTwo.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { kaacChallanDate: dateRange } : {}),
            },
            select: { loansReceivedOther: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.loansReceivedOther), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getLoanFromOtherSources("STATE", dateRange),
        getLoanFromOtherSources("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 7. Recoveries of Loans
// STATE:   Expenditure.carLoanRecovery + houseLoanRecovery, sector STATE (unchanged)
// COUNCIL: challan (majorHead 661) + challanFromBill (majorHead 661), sector COUNCIL
const getRecoveriesOfLoans = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { carLoanRecovery: true, houseLoanRecovery: true },
        });

        return rows.reduce(
            (s, r) => s + safeNum(r.carLoanRecovery) + safeNum(r.houseLoanRecovery),
            0
        );
    }

    if (sector === "COUNCIL") {
        const [challanRows, cfbRows] = await Promise.all([
            prisma.challan.findMany({
                where: {
                    isActive: true,
                    challanType: "COUNCIL",
                    ...(dateRange ? { challanDate: dateRange } : {}),
                },
                select: { amount: true, majorHead: true },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    ...(dateRange ? { voucharDate: dateRange } : {}),
                },
                select: { amount: true, majorHead: true },
            }),
        ]);

        const challanTotal = challanRows
            .filter((r) => headEquals(r.majorHead, 661))
            .reduce((s, r) => s + safeNum(r.amount), 0);

        const cfbTotal = cfbRows
            .filter((r) => headEquals(r.majorHead, 661))
            .reduce((s, r) => s + safeNum(r.amount), 0);

        return challanTotal + cfbTotal;
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getRecoveriesOfLoans("STATE", dateRange),
        getRecoveriesOfLoans("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 8. Recoveries of Advances (NEW — previously hard-coded to 0 for everyone)
// STATE:   nil (unchanged behaviour)
// COUNCIL: challanFromBill, amountType "Advance Payment", sector COUNCIL
const getRecoveriesOfAdvances = async (sector, dateRange) => {
    if (sector === "STATE") return 0;

    if (sector === "COUNCIL") {
        const rows = await prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: AMOUNT_TYPE.advanceRecovery,
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { amount: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.amount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getRecoveriesOfAdvances("STATE", dateRange),
        getRecoveriesOfAdvances("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// ─────────────────────────────────────────────────────────────
// DISBURSEMENT SIDE FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 11. Repayment of Loan from State Govt
// STATE:   Expenditure.loanRepayGovt, sector STATE (unchanged)
// COUNCIL: nil
const getLoanRepayGovt = async (sector, dateRange) => {
    if (sector === "COUNCIL") return 0;

    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { loanRepayGovt: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.loanRepayGovt), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getLoanRepayGovt("STATE", dateRange),
        getLoanRepayGovt("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 12. Repayment of Loan from Other Sources
// STATE:   Expenditure.loanRepayOther, sector STATE (unchanged)
// COUNCIL: nil
const getLoanRepayOther = async (sector, dateRange) => {
    if (sector === "COUNCIL") return 0;

    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { loanRepayOther: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.loanRepayOther), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getLoanRepayOther("STATE", dateRange),
        getLoanRepayOther("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 13. Disbursement of Loans
// STATE:   Expenditure.loansAdvances, sector STATE (unchanged)
// COUNCIL: Expenditure, majorHead 661, sector COUNCIL — sum grossAmount
const getDisbursementOfLoans = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { loansAdvances: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.loansAdvances), 0);
    }

    if (sector === "COUNCIL") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headEquals(r.majorHead, 661));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getDisbursementOfLoans("STATE", dateRange),
        getDisbursementOfLoans("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 16. Disbursement of Advances (NEW — previously hard-coded to 0 for everyone)
// STATE:   nil (unchanged behaviour)
// COUNCIL: Expenditure, majorHead 8443, sector COUNCIL — sum grossAmount
const getDisbursementOfAdvances = async (sector, dateRange) => {
    if (sector === "STATE") return 0;

    if (sector === "COUNCIL") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headEquals(r.majorHead, 8443));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getDisbursementOfAdvances("STATE", dateRange),
        getDisbursementOfAdvances("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// ─────────────────────────────────────────────────────────────
// PART-II DEPOSIT FUND FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 19 (receipt) / 18 (disbursement, same value): Taxes Deducted at Source
// STATE:   Expenditure fields (cgst, sgst, igst, itax, forestRoyalty, houseRent,
//          mcForestRoyalty, monopoly, ptax, itForestRoyalty, vat), sector STATE (unchanged)
// COUNCIL: challanFromBill, amountType in [CGST, DMFT, IGST, IT Forest Royalty,
//          ITAX, Labour Cess, MDRRF, SGST, VAT], sector COUNCIL
const getTaxesDeducted = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: {
                cgst: true, sgst: true, igst: true,
                itax: true, forestRoyalty: true, houseRent: true, mcForestRoyalty: true,
                monopoly: true, ptax: true, itForestRoyalty: true, vat: true,
            },
        });

        return rows.reduce(
            (s, r) =>
                s +
                safeNum(r.cgst) + safeNum(r.sgst) + safeNum(r.igst) +
                safeNum(r.itax) + safeNum(r.forestRoyalty) + safeNum(r.houseRent) +
                safeNum(r.mcForestRoyalty) + safeNum(r.monopoly) + safeNum(r.ptax) +
                safeNum(r.itForestRoyalty) + safeNum(r.vat),
            0
        );
    }

    if (sector === "COUNCIL") {
        const rows = await prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: { in: COUNCIL_TAXES_DEDUCTED_TYPES },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { amount: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.amount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getTaxesDeducted("STATE", dateRange),
        getTaxesDeducted("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 20. Security Deposits Deducted
// STATE:   Expenditure.securityDepositsDeduction + earnestMoneyDeduction, sector STATE (unchanged)
// COUNCIL: challanFromBill, amountType in [Security Deposits, Earnest Money], sector COUNCIL
const getSecurityDepositsDeducted = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
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

        return rows.reduce(
            (s, r) => s + safeNum(r.securityDepositsDeduction) + safeNum(r.earnestMoneyDeduction),
            0
        );
    }

    if (sector === "COUNCIL") {
        const rows = await prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: { in: COUNCIL_SECURITY_DEDUCTED_TYPES },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { amount: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.amount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getSecurityDepositsDeducted("STATE", dateRange),
        getSecurityDepositsDeducted("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 21. Other Recoveries
// STATE:   challanFromBill, amountType in [Labour Cess, MDRRF, DMFT], sector STATE
// COUNCIL: challanFromBill, amountType in [CPF Council Share, CPF Contribution,
//          CPF Advance, Other Deductions], sector COUNCIL
const OTHER_RECOVERIES_STATE_TYPES = ["Labour Cess", "MDRRF", "DMFT"];

const getOtherRecoveries = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                amountType: { in: OTHER_RECOVERIES_STATE_TYPES },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { amount: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.amount), 0);
    }

    if (sector === "COUNCIL") {
        const rows = await prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                amountType: { in: COUNCIL_OTHER_RECOVERIES_TYPES },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { amount: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.amount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getOtherRecoveries("STATE", dateRange),
        getOtherRecoveries("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 25. Other Deposits
// STATE:   same rule as Other Recoveries (STATE) — challanFromBill,
//          amountType in [Labour Cess, MDRRF, DMFT], sector STATE
// COUNCIL: challanFromBill (amountType in [CPF Council Share, CPF Contribution,
//          CPF Advance], sector COUNCIL) + Expenditure (majorHead 662, sector COUNCIL)
const getOtherDeposits = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                amountType: { in: OTHER_RECOVERIES_STATE_TYPES },
                ...(dateRange ? { voucharDate: dateRange } : {}),
            },
            select: { amount: true },
        });

        return rows.reduce((s, r) => s + safeNum(r.amount), 0);
    }

    if (sector === "COUNCIL") {
        const [cfbRows, expenditureRows] = await Promise.all([
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    amountType: { in: COUNCIL_OTHER_DEPOSITS_TYPES },
                    ...(dateRange ? { voucharDate: dateRange } : {}),
                },
                select: { amount: true },
            }),
            prisma.expenditure.findMany({
                where: {
                    isActive: true,
                    sector: "COUNCIL",
                    ...(dateRange ? { voucherDate: dateRange } : {}),
                },
                select: { grossAmount: true, majorHead: true },
            }),
        ]);

        const cfbTotal = cfbRows.reduce((s, r) => s + safeNum(r.amount), 0);

        const expenditureTotal = expenditureRows
            .filter((r) => headEquals(r.majorHead, 662))
            .reduce((s, r) => s + safeNum(r.grossAmount), 0);

        return cfbTotal + expenditureTotal;
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getOtherDeposits("STATE", dateRange),
        getOtherDeposits("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 26. Security Deposits Refunded
// STATE:   Expenditure (securityDeposit, earnestMoney, securityDepositsDeduction,
//          earnestMoneyDeduction), sector STATE — unchanged
// COUNCIL: Expenditure, majorHead 664, sector COUNCIL — sum grossAmount
const getSecurityDepositsRefunded = async (sector, dateRange) => {
    if (sector === "STATE") {
        const rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "STATE",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: {
                securityDeposit: true,
                earnestMoney: true,
                securityDepositsDeduction: true,
                earnestMoneyDeduction: true,
            },
        });

        return rows.reduce(
            (s, r) =>
                s + safeNum(r.securityDeposit) + safeNum(r.earnestMoney) +
                safeNum(r.securityDepositsDeduction) + safeNum(r.earnestMoneyDeduction),
            0
        );
    }

    if (sector === "COUNCIL") {
        let rows = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                sector: "COUNCIL",
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { grossAmount: true, majorHead: true },
        });

        rows = rows.filter((r) => headEquals(r.majorHead, 664));

        return rows.reduce((s, r) => s + safeNum(r.grossAmount), 0);
    }

    const [stateTotal, councilTotal] = await Promise.all([
        getSecurityDepositsRefunded("STATE", dateRange),
        getSecurityDepositsRefunded("COUNCIL", dateRange),
    ]);
    return stateTotal + councilTotal;
};

// 31. Opening Cash Balance — unchanged, not part of this scope
const getOpeningCashBalance = async (sector, openingYear) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.openingBalance.findMany({
        where: {
            isActive: true,
            month: 4,
            ...(openingYear ? { year: openingYear } : {}),
            ...(!isConsolidated ? { sector } : {}),
        },
        select: { amount: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.amount), 0);
};

// 34. Closing Cash Balance — unchanged, not part of this scope
const getClosingCashBalance = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const [cashReceipts, challans] = await Promise.all([
        prisma.cashReceipt.findMany({
            where: {
                isActive: true,
                ...(!isConsolidated ? { sector } : {}),
                ...(dateRange ? { date: dateRange } : {}),
            },
            select: { rupeesInCash: true },
        }),
        prisma.challan.findMany({
            where: {
                isActive: true,
                ...(!isConsolidated ? { challanType: sector } : {}),
                ...(dateRange ? { challanDate: dateRange } : {}),
                NOT: {
                    OR: [
                        { counterfoilNo: null },
                        { counterfoilNo: "" },
                        { counterfoilNo: "0" },
                    ],
                },
            },
            select: { amount: true },
        }),
    ]);

    const cashTotal = cashReceipts.reduce((sum, r) => sum + safeNum(r.rupeesInCash), 0);
    const challanTotal = challans.reduce((sum, r) => sum + safeNum(r.amount), 0);

    return cashTotal - challanTotal;
};

// ─────────────────────────────────────────────────────────────
// BUILD COLUMN HELPER
// ─────────────────────────────────────────────────────────────

const buildColumn = ({
    revenueReceipts,
    revenueExpenditure,
    capitalReceipts,
    capitalExpenditure,
    loanStateGovt,
    loanOtherSources,
    recoveriesLoans,
    recoveriesAdvances = 0,
    loanRepayGovt,
    loanRepayOther,
    disbursementLoans,
    disbursementAdvances = 0,
    taxesDeducted,
    securityDeducted,
    otherRecoveries,
    securityRefunded,
    otherDeposits,
    openingCashBalance,
    closingCashBalance,
    prevTreasuryBalance = 0,
}) => {
    // ── Part I: Revenue ──────────────────────────────────────
    const revenueDiff = revenueReceipts - revenueExpenditure;
    const revenueDeficit = revenueDiff < 0 ? Math.abs(revenueDiff) : 0;
    const revenueSurplus = revenueDiff >= 0 ? revenueDiff : 0;

    // ── Part I: Capital ──────────────────────────────────────
    const capitalDiff = capitalReceipts - capitalExpenditure;
    const capitalDeficit = capitalDiff < 0 ? Math.abs(capitalDiff) : 0;
    const capitalSurplus = capitalDiff >= 0 ? capitalDiff : 0;

    // ── Part I: Debt ─────────────────────────────────────────
    const totalRecoveriesLoansAdvances = recoveriesLoans + recoveriesAdvances;
    const totalDisbursementLoansAdvances = disbursementLoans + disbursementAdvances;

    const totalReceiptPart1 =
        revenueReceipts +
        capitalReceipts +
        loanStateGovt +
        loanOtherSources +
        totalRecoveriesLoansAdvances;

    const totalDisbursementPart1 =
        revenueExpenditure +
        capitalExpenditure +
        loanRepayGovt +
        loanRepayOther +
        totalDisbursementLoansAdvances;

    // ── Part II: Deposit Fund ────────────────────────────────
    const fundsReceivedDeposits = 0;
    const expenditureAgainstDeposits = 0;

    const totalReceiptPart2 =
        fundsReceivedDeposits +
        taxesDeducted +
        securityDeducted +
        otherRecoveries;

    const totalDisbursementPart2 =
        expenditureAgainstDeposits +
        taxesDeducted +
        securityRefunded +
        otherDeposits;

    // ── Grand Totals ─────────────────────────────────────────
    const totalReceipts = totalReceiptPart1 + totalReceiptPart2;
    const totalDisbursements = totalDisbursementPart1 + totalDisbursementPart2;

    // ── Balances ─────────────────────────────────────────────
    const treasuryBalanceReceiptSide = prevTreasuryBalance;
    const treasuryBalanceDisbursementSide =
        (totalReceipts - totalDisbursements) + prevTreasuryBalance;

    const grandTotalReceipt =
        totalReceipts + openingCashBalance + treasuryBalanceReceiptSide;
    const grandTotalDisbursement =
        totalDisbursements + closingCashBalance + treasuryBalanceDisbursementSide;

    return {
        revenueReceipts,
        revenueExpenditure,
        revenueDeficit,
        revenueSurplus,
        capitalReceipts,
        capitalExpenditure,
        capitalDeficit,
        capitalSurplus,
        loanStateGovt,
        loanOtherSources,
        recoveriesLoans,
        recoveriesAdvances,
        totalRecoveriesLoansAdvances,
        totalReceiptPart1,
        loanRepayGovt,
        loanRepayOther,
        disbursementLoans,
        disbursementAdvances,
        totalDisbursementLoansAdvances,
        totalDisbursementPart1,
        fundsReceivedDeposits,
        taxesDeducted,
        securityDeducted,
        otherRecoveries,
        totalReceiptPart2,
        expenditureAgainstDeposits,
        taxesDeductedDisbursement: taxesDeducted,
        securityRefunded,
        otherDeposits,
        totalDisbursementPart2,
        totalReceipts,
        totalDisbursements,
        openingCashBalance,
        closingCashBalance,
        treasuryBalanceReceiptSide,
        treasuryBalanceDisbursementSide,
        grandTotalReceipt,
        grandTotalDisbursement,
    };
};

// ─────────────────────────────────────────────────────────────
// MAIN SERVICE FUNCTION
// ─────────────────────────────────────────────────────────────

export const getStatement1Data = async (sector, from, to) => {
    try {
        logger.info(
            `Fetching Statement 1 for sector: ${sector ?? "ALL"}, from: ${from ?? "ALL"}, to: ${to ?? "ALL"}`
        );

        const currentDateRange = getDateRangeFromParams(from, to);

        // Best-effort year for the opening-balance lookup — see comment
        // on getOpeningCashBalance above.
        const openingYear = from ? new Date(from).getFullYear() : null;

        // Previous period = same from/to window, shifted back one year.
        // Every condition (sector rules, majorHead filters, etc.) stays
        // identical — only the date range moves.
        const previousFrom = shiftYear(from, -1);
        const previousTo = shiftYear(to, -1);
        const previousDateRange = getDateRangeFromParams(previousFrom, previousTo);
        const previousOpeningYear = previousFrom ? new Date(previousFrom).getFullYear() : null;

        const [
            currRevenueReceipts,
            currRevenueExpenditure,
            currCapitalReceipts,
            currCapitalExpenditure,
            currLoanStateGovt,
            currLoanOtherSources,
            currRecoveriesLoans,
            currRecoveriesAdvances,
            currLoanRepayGovt,
            currLoanRepayOther,
            currDisbursementLoans,
            currDisbursementAdvances,
            currTaxesDeducted,
            currSecurityDeducted,
            currOtherRecoveries,
            currSecurityRefunded,
            currOtherDeposits,
            currOpeningCashBalance,
            currClosingCashBalance,
        ] = await Promise.all([
            getTotalRevenueReceipts(sector, currentDateRange),
            getTotalRevenueExpenditure(sector, currentDateRange),
            getTotalCapitalReceipts(sector, currentDateRange),
            getTotalCapitalExpenditure(sector, currentDateRange),
            getLoanFromStateGovt(sector, currentDateRange),
            getLoanFromOtherSources(sector, currentDateRange),
            getRecoveriesOfLoans(sector, currentDateRange),
            getRecoveriesOfAdvances(sector, currentDateRange),
            getLoanRepayGovt(sector, currentDateRange),
            getLoanRepayOther(sector, currentDateRange),
            getDisbursementOfLoans(sector, currentDateRange),
            getDisbursementOfAdvances(sector, currentDateRange),
            getTaxesDeducted(sector, currentDateRange),
            getSecurityDepositsDeducted(sector, currentDateRange),
            getOtherRecoveries(sector, currentDateRange),
            getSecurityDepositsRefunded(sector, currentDateRange),
            getOtherDeposits(sector, currentDateRange),
            getOpeningCashBalance(sector, openingYear),
            getClosingCashBalance(sector, currentDateRange),
        ]);

        const [
            prevRevenueReceipts,
            prevRevenueExpenditure,
            prevCapitalReceipts,
            prevCapitalExpenditure,
            prevLoanStateGovt,
            prevLoanOtherSources,
            prevRecoveriesLoans,
            prevRecoveriesAdvances,
            prevLoanRepayGovt,
            prevLoanRepayOther,
            prevDisbursementLoans,
            prevDisbursementAdvances,
            prevTaxesDeducted,
            prevSecurityDeducted,
            prevOtherRecoveries,
            prevSecurityRefunded,
            prevOtherDeposits,
            prevOpeningCashBalance,
            prevClosingCashBalance,
        ] = await Promise.all([
            getTotalRevenueReceipts(sector, previousDateRange),
            getTotalRevenueExpenditure(sector, previousDateRange),
            getTotalCapitalReceipts(sector, previousDateRange),
            getTotalCapitalExpenditure(sector, previousDateRange),
            getLoanFromStateGovt(sector, previousDateRange),
            getLoanFromOtherSources(sector, previousDateRange),
            getRecoveriesOfLoans(sector, previousDateRange),
            getRecoveriesOfAdvances(sector, previousDateRange),
            getLoanRepayGovt(sector, previousDateRange),
            getLoanRepayOther(sector, previousDateRange),
            getDisbursementOfLoans(sector, previousDateRange),
            getDisbursementOfAdvances(sector, previousDateRange),
            getTaxesDeducted(sector, previousDateRange),
            getSecurityDepositsDeducted(sector, previousDateRange),
            getOtherRecoveries(sector, previousDateRange),
            getSecurityDepositsRefunded(sector, previousDateRange),
            getOtherDeposits(sector, previousDateRange),
            getOpeningCashBalance(sector, previousOpeningYear),
            getClosingCashBalance(sector, previousDateRange),
        ]);

        const prevColumn = buildColumn({
            revenueReceipts: prevRevenueReceipts,
            revenueExpenditure: prevRevenueExpenditure,
            capitalReceipts: prevCapitalReceipts,
            capitalExpenditure: prevCapitalExpenditure,
            loanStateGovt: prevLoanStateGovt,
            loanOtherSources: prevLoanOtherSources,
            recoveriesLoans: prevRecoveriesLoans,
            recoveriesAdvances: prevRecoveriesAdvances,
            loanRepayGovt: prevLoanRepayGovt,
            loanRepayOther: prevLoanRepayOther,
            disbursementLoans: prevDisbursementLoans,
            disbursementAdvances: prevDisbursementAdvances,
            taxesDeducted: prevTaxesDeducted,
            securityDeducted: prevSecurityDeducted,
            otherRecoveries: prevOtherRecoveries,
            securityRefunded: prevSecurityRefunded,
            otherDeposits: prevOtherDeposits,
            openingCashBalance: prevOpeningCashBalance,
            closingCashBalance: prevClosingCashBalance,
            prevTreasuryBalance: 0,
        });

        const currColumn = buildColumn({
            revenueReceipts: currRevenueReceipts,
            revenueExpenditure: currRevenueExpenditure,
            capitalReceipts: currCapitalReceipts,
            capitalExpenditure: currCapitalExpenditure,
            loanStateGovt: currLoanStateGovt,
            loanOtherSources: currLoanOtherSources,
            recoveriesLoans: currRecoveriesLoans,
            recoveriesAdvances: currRecoveriesAdvances,
            loanRepayGovt: currLoanRepayGovt,
            loanRepayOther: currLoanRepayOther,
            disbursementLoans: currDisbursementLoans,
            disbursementAdvances: currDisbursementAdvances,
            taxesDeducted: currTaxesDeducted,
            securityDeducted: currSecurityDeducted,
            otherRecoveries: currOtherRecoveries,
            securityRefunded: currSecurityRefunded,
            otherDeposits: currOtherDeposits,
            openingCashBalance: currOpeningCashBalance,
            closingCashBalance: currClosingCashBalance,
            prevTreasuryBalance: 0,
        });

        const fmt = (n) => Number(n ?? 0).toFixed(2);
        const pair = (key) => [fmt(prevColumn[key]), fmt(currColumn[key])];

        logger.info(
            `Statement 1 built successfully for sector: ${sector ?? "ALL"}`
        );

        return {
            financialYear: {
                current: from && to ? `${from} to ${to}` : "Current Period",
                previous: previousFrom && previousTo ? `${previousFrom} to ${previousTo}` : "Previous Period",
            },
            revenueReceipts: pair("revenueReceipts"),
            revenueExpenditure: pair("revenueExpenditure"),
            revenueDeficit: pair("revenueDeficit"),
            revenueSurplus: pair("revenueSurplus"),
            capitalReceipts: pair("capitalReceipts"),
            capitalExpenditure: pair("capitalExpenditure"),
            capitalDeficit: pair("capitalDeficit"),
            capitalSurplus: pair("capitalSurplus"),
            loanStateGovt: pair("loanStateGovt"),
            loanOtherSources: pair("loanOtherSources"),
            recoveriesLoans: pair("recoveriesLoans"),
            recoveriesAdvances: pair("recoveriesAdvances"),
            totalRecoveriesLoansAdvances: pair("totalRecoveriesLoansAdvances"),
            totalReceiptPart1: pair("totalReceiptPart1"),
            loanRepayGovt: pair("loanRepayGovt"),
            loanRepayOther: pair("loanRepayOther"),
            disbursementLoans: pair("disbursementLoans"),
            disbursementAdvances: pair("disbursementAdvances"),
            totalDisbursementLoansAdvances: pair("totalDisbursementLoansAdvances"),
            totalDisbursementPart1: pair("totalDisbursementPart1"),
            fundsReceivedDeposits: pair("fundsReceivedDeposits"),
            taxesDeducted: pair("taxesDeducted"),
            securityDeducted: pair("securityDeducted"),
            otherRecoveries: pair("otherRecoveries"),
            totalReceiptPart2: pair("totalReceiptPart2"),
            expenditureAgainstDeposits: pair("expenditureAgainstDeposits"),
            taxesDeductedDisbursement: pair("taxesDeductedDisbursement"),
            securityRefunded: pair("securityRefunded"),
            otherDeposits: pair("otherDeposits"),
            totalDisbursementPart2: pair("totalDisbursementPart2"),
            totalReceipts: pair("totalReceipts"),
            totalDisbursements: pair("totalDisbursements"),
            openingCashBalance: pair("openingCashBalance"),
            closingCashBalance: pair("closingCashBalance"),
            treasuryBalanceReceiptSide: pair("treasuryBalanceReceiptSide"),
            treasuryBalanceDisbursementSide: pair("treasuryBalanceDisbursementSide"),
            grandTotalReceipt: pair("grandTotalReceipt"),
            grandTotalDisbursement: pair("grandTotalDisbursement"),
        };
    } catch (error) {
        logger.error(`Error fetching Statement 1 data: ${error.message}`);
        throw error;
    }
};