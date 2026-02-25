import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

const RECEIPT_CFB_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "MC Forest Royalty",
    "Monopoly",
];

export const getForm12Data = async (sector) => {
    try {
        logger.info(`Fetching Form 12 data for sector: ${sector ?? "ALL"}`);

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};
        const challanSectorFilter =
            sector && sector !== "CONSOLIDATED" ? { challanType: sector } : {};

        const [
            openingRows,
            treasuryPlaRows,
            challanRows,
            challanFromBillRows,
            challanTwoRows,
            expenditureRows,
            cashReceiptRows,
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
        ]);

        const safe = (v) => {
            if (v === null || v === undefined) return 0;
            const n = parseFloat(v.toString());
            return isNaN(n) ? 0 : n;
        };

        // ─────────────────────────────
        // RECEIPT SIDE VALUES
        // ─────────────────────────────

        // 1. Opening Balance – OpeningBalance.amount
        const openingBalance = openingRows.reduce(
            (sum, r) => sum + safe(r.amount),
            0
        );

        // 2. Treasury PLA – TreasuryPla.amount
        const treasuryPla = treasuryPlaRows.reduce(
            (sum, r) => sum + safe(r.amount),
            0
        );

        // 3. Total = 1 + 2
        const totalOpeningPlusPla = openingBalance + treasuryPla;

        // 4. Revenue receipts of Council
        // challan deptId 8001–8016 + challanFromBill specific types
        const challanCouncil = challanRows
            .filter((c) => c.departmentId >= 8001 && c.departmentId <= 8016)
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const cfbCouncil = challanFromBillRows
            .filter((r) => RECEIPT_CFB_TYPES.includes(r.expenditureType))
            .reduce((sum, r) => sum + safe(r.amount), 0);

        const receiptRevenueCouncil = challanCouncil + cfbCouncil;

        // 5. Grants-in-aid from Govt – ChallanTwo.grantsInAid
        const receiptGrantsGovt = challanTwoRows.reduce(
            (sum, r) => sum + safe(r.grantsInAid),
            0
        );

        // 6. Other Misc Receipts – challan not 8001–8017
        const miscChallans = challanRows
            .filter(
                (c) =>
                    !(
                        c.departmentId >= 8001 &&
                        c.departmentId <= 8017
                    )
            )
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const receiptMisc = miscChallans;

        // 7. Cash Receipts – CashReceipt.rupeesInCash
        const receiptCash = cashReceiptRows.reduce(
            (sum, r) => sum + safe(r.rupeesInCash),
            0
        );

        // 8. Loans received from Govt – challanTwo.loansReceivedGovt
        const loansGovt = challanTwoRows.reduce(
            (sum, r) => sum + safe(r.loansReceivedGovt),
            0
        );

        // 9. Loans received from other sources – challanTwo.loansReceivedOther
        const loansOther = challanTwoRows.reduce(
            (sum, r) => sum + safe(r.loansReceivedOther),
            0
        );

        // 10. Recoveries of loans/advances – carLoanRecovery + houseLoanRecovery
        const recoverLoans = expenditureRows.reduce(
            (sum, r) =>
                sum + safe(r.carLoanRecovery) + safe(r.houseLoanRecovery),
            0
        );

        // 11. Other categories of receipts
        const otherCategories = expenditureRows.reduce(
            (sum, r) =>
                sum +
                safe(r.advanceRecovery) +
                safe(r.otherDeductions) +
                safe(r.houseRent),
            0
        );

        // 12. Recoveries of CPF
        const receiptCpf = expenditureRows.reduce(
            (sum, r) =>
                sum +
                safe(r.cpfCouncil) +
                safe(r.cpfContribution) +
                safe(r.cpfRecovery),
            0
        );

        // 13. Security Deposits
        const receiptSecDep = expenditureRows.reduce(
            (sum, r) => sum + safe(r.securityDepositsDeduction),
            0
        );

        // 14. Earnest Money Deposits
        const receiptEarnestDep = expenditureRows.reduce(
            (sum, r) => sum + safe(r.earnestMoneyDeduction),
            0
        );

        // 16. Deposits from Govt for transferred functions – challanType Transfer/STATE
        const transferDeposits = challanRows
            .filter(
                (c) =>
                    c.challanType === "Transfer" ||
                    c.challanType === "STATE"
            )
            .reduce((sum, c) => sum + safe(c.amount), 0);

        // 18. District Council Cheques (PLA) – Expenditure.grossAmount
        const dcCheques = expenditureRows.reduce(
            (sum, r) => sum + safe(r.grossAmount),
            0
        );

        // 19. Remittance into the Treasury (PLA) – challan/CT/CFB where treasuryChallanNo present
        const plaChallan = challanRows
            .filter((c) => c.treasuryChallanNo)
            .reduce((sum, c) => sum + safe(c.amount), 0);
        const plaChallanTwo = challanTwoRows
            .filter((r) => r.treasuryChallanNo)
            .reduce((sum, r) => sum + safe(r.amount), 0);
        const plaCfb = challanFromBillRows
            .filter((r) => r.treasuryChallanNo)
            .reduce((sum, r) => sum + safe(r.amount), 0);

        const receiptRemitPla = plaChallan + plaChallanTwo + plaCfb;

        // 20. Grand total (receipts) = 3 + 4 + 5 + 6 + ... + 19
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

        // 1. Part I – By expenditure under all Major Heads – grossAmount
        const disbPartI = dcCheques; // same as above

        // 2. Repayment of loan from Govt – loanRepayGovt
        const disbLoanRepayGovt = expenditureRows.reduce(
            (sum, r) => sum + safe(r.loanRepayGovt),
            0
        );

        // 3. Payment of loans and advances made by Council – loansAdvances
        const disbLoansAdvances = expenditureRows.reduce(
            (sum, r) => sum + safe(r.loansAdvances),
            0
        );

        // 4. Repayment of loans from other sources – loanRepayOther
        const disbLoanRepayOther = expenditureRows.reduce(
            (sum, r) => sum + safe(r.loanRepayOther),
            0
        );

        // 6. Payment of CPF – empty → 0
        const disbPayCpf = 0;

        // 7. Remittance of contribution into Post Office – same CPF recoveries
        const disbRemitCpf = receiptCpf;

        // 8. Repayment of Security Deposits – securityDeposit
        const disbSecDep = expenditureRows.reduce(
            (sum, r) => sum + safe(r.securityDeposit),
            0
        );

        // 9. Repayment of Earnest Money Deposits – earnestMoney
        const disbEarnest = expenditureRows.reduce(
            (sum, r) => sum + safe(r.earnestMoney),
            0
        );

        // 10. Expenditure for transferred functions – transferPayment
        const disbTransferExp = expenditureRows.reduce(
            (sum, r) => sum + safe(r.transferPayment),
            0
        );

        // 11. Remittance into Treasury (PLA) – same as receiptRemitPla
        const disbRemitPla = receiptRemitPla;

        // 12. District Council Cheques (PLA) – same as dcCheques
        const disbDcCheques = dcCheques;

        // 13. Total Disbursement (1–12, excluding 6 which is 0)
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

        // 14. Cash Rs. = CashReceipt.rupeesInCash - challan with counterfoil + OpeningBalance
        const challanWithCounterfoil = challanRows
            .filter((c) => c.counterfoilNo && c.counterfoilNo !== "0")
            .reduce((sum, c) => sum + safe(c.amount), 0);

        const totalCashReceipts = receiptCash;
        const closingCash =
            totalCashReceipts - challanWithCounterfoil + openingBalance;

        // 15. Treasury (PLA) = total receipt - total disbursement - closing cash
        const closingTreasuryPla =
            receiptGrandTotal - totalDisbursement - closingCash;

        // 17. Total = closing cash + treasury PLA
        const totalClosing = closingCash + closingTreasuryPla;

        // 18. Grand Total (disbursements) = Total Disbursement + Cash Rs. + Treasury
        const disbGrandTotal =
            totalDisbursement + closingCash + closingTreasuryPla;

        // ─────────────────────────────
        // MAP TO STRUCTURE (by id)
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
            r1_di: { di_amount: 0 },               // opening not used on disb side
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

            // Closing section
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
