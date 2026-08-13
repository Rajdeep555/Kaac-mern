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
    if (sector === "STATE") {
        return getForm12DataState();
    }

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
                ? parseFloat((r.totalAmount).toFixed(2))
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

        const receiptMisc = 0;

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

// ─────────────────────────────────────────────────────────────────
// STATE SECTOR — dedicated logic (per new spec)
// ─────────────────────────────────────────────────────────────────
const getForm12DataState = async () => {
    try {
        logger.info("Fetching Form 12 data for STATE sector (custom logic)");

        const [
            openingRows,
            treasuryPlaRows,
            stateChallanRows,
            challanFromBillRows,
            expenditureRows,
        ] = await Promise.all([
            prisma.openingBalance.findMany({
                where: { isActive: true, sector: "STATE" },
                select: { amount: true },
            }),
            prisma.treasuryPla.findMany({
                where: { isActive: true, sector: "STATE" },
                select: { amount: true },
            }),
            prisma.stateChallan.findMany({
                where: { isActive: true, sector: "STATE" },
                select: { totalAmount: true, detailHead: true },
            }),
            prisma.challanFromBill.findMany({
                where: { isActive: true, sector: "STATE" },
                select: { amount: true, amountType: true },
            }),
            prisma.expenditure.findMany({
                where: { isActive: true, sector: "STATE" },
                select: { majorHead: true, grossAmount: true },
            }),
        ]);

        const safe = (v) => {
            if (v === null || v === undefined) return 0;
            const n = parseFloat(v.toString());
            return isNaN(n) ? 0 : n;
        };

        const scAmount = (r) =>
            r.totalAmount != null ? parseFloat(r.totalAmount.toFixed(2)) : 0;

        // detailHead 31 or 32 (stored as string on the model)
        const isDetailHead3132 = (r) =>
            r.detailHead === "31" || r.detailHead === "32";

        // ─────────────────────────────
        // OPENING (unchanged, from openingBalance / treasuryPla tables)
        // ─────────────────────────────
        const openingBalance = openingRows.reduce(
            (sum, r) => sum + safe(r.amount), 0
        );
        const treasuryPla = treasuryPlaRows.reduce(
            (sum, r) => sum + safe(r.amount), 0
        );
        const totalOpeningPlusPla = openingBalance + treasuryPla;

        // ─────────────────────────────
        // RECEIPT — PART I  (r5 a, r6 b, r7 c, r8 d)
        // ─────────────────────────────
        const receiptRevenueCouncil = 0; // (a) NIL

        const receiptGrantsGovt = stateChallanRows // (b) stateChallan detailHead 31/32
            .filter(isDetailHead3132)
            .reduce((sum, r) => sum + scAmount(r), 0);

        const cfbAdvancePayment = challanFromBillRows
            .filter((r) => r.amountType === "Advance Payment")
            .reduce((sum, r) => sum + safe(r.amount), 0);

        const stateChallanExcl3132 = stateChallanRows
            .filter((r) => !isDetailHead3132(r))
            .reduce((sum, r) => sum + scAmount(r), 0);

        // (c) all stateChallan excluding detailHead 31/32 + challanFromBill "Advance Payment"
        const receiptMisc = stateChallanExcl3132 + cfbAdvancePayment;

        const receiptCash = 0; // (d) NIL

        // ─────────────────────────────
        // DISBURSEMENT — PART I  (r4_di gross expenditure)
        // ─────────────────────────────
        const disbPartI = expenditureRows // expenditure with majorHead in [2011, 5999]
            .filter((r) => {
                const mh = parseInt(r.majorHead, 10);
                return !isNaN(mh) && mh >= 2011 && mh <= 5999;
            })
            .reduce((sum, r) => sum + safe(r.grossAmount), 0);

        // DISBURSEMENT — continuation of Part I (r5_di a, r6_di b, r7_di c)
        const disbLoanRepayGovt = 0; // (a) NIL
        const disbLoansAdvances = 0; // (b) NIL
        const disbLoanRepayOther = 0; // (c) NIL

        // ─────────────────────────────
        // RECEIPT — PART II  (r10 a, r11 b, r12 c, r13 d)
        // ─────────────────────────────
        const loansGovt = 0; // (a) NIL
        const loansOther = 0; // (b) NIL
        const recoverLoans = 0; // (c) NIL

        // (d) all challanFromBill excluding amountType "Advance Payment"
        const otherCategories = challanFromBillRows
            .filter((r) => r.amountType !== "Advance Payment" &&
                r.amountType !== "Security Deposits")
            .reduce((sum, r) => sum + safe(r.amount), 0);

        // ─────────────────────────────
        // RECEIPT — PART III  (r15 a, r16 b, r17 c)
        // ─────────────────────────────
        const receiptCpf = 0; // (a) NIL

        const receiptSecDep = challanFromBillRows // (b) amountType = "Security Deposits"
            .filter((r) => r.amountType === "Security Deposits")
            .reduce((sum, r) => sum + safe(r.amount), 0);

        const receiptEarnestDep = challanFromBillRows // (c) amountType = "Earnest Money"
            .filter((r) => r.amountType === "Earnest Money")
            .reduce((sum, r) => sum + safe(r.amount), 0);

        // ─────────────────────────────
        // DISBURSEMENT — PART III  (r10_di a, r11_di b, r12_di c, r13_di d)
        // ─────────────────────────────
        const disbPayCpf = 0; // (a) NIL
        const disbRemitCpf = 0; // (b) NIL

        // (c) all challanFromBill excluding "Advance Payment" and "Earnest Money"
        const disbSecDep = challanFromBillRows
            .filter(
                (r) =>
                    r.amountType !== "Advance Payment" &&
                    r.amountType !== "Earnest Money"
            )
            .reduce((sum, r) => sum + safe(r.amount), 0);

        // (d) challanFromBill amountType = "Earnest Money"
        const disbEarnest = challanFromBillRows
            .filter((r) => r.amountType === "Earnest Money")
            .reduce((sum, r) => sum + safe(r.amount), 0);

        // ─────────────────────────────
        // SHARED UNFILTERED TOTALS
        // ─────────────────────────────
        const allStateChallanSum = stateChallanRows.reduce(
            (sum, r) => sum + scAmount(r), 0
        );
        const allExpenditureSum = expenditureRows.reduce(
            (sum, r) => sum + safe(r.grossAmount), 0
        );

        // RECEIPT — PART IV (r18): all stateChallan sum
        const transferDeposits = allStateChallanSum;

        // DISBURSEMENT — PART IV (r15_di): all expenditure grossAmount sum
        const disbTransferExp = allExpenditureSum;

        // RECEIPT — PART V (r20 a = DC Cheques, r21 b = Remit PLA)
        const dcCheques = allExpenditureSum; // (a) all expenditure sum
        const receiptRemitPla = allStateChallanSum; // (b) all stateChallan sum

        // DISBURSEMENT — PART V (r19_di a = Remit PLA, r20_di b = DC Cheques)
        const disbRemitPla = allStateChallanSum; // (a) all stateChallan sum
        const disbDcCheques = allExpenditureSum; // (b) all expenditure sum

        // ─────────────────────────────
        // GRAND TOTALS
        // ─────────────────────────────
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

        // ─────────────────────────────
        // CLOSING BALANCE = receipt total − disbursement total
        // cash column forced to NIL, everything sits in Treasury (PLA)
        // ─────────────────────────────
        const closingCash = 0;
        const closingTreasuryPla = receiptGrandTotal - totalDisbursement;
        const totalClosing = closingCash + closingTreasuryPla;
        const disbGrandTotal = totalDisbursement + closingCash + closingTreasuryPla;

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
            r4_di: { di_amount: disbPartI },
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
        logger.error(`Form12 STATE service error: ${err.message}`);
        throw err;
    }
};