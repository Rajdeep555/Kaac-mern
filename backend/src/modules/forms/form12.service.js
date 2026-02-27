import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

const RECEIPT_CFB_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "MC Forest Royalty",
    "Monopoly",
];

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

export const getForm12Data = async (sector) => {
    try {
        logger.info(`Fetching Form 12 data for sector: ${sector ?? "ALL"}`);

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};
        const challanSectorFilter =
            sector && sector !== "CONSOLIDATED" ? { challanType: sector } : {};

        const includeStateChallans =
            !sector || sector === "CONSOLIDATED" || sector === "STATE";

        const [
            openingRows,
            treasuryPlaRows,
            challanRows,
            challanFromBillRows,
            challanTwoRows,
            expenditureRows,
            cashReceiptRows,
            stateChallanRows,
        ] = await Promise.all([
            prisma.openingBalance.findMany({
                where: { isActive: true, ...sectorFilter },
                select: { amount: true },
            }),
            prisma.treasuryPla.findMany({
                where: { isActive: true, ...sectorFilter },
                select: { amount: true },
            }),
            prisma.challan.findMany({
                where: { isActive: true, ...challanSectorFilter },
                select: {
                    id: true,
                    amount: true,
                    challanType: true,
                    departmentId: true,
                    treasuryChallanNo: true,
                },
            }),
            prisma.challanFromBill.findMany({
                where: { isActive: true, ...sectorFilter },
                select: {
                    id: true,
                    amount: true,
                    amountType: true,
                    expenditureType: true,
                    treasuryChallanNo: true,
                },
            }),
            prisma.challanTwo.findMany({
                where: { isActive: true, ...sectorFilter },
                select: {
                    id: true,
                    grantsInAid: true,
                    loansReceivedGovt: true,
                    loansReceivedOther: true,
                    amount: true,
                    treasuryChallanNo: true,
                },
            }),
            prisma.expenditure.findMany({
                where: { isActive: true, ...sectorFilter },
                select: {
                    id: true,
                    expenditureType: true, // ✅ ADDED for disbPartI filter
                    grossAmount: true,
                    carLoanRecovery: true,
                    houseLoanRecovery: true,
                    advanceRecovery: true,
                    otherDeductions: true,
                    houseRent: true,
                    cpfCouncil: true,
                    cpfContribution: true,
                    cpfRecovery: true,
                    securityDepositsDeduction: true,
                    earnestMoneyDeduction: true,
                    securityDeposit: true,
                    earnestMoney: true,
                    transferPayment: true,
                    loanRepayGovt: true,
                    loanRepayOther: true,
                    loansAdvances: true,
                },
            }),
            prisma.cashReceipt.findMany({
                where: { isActive: true },
                select: { rupeesInCash: true },
            }),
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

        const safe = (v) => {
            if (v === null || v === undefined) return 0;
            const n = parseFloat(v.toString());
            return isNaN(n) ? 0 : n;
        };

        const scAmount = (r) =>
            r.totalAmount != null
                ? parseFloat((r.totalAmount * 100000).toFixed(2))
                : 0;

        const hasTreasuryChallanNo = (r) =>
            r.treasuryChallanNo !== null &&
            r.treasuryChallanNo !== undefined &&
            r.treasuryChallanNo !== "" &&
            r.treasuryChallanNo !== "0" &&
            r.treasuryChallanNo !== 0;

        // ─────────────────────────────
        // RECEIPT SIDE VALUES
        // ─────────────────────────────

        const openingBalance = openingRows.reduce(
            (sum, r) => sum + safe(r.amount), 0
        );

        const treasuryPla = treasuryPlaRows.reduce(
            (sum, r) => sum + safe(r.amount), 0
        );

        const totalOpeningPlusPla = openingBalance + treasuryPla;

        const challanCouncil = challanRows
            .filter((c) => c.departmentId >= 8001 && c.departmentId <= 8016)
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const cfbCouncil = challanFromBillRows
            .filter((r) => RECEIPT_CFB_TYPES.includes(r.amountType))
            .reduce((sum, r) => sum + safe(r.amount), 0);

        logger.info(`challanCouncil: ${challanCouncil} | cfbCouncil: ${cfbCouncil}`);

        const stateChallanRevenue = stateChallanRows.reduce(
            (sum, r) => sum + scAmount(r), 0
        );

        const receiptRevenueCouncil =
            challanCouncil + cfbCouncil + stateChallanRevenue;

        const receiptGrantsGovt = challanTwoRows.reduce(
            (sum, r) => sum + safe(r.grantsInAid), 0
        );

        const miscChallans = challanRows
            .filter((c) => !(c.departmentId >= 8001 && c.departmentId <= 8017))
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const receiptMisc = miscChallans;

        const receiptCash = cashReceiptRows.reduce(
            (sum, r) => sum + safe(r.rupeesInCash), 0
        );

        const loansGovt = challanTwoRows.reduce(
            (sum, r) => sum + safe(r.loansReceivedGovt), 0
        );

        const loansOther = challanTwoRows.reduce(
            (sum, r) => sum + safe(r.loansReceivedOther), 0
        );

        const recoverLoans = expenditureRows.reduce(
            (sum, r) => sum + safe(r.carLoanRecovery) + safe(r.houseLoanRecovery), 0
        );

        const otherCategories = expenditureRows.reduce(
            (sum, r) =>
                sum +
                safe(r.advanceRecovery) +
                safe(r.otherDeductions) +
                safe(r.houseRent),
            0
        );

        const receiptCpf = expenditureRows.reduce(
            (sum, r) =>
                sum +
                safe(r.cpfCouncil) +
                safe(r.cpfContribution) +
                safe(r.cpfRecovery),
            0
        );

        const receiptSecDep = expenditureRows.reduce(
            (sum, r) => sum + safe(r.securityDepositsDeduction), 0
        );

        const receiptEarnestDep = expenditureRows.reduce(
            (sum, r) => sum + safe(r.earnestMoneyDeduction), 0
        );

        const transferDeposits = challanRows
            .filter((c) => c.challanType === "Transfer" || c.challanType === "STATE")
            .reduce((sum, c) => sum + safe(c.amount), 0);

        // ✅ dcCheques — unchanged, all expenditures (receipt side r20)
        const dcCheques = expenditureRows.reduce(
            (sum, r) => sum + safe(r.grossAmount), 0
        );

        const plaChallan = challanRows
            .filter((c) => hasTreasuryChallanNo(c))
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const plaChallanTwo = challanTwoRows
            .filter((r) => hasTreasuryChallanNo(r))
            .reduce((sum, r) => sum + safe(r.amount), 0);

        const plaCfb = challanFromBillRows
            .filter((r) =>
                ALLOWED_AMOUNT_TYPES.includes(r.amountType) &&
                hasTreasuryChallanNo(r)
            )
            .reduce((sum, r) => sum + safe(r.amount), 0);

        logger.info(`plaChallan: ${plaChallan} | plaChallanTwo: ${plaChallanTwo} | plaCfb: ${plaCfb}`);

        const plaStateChallan = stateChallanRows
            .filter((r) => hasTreasuryChallanNo(r))
            .reduce((sum, r) => sum + scAmount(r), 0);

        const receiptRemitPla =
            plaChallan + plaChallanTwo + plaCfb + plaStateChallan;

        logger.info(`receiptRemitPla: ${receiptRemitPla} (plaStateChallan: ${plaStateChallan})`);

        const receiptGrandTotal =
            totalOpeningPlusPla +
            receiptRevenueCouncil +
            receiptGrantsGovt +
            receiptMisc +
            receiptCash +
            loansGovt +
            loansOther +
            recoverLoans +
            otherCategories +
            receiptCpf +
            receiptSecDep +
            receiptEarnestDep +
            transferDeposits +
            dcCheques +
            receiptRemitPla;

        // ─────────────────────────────
        // DISBURSEMENT SIDE VALUES
        // ─────────────────────────────

        // ✅ disbPartI — only REVENUE or CAPITAL expenditures
        const disbPartI = expenditureRows
            .filter((r) =>
                r.expenditureType === "REVENUE" ||
                r.expenditureType === "CAPITAL"
            )
            .reduce((sum, r) => sum + safe(r.grossAmount), 0);

        const disbLoanRepayGovt = expenditureRows.reduce(
            (sum, r) => sum + safe(r.loanRepayGovt), 0
        );

        const disbLoansAdvances = expenditureRows.reduce(
            (sum, r) => sum + safe(r.loansAdvances), 0
        );

        const disbLoanRepayOther = expenditureRows.reduce(
            (sum, r) => sum + safe(r.loanRepayOther), 0
        );

        const disbPayCpf = 0;
        const disbRemitCpf = receiptCpf;

        const disbSecDep = expenditureRows.reduce(
            (sum, r) => sum + safe(r.securityDeposit), 0
        );

        const disbEarnest = expenditureRows.reduce(
            (sum, r) => sum + safe(r.earnestMoney), 0
        );

        const disbTransferExp = expenditureRows.reduce(
            (sum, r) => sum + safe(r.transferPayment), 0
        );

        const disbRemitPla = receiptRemitPla;
        const disbDcCheques = dcCheques;

        const totalDisbursement =
            disbPartI +
            disbLoanRepayGovt +
            disbLoansAdvances +
            disbLoanRepayOther +
            disbPayCpf +
            disbRemitCpf +
            disbSecDep +
            disbEarnest +
            disbTransferExp +
            disbRemitPla +
            disbDcCheques;

        const challanWithCounterfoil = challanRows
            .filter((c) => c.counterfoilNo && c.counterfoilNo !== "0")
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const totalCashReceipts = receiptCash;
        const closingCash =
            totalCashReceipts - challanWithCounterfoil + openingBalance;

        const closingTreasuryPla =
            receiptGrandTotal - totalDisbursement - closingCash;

        const totalClosing = closingCash + closingTreasuryPla;

        const disbGrandTotal =
            totalDisbursement + closingCash + closingTreasuryPla;

        // ─────────────────────────────
        // MAP TO STRUCTURE
        // ─────────────────────────────
        const money = {
            // RECEIPTS
            r1: { re_amount: openingBalance },
            r2: { re_amount: treasuryPla },
            r3: { re_amount: totalOpeningPlusPla },
            r5: { re_amount: receiptRevenueCouncil },
            r6: { re_amount: receiptGrantsGovt },
            r7: { re_amount: receiptMisc },
            r8: { re_amount: receiptCash },
            r10: { re_amount: loansGovt },
            r11: { re_amount: loansOther },
            r12: { re_amount: recoverLoans },
            r13: { re_amount: otherCategories },
            r15: { re_amount: receiptCpf },
            r16: { re_amount: receiptSecDep },
            r17: { re_amount: receiptEarnestDep },
            r18: { re_amount: transferDeposits },
            r20: { re_amount: dcCheques },
            r21: { re_amount: receiptRemitPla },
            r22: { re_amount: receiptGrandTotal },

            // DISBURSEMENTS
            r1_di: { di_amount: 0 },
            r4_di: { di_amount: disbPartI },      // ✅ REVENUE + CAPITAL only
            r5_di: { di_amount: disbLoanRepayGovt },
            r6_di: { di_amount: disbLoansAdvances },
            r7_di: { di_amount: disbLoanRepayOther },
            r10_di: { di_amount: disbPayCpf },
            r11_di: { di_amount: disbRemitCpf },
            r12_di: { di_amount: disbSecDep },
            r13_di: { di_amount: disbEarnest },
            r15_di: { di_amount: disbTransferExp },
            r19_di: { di_amount: disbRemitPla },
            r20_di: { di_amount: disbDcCheques },
            r21_di: { di_amount: totalDisbursement },

            // Closing
            cashRs: { di_amount: closingCash },
            treasuryPla: { di_amount: closingTreasuryPla },
            totalClosing: { di_amount: totalClosing },
            grandTotalD: { di_amount: disbGrandTotal },
        };

        return { money };
    } catch (err) {
        logger.error(`Form12 service error: ${err.message}`);
        throw err;
    }
};
