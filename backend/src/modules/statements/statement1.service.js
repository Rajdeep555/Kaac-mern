import { Prisma } from "@prisma/client";
import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// STATEMENT 1 - Summary of Transactions
// Two columns: previous FY + current FY
// ─────────────────────────────────────────────────────────────

const parseFY = (financialYear) => {
    if (!financialYear) return { startYear: null, endYear: null };
    const parts = financialYear.split("-");
    return {
        startYear: parseInt(parts[0]),
        endYear: parseInt(parts[1]),
    };
};

const getFYDateRange = (startYear, endYear) => {
    if (!startYear || !endYear) return null;
    return {
        gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
        lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
    };
};

const safeNum = (val) => Number(val ?? 0);

// ─────────────────────────────────────────────────────────────
// RECEIPT SIDE FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 1. Total Revenue Receipts
// challan + challanFromBill (specific types) + stateChallan (STATE/CONSOLIDATED)
const getTotalRevenueReceipts = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";
    const includeStateChallans =
        !sector || sector === "CONSOLIDATED" || sector === "STATE";

    const [challans, cfbRows, stateChallanRows] = await Promise.all([
        prisma.challan.findMany({
            where: {
                isActive: true,
                ...(!isConsolidated ? { challanType: sector } : {}),
                ...(dateRange ? { challanDate: dateRange } : {}),
            },
            select: { amount: true },
        }),

        prisma.challanFromBill.findMany({
            where: {
                isActive: true,
                amountType: {
                    in: ["Professional Tax", "MC Forest Royalty", "Monopoly", "Forest Royalty"],
                },
                ...(!isConsolidated ? { sector } : {}),
                ...(dateRange ? { voucherDate: dateRange } : {}),
            },
            select: { amount: true },
        }),

        // ── NEW: StateChallan (STATE / CONSOLIDATED only) ────
        // No isActive field on model — filter by sector = "STATE"
        includeStateChallans
            ? prisma.stateChallan.findMany({
                where: {
                    sector: "STATE",
                    ...(dateRange ? { challanDate: dateRange } : {}),
                },
                select: { totalAmount: true },
            })
            : Promise.resolve([]),
    ]);

    const challanTotal = challans.reduce((sum, r) => sum + safeNum(r.amount), 0);
    const cfbTotal = cfbRows.reduce((sum, r) => sum + safeNum(r.amount), 0);

    // totalAmount stored in lakhs → multiply by 100000
    const stateChallanTotal = stateChallanRows.reduce(
        (sum, r) =>
            sum +
            (r.totalAmount != null
                ? parseFloat((r.totalAmount * 100000).toFixed(2))
                : 0),
        0
    );

    return challanTotal + cfbTotal + stateChallanTotal;
};

// 2. Total Expenditure on Revenue Account
const getTotalRevenueExpenditure = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            expenditureType: "REVENUE",
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { grossAmount: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.grossAmount), 0);
};

// 3. Total Capital Receipts
// const getTotalCapitalReceipts = async (sector, dateRange) => {
//     const isConsolidated = !sector || sector === "CONSOLIDATED";

//     const rows = await prisma.challan.findMany({
//         where: {
//             isActive: true,
//             majorHead: { gte: "4000", lte: "5999" },
//             ...(!isConsolidated ? { challanType: sector } : {}),
//             ...(dateRange ? { challanDate: dateRange } : {}),
//         },
//         select: { amount: true },
//     });

//     return rows.reduce((sum, r) => sum + safeNum(r.amount), 0);
// };

const getTotalCapitalReceipts = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.$queryRaw`
        SELECT amount FROM "Challan"
        WHERE "isActive" = true
        AND CAST("majorHead" AS INTEGER) BETWEEN 4000 AND 5999
        ${!isConsolidated
            ? Prisma.sql`AND "challanType" = ${sector}::"ChallanType"`
            : Prisma.empty}
        ${dateRange
            ? Prisma.sql`AND "challanDate" >= ${dateRange.gte} AND "challanDate" <= ${dateRange.lte}`
            : Prisma.empty}
    `;

    return rows.reduce((sum, r) => sum + safeNum(r.amount), 0);
};

// 4. Total Expenditure on Capital Account
const getTotalCapitalExpenditure = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            expenditureType: "CAPITAL",
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { grossAmount: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.grossAmount), 0);
};

// 5. Loan Received from State Govt
const getLoanFromStateGovt = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.challanTwo.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { kaacChallanDate: dateRange } : {}),
        },
        select: { loansReceivedGovt: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.loansReceivedGovt), 0);
};

// 6. Loan Received from Other Sources
const getLoanFromOtherSources = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.challanTwo.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { kaacChallanDate: dateRange } : {}),
        },
        select: { loansReceivedOther: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.loansReceivedOther), 0);
};

// 7. Recoveries of Loans
const getRecoveriesOfLoans = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { carLoanRecovery: true, houseLoanRecovery: true },
    });

    return rows.reduce(
        (sum, r) => sum + safeNum(r.carLoanRecovery) + safeNum(r.houseLoanRecovery),
        0
    );
};

// ─────────────────────────────────────────────────────────────
// DISBURSEMENT SIDE FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 11. Repayment of Loan from State Govt
const getLoanRepayGovt = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { loanRepayGovt: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.loanRepayGovt), 0);
};

// 12. Repayment of Loan from Other Sources
const getLoanRepayOther = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { loanRepayOther: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.loanRepayOther), 0);
};

// 13. Disbursement of Loans
const getDisbursementOfLoans = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: { loansAdvances: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.loansAdvances), 0);
};

// ─────────────────────────────────────────────────────────────
// PART-II DEPOSIT FUND FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 19. Taxes Deducted at Source
const getTaxesDeducted = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: {
            cgst: true, sgst: true, igst: true,
            itax: true, mdrrf: true, dmft: true,
            labourCess: true, itForestRoyalty: true, vat: true,
        },
    });

    return rows.reduce(
        (sum, r) =>
            sum +
            safeNum(r.cgst) + safeNum(r.sgst) + safeNum(r.igst) +
            safeNum(r.itax) + safeNum(r.mdrrf) + safeNum(r.dmft) +
            safeNum(r.labourCess) + safeNum(r.itForestRoyalty) + safeNum(r.vat),
        0
    );
};

// 20. Security Deposits Deducted
const getSecurityDepositsDeducted = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: {
            securityDepositsDeduction: true,
            earnestMoneyDeduction: true,
        },
    });

    return rows.reduce(
        (sum, r) =>
            sum +
            safeNum(r.securityDepositsDeduction) +
            safeNum(r.earnestMoneyDeduction),
        0
    );
};

// 21. Other Recoveries
const getOtherRecoveries = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: {
            advanceRecovery: true,
            houseRent: true,
            otherDeductions: true,
        },
    });

    return rows.reduce(
        (sum, r) =>
            sum +
            safeNum(r.advanceRecovery) +
            safeNum(r.houseRent) +
            safeNum(r.otherDeductions),
        0
    );
};

// 26. Security Deposits Refunded
const getSecurityDepositsRefunded = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...(!isConsolidated ? { sector } : {}),
            ...(dateRange ? { voucherDate: dateRange } : {}),
        },
        select: {
            securityDeposit: true,
            earnestMoney: true,
        },
    });

    return rows.reduce(
        (sum, r) => sum + safeNum(r.securityDeposit) + safeNum(r.earnestMoney),
        0
    );
};

// 31. Opening Cash Balance
const getOpeningCashBalance = async (sector, startYear) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.openingBalance.findMany({
        where: {
            isActive: true,
            month: 4,
            ...(startYear ? { year: startYear } : {}),
            ...(!isConsolidated ? { sector } : {}),
        },
        select: { amount: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.amount), 0);
};

// 34. Closing Cash Balance
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
    loanRepayGovt,
    loanRepayOther,
    disbursementLoans,
    taxesDeducted,
    securityDeducted,
    otherRecoveries,
    securityRefunded,
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
    const recoveriesAdvances = 0;
    const disbursementAdvances = 0;

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
    const otherDeposits = 0;

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

export const getStatement1Data = async (sector, financialYear) => {
    try {
        logger.info(
            `Fetching Statement 1 for sector: ${sector ?? "ALL"}, FY: ${financialYear ?? "ALL"}`
        );

        const { startYear, endYear } = parseFY(financialYear);
        const currentDateRange = getFYDateRange(startYear, endYear);

        const [
            currRevenueReceipts,        // ← includes stateChallanTotal now
            currRevenueExpenditure,
            currCapitalReceipts,
            currCapitalExpenditure,
            currLoanStateGovt,
            currLoanOtherSources,
            currRecoveriesLoans,
            currLoanRepayGovt,
            currLoanRepayOther,
            currDisbursementLoans,
            currTaxesDeducted,
            currSecurityDeducted,
            currOtherRecoveries,
            currSecurityRefunded,
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
            getLoanRepayGovt(sector, currentDateRange),
            getLoanRepayOther(sector, currentDateRange),
            getDisbursementOfLoans(sector, currentDateRange),
            getTaxesDeducted(sector, currentDateRange),
            getSecurityDepositsDeducted(sector, currentDateRange),
            getOtherRecoveries(sector, currentDateRange),
            getSecurityDepositsRefunded(sector, currentDateRange),
            getOpeningCashBalance(sector, startYear),
            getClosingCashBalance(sector, currentDateRange),
        ]);

        const prevColumn = buildColumn({
            revenueReceipts: 0,
            revenueExpenditure: 0,
            capitalReceipts: 0,
            capitalExpenditure: 0,
            loanStateGovt: 0,
            loanOtherSources: 0,
            recoveriesLoans: 0,
            loanRepayGovt: 0,
            loanRepayOther: 0,
            disbursementLoans: 0,
            taxesDeducted: 0,
            securityDeducted: 0,
            otherRecoveries: 0,
            securityRefunded: 0,
            openingCashBalance: 0,
            closingCashBalance: 0,
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
            loanRepayGovt: currLoanRepayGovt,
            loanRepayOther: currLoanRepayOther,
            disbursementLoans: currDisbursementLoans,
            taxesDeducted: currTaxesDeducted,
            securityDeducted: currSecurityDeducted,
            otherRecoveries: currOtherRecoveries,
            securityRefunded: currSecurityRefunded,
            openingCashBalance: currOpeningCashBalance,
            closingCashBalance: currClosingCashBalance,
            prevTreasuryBalance: 0,
        });

        const fmt = (n) => Number(n ?? 0).toFixed(2);
        const pair = (key) => [fmt(prevColumn[key]), fmt(currColumn[key])];

        const prevStartYear = startYear ? startYear - 1 : null;
        const prevEndYear = endYear ? endYear - 1 : null;

        logger.info(
            `Statement 1 built successfully for sector: ${sector ?? "ALL"}`
        );

        return {
            financialYear: {
                current: financialYear ?? "Current Year",
                previous: prevStartYear
                    ? `${prevStartYear}-${prevEndYear}`
                    : "Previous Year",
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
