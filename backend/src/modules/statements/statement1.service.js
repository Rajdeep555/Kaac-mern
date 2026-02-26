
import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// STATEMENT 1 - Summary of Transactions
// Two columns: previous FY + current FY
// ─────────────────────────────────────────────────────────────

// Helper: parse FY string → { startYear, endYear }
// e.g. "2025-2026" → { startYear: 2025, endYear: 2026 }
const parseFY = (financialYear) => {
    if (!financialYear) return { startYear: null, endYear: null };
    const parts = financialYear.split("-");
    return {
        startYear: parseInt(parts[0]),
        endYear: parseInt(parts[1]),
    };
};

// Helper: get date range for a financial year
// FY runs April 1 (startYear) to March 31 (endYear)
// Returns null if years are missing — callers skip filter when null
const getFYDateRange = (startYear, endYear) => {
    if (!startYear || !endYear) return null;
    return {
        gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
        lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
    };
};

// Helper: safely convert Decimal/null to number
const safeNum = (val) => Number(val ?? 0);

// ─────────────────────────────────────────────────────────────
// RECEIPT SIDE FUNCTIONS
// ─────────────────────────────────────────────────────────────

// 1. Total Revenue Receipts
// challan (all amounts) + challanFromBill (specific receipt types)
const getTotalRevenueReceipts = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const [challans, cfbRows] = await Promise.all([
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
    ]);

    const challanTotal = challans.reduce((sum, r) => sum + safeNum(r.amount), 0);
    const cfbTotal = cfbRows.reduce((sum, r) => sum + safeNum(r.amount), 0);

    return challanTotal + cfbTotal;
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
// From challan where majorHead is in capital range (4000-5999)
// Update range as per your actual capital head codes
const getTotalCapitalReceipts = async (sector, dateRange) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.challan.findMany({
        where: {
            isActive: true,
            majorHead: { gte: "4000", lte: "5999" },
            ...(!isConsolidated ? { challanType: sector } : {}),
            ...(dateRange ? { challanDate: dateRange } : {}),
        },
        select: { amount: true },
    });

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

// 5. Loan Received from State Govt (challanTwo → loansReceivedGovt)
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

// 6. Loan Received from Other Sources (challanTwo → loansReceivedOther)
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

// 7. Recoveries of Loans (carLoanRecovery + houseLoanRecovery)
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

// 13. Disbursement of Loans (loansAdvances)
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

// 26. Security Deposits Refunded (securityDeposit + earnestMoney)
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

// 31. Opening Cash Balance (from OpeningBalance table)
// Only April (month=4) of the given FY start year
const getOpeningCashBalance = async (sector, startYear) => {
    const isConsolidated = !sector || sector === "CONSOLIDATED";

    const rows = await prisma.openingBalance.findMany({
        where: {
            isActive: true,
            month: 4,
            // Only filter by year if startYear is a valid number
            ...(startYear ? { year: startYear } : {}),
            ...(!isConsolidated ? { sector } : {}),
        },
        select: { amount: true },
    });

    return rows.reduce((sum, r) => sum + safeNum(r.amount), 0);
};

// 34. Closing Cash Balance
// CashReceipt (rupeesInCash) minus challan where counterfoilNo is not null/empty/0
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

        // Challans with a valid counterfoilNo = treasury challans
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
// Computes all derived values for one FY column
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
    const recoveriesAdvances = 0;           // 8. hardcoded zero
    const disbursementAdvances = 0;         // 14. hardcoded zero

    // 9. Total Recoveries of Loans and Advances
    const totalRecoveriesLoansAdvances = recoveriesLoans + recoveriesAdvances;

    // 15. Total Disbursement of Loans and Advances
    const totalDisbursementLoansAdvances = disbursementLoans + disbursementAdvances;

    // 10. Total Receipt Part-I
    const totalReceiptPart1 =
        revenueReceipts +
        capitalReceipts +
        loanStateGovt +
        loanOtherSources +
        totalRecoveriesLoansAdvances;

    // 16. Total Disbursement Part-I
    const totalDisbursementPart1 =
        revenueExpenditure +
        capitalExpenditure +
        loanRepayGovt +
        loanRepayOther +
        totalDisbursementLoansAdvances;

    // ── Part II: Deposit Fund ────────────────────────────────
    const fundsReceivedDeposits = 0;        // 18. hardcoded zero
    const expenditureAgainstDeposits = 0;   // 24. hardcoded zero
    const otherDeposits = 0;                // 27. hardcoded zero

    // 22. Total Receipt Part-II
    const totalReceiptPart2 =
        fundsReceivedDeposits +
        taxesDeducted +
        securityDeducted +
        otherRecoveries;

    // 29. Total Disbursement Part-II
    const totalDisbursementPart2 =
        expenditureAgainstDeposits +
        taxesDeducted +         // 25. same value as 19
        securityRefunded +
        otherDeposits;

    // ── Grand Totals ─────────────────────────────────────────
    // 23. Total Receipts
    const totalReceipts = totalReceiptPart1 + totalReceiptPart2;

    // 30. Total Disbursements
    const totalDisbursements = totalDisbursementPart1 + totalDisbursementPart2;

    // ── Balances ─────────────────────────────────────────────
    // 32. Treasury Balance (Receipt Side) = carried from previous year
    const treasuryBalanceReceiptSide = prevTreasuryBalance;

    // 35. Treasury Balance (Disbursement Side)
    const treasuryBalanceDisbursementSide =
        (totalReceipts - totalDisbursements) + prevTreasuryBalance;

    // 33. Grand Total (Receipt Side)
    const grandTotalReceipt =
        totalReceipts + openingCashBalance + treasuryBalanceReceiptSide;

    // 36. Grand Total (Disbursement Side)
    const grandTotalDisbursement =
        totalDisbursements + closingCashBalance + treasuryBalanceDisbursementSide;

    return {
        // Part I Revenue
        revenueReceipts,
        revenueExpenditure,
        revenueDeficit,
        revenueSurplus,
        // Part I Capital
        capitalReceipts,
        capitalExpenditure,
        capitalDeficit,
        capitalSurplus,
        // Part I Debt Receipt
        loanStateGovt,
        loanOtherSources,
        recoveriesLoans,
        recoveriesAdvances,
        totalRecoveriesLoansAdvances,
        totalReceiptPart1,
        // Part I Debt Disbursement
        loanRepayGovt,
        loanRepayOther,
        disbursementLoans,
        disbursementAdvances,
        totalDisbursementLoansAdvances,
        totalDisbursementPart1,
        // Part II Receipt
        fundsReceivedDeposits,
        taxesDeducted,
        securityDeducted,
        otherRecoveries,
        totalReceiptPart2,
        // Part II Disbursement
        expenditureAgainstDeposits,
        taxesDeductedDisbursement: taxesDeducted,   // same as 19
        securityRefunded,
        otherDeposits,
        totalDisbursementPart2,
        // Totals & Balances
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

        // ── Parse current FY only ────────────────────────────
        const { startYear, endYear } = parseFY(financialYear);
        const currentDateRange = getFYDateRange(startYear, endYear);

        // ── Fetch only CURRENT FY data ───────────────────────
        const [
            currRevenueReceipts,
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

        // ── Previous FY column — all zeros, no DB query needed ──
        // You don't have previous year data in the system yet
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

        // ── Current FY column ────────────────────────────────
        // prevTreasuryBalance = 0 since no previous year data exists
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
            prevTreasuryBalance: 0, // no previous year treasury to carry forward
        });

        const fmt = (n) => Number(n ?? 0).toFixed(2);
        const pair = (key) => [fmt(prevColumn[key]), fmt(currColumn[key])];

        // Previous FY label derived from current FY
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
            // Part I Revenue
            revenueReceipts: pair("revenueReceipts"),
            revenueExpenditure: pair("revenueExpenditure"),
            revenueDeficit: pair("revenueDeficit"),
            revenueSurplus: pair("revenueSurplus"),
            // Part I Capital
            capitalReceipts: pair("capitalReceipts"),
            capitalExpenditure: pair("capitalExpenditure"),
            capitalDeficit: pair("capitalDeficit"),
            capitalSurplus: pair("capitalSurplus"),
            // Part I Debt Receipt
            loanStateGovt: pair("loanStateGovt"),
            loanOtherSources: pair("loanOtherSources"),
            recoveriesLoans: pair("recoveriesLoans"),
            recoveriesAdvances: pair("recoveriesAdvances"),
            totalRecoveriesLoansAdvances: pair("totalRecoveriesLoansAdvances"),
            totalReceiptPart1: pair("totalReceiptPart1"),
            // Part I Debt Disbursement
            loanRepayGovt: pair("loanRepayGovt"),
            loanRepayOther: pair("loanRepayOther"),
            disbursementLoans: pair("disbursementLoans"),
            disbursementAdvances: pair("disbursementAdvances"),
            totalDisbursementLoansAdvances: pair("totalDisbursementLoansAdvances"),
            totalDisbursementPart1: pair("totalDisbursementPart1"),
            // Part II Receipt
            fundsReceivedDeposits: pair("fundsReceivedDeposits"),
            taxesDeducted: pair("taxesDeducted"),
            securityDeducted: pair("securityDeducted"),
            otherRecoveries: pair("otherRecoveries"),
            totalReceiptPart2: pair("totalReceiptPart2"),
            // Part II Disbursement
            expenditureAgainstDeposits: pair("expenditureAgainstDeposits"),
            taxesDeductedDisbursement: pair("taxesDeductedDisbursement"),
            securityRefunded: pair("securityRefunded"),
            otherDeposits: pair("otherDeposits"),
            totalDisbursementPart2: pair("totalDisbursementPart2"),
            // Totals & Balances
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

