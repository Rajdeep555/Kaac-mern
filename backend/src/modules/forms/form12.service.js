import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";
import { getForm5EData } from "./forms.service.js";

// ─────────────────────────────────────────────────────────────
// FORM 12 - REBUILT per new spec.
//
// Sector scoping: CONSOLIDATED = COUNCIL + STATE combined in a
// single query set (never two separate calls merged). COUNCIL/STATE
// alone = that one sector only. Every rule below that says "sector =
// COUNCIL,STATE" naturally narrows to whichever sector(s) are in
// scope for this call — a COUNCIL-only call never sees STATE rows to
// begin with, so no separate branching logic is needed per sector.
//
// 🔸 Opening Balance is now a FIXED constant, not sourced from the
// OpeningBalance/TreasuryPla tables — same convention as Statement 3
// / Form 11's hardcoded opening balances. Same single figure for
// COUNCIL, STATE, and CONSOLIDATED (not doubled for CONSOLIDATED).
// ─────────────────────────────────────────────────────────────

const FORM12_OPENING_CASH = 20596820;
const FORM12_OPENING_PLA = 3066481548;

const buildDateFilter = (dateField, from, to) => {
    if (!from || !to) return {};
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { [dateField]: { gte: start, lte: end } };
};

const safe = (v) => {
    if (v === null || v === undefined) return 0;
    const n = parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
};

const scAmount = (r) => (r.totalAmount != null ? parseFloat(r.totalAmount.toFixed(2)) : 0);

const isMajorHeadInRange12 = (majorHead, min, max) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num >= min && num <= max;
};

const isMajorHeadEqual12 = (majorHead, target) => {
    if (!majorHead) return false;
    const num = parseInt(majorHead, 10);
    return !Number.isNaN(num) && num === parseInt(target, 10);
};

// Revenue receipt / Form 4 majorHead sets — same convention as
// FORM7B_AMOUNT_REMITTED_MAJOR_HEADS (001-016, 661, 664).
const isForm4MajorHead = (majorHead) =>
    isMajorHeadInRange12(majorHead, 1, 16) ||
    isMajorHeadEqual12(majorHead, 661) ||
    isMajorHeadEqual12(majorHead, 664);

const sectorsForForm12 = (sector) =>
    !sector || sector === "CONSOLIDATED" ? ["COUNCIL", "STATE"] : [sector];

export const getForm12Data = async (sector, dateRange = {}) => {
    try {
        const { from, to } = dateRange;
        const sectors = sectorsForForm12(sector);
        const includeCouncil = sectors.includes("COUNCIL");
        const includeState = sectors.includes("STATE");

        logger.info(
            `Fetching Form 12 data for sector: ${sector ?? "ALL"}, sectors in scope: [${sectors.join(",")}], ` +
            `range: ${from ?? "-"} to ${to ?? "-"}`
        );

        const challanDateFilter = buildDateFilter("challanDate", from, to);
        const cfbDateFilter = buildDateFilter("voucharDate", from, to);
        const expenditureDateFilter = buildDateFilter("voucherDate", from, to);
        const cashReceiptDateFilter = buildDateFilter("date", from, to);
        const stateChallanDateFilter = buildDateFilter("challanDate", from, to);

        const [
            challanRows,
            cfbRows,
            stateChallanRows,
            expenditureRows,
            cashReceiptRows,
            form5EStateData,
        ] = await Promise.all([
            prisma.challan.findMany({
                where: {
                    isActive: true,
                    challanType: { in: sectors },
                    ...challanDateFilter,
                },
                select: {
                    id: true,
                    amount: true,
                    challanType: true,
                    majorHead: true,
                    subMajorHead: true,
                    minorHead: true,
                    counterfoilNo: true,
                    treasuryChallanNo: true,
                },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    sector: { in: sectors },
                    ...cfbDateFilter,
                },
                select: {
                    id: true,
                    amount: true,
                    amountType: true,
                    sector: true,
                    majorHead: true,
                    subMajor: true,
                    minorHead: true,
                },
            }),
            includeState
                ? prisma.stateChallan.findMany({
                    where: { sector: "STATE", isActive: true, ...stateChallanDateFilter },
                    select: { id: true, totalAmount: true, majorHead: true, detailHead: true },
                })
                : Promise.resolve([]),
            prisma.expenditure.findMany({
                where: {
                    isActive: true,
                    sector: { in: sectors },
                    ...expenditureDateFilter,
                },
                select: {
                    id: true,
                    sector: true,
                    majorHead: true,
                    detailHead: true,
                    grossAmount: true,
                    loanRepayGovt: true,
                    loanRepayOther: true,
                    loansAdvances: true,
                    securityDeposit: true,
                    earnestMoney: true,
                },
            }),
            includeCouncil
                ? prisma.cashReceipt.findMany({
                    where: { isActive: true, sector: "COUNCIL", ...cashReceiptDateFilter },
                    select: { rupeesInCash: true },
                })
                : Promise.resolve([]),
            getForm5EData("STATE", { from, to }),
        ]);

        const isDetailHead3132 = (r) => r.detailHead === "31" || r.detailHead === "32";

        // ═══════════════════════════════════════════════════════
        // RECEIPT — PART 1
        // ═══════════════════════════════════════════════════════

        // 1.a — Revenue receipt of the council: Challan + challanFromBill,
        // majorHead 001-016, sector/challanType IN scope.
        const revenueChallan = challanRows
            .filter((c) => isMajorHeadInRange12(c.majorHead, 1, 16))
            .reduce((s, c) => s + safe(c.amount), 0);
        const revenueCfb = cfbRows
            .filter((r) => isMajorHeadInRange12(r.majorHead, 1, 16))
            .reduce((s, r) => s + safe(r.amount), 0);
        const receiptRevenue = revenueChallan + revenueCfb;

        // 1.b — Grants in aid: StateChallan detailHead 31/32 (naturally
        // 0 when STATE not in scope, since stateChallanRows is []).
        const receiptGrantsGovt = stateChallanRows
            .filter(isDetailHead3132)
            .reduce((s, r) => s + scAmount(r), 0);

        // 1.c — Other misc receipt: nil, always.
        const receiptMiscPart1 = 0;

        // ═══════════════════════════════════════════════════════
        // RECEIPT — PART 2
        // ═══════════════════════════════════════════════════════

        // 2.a — Loan received from govt: Challan subMajorHead=66001 +
        // StateChallan majorHead=7610.
        const loansGovtChallan = challanRows
            .filter((c) => (c.subMajorHead ?? "").trim() === "66001")
            .reduce((s, c) => s + safe(c.amount), 0);
        const loansGovtStateChallan = stateChallanRows
            .filter((r) => isMajorHeadEqual12(r.majorHead, 7610))
            .reduce((s, r) => s + scAmount(r), 0);
        const loansGovt = loansGovtChallan + loansGovtStateChallan;

        // 2.b — Loans received from other sources: Challan subMajorHead=66002.
        const loansOther = challanRows
            .filter((c) => (c.subMajorHead ?? "").trim() === "66002")
            .reduce((s, c) => s + safe(c.amount), 0);

        // 2.c — challanFromBill, amountType IN (Car Loan, Building Loan), scope-wide.
        const recoverLoans = cfbRows
            .filter((r) => ["Car Loan", "Building Loan"].includes(r.amountType))
            .reduce((s, r) => s + safe(r.amount), 0);

        // 2.d — Other categories receipt: nil.
        const otherCategoriesReceipt = 0;

        // ═══════════════════════════════════════════════════════
        // RECEIPT — PART 3
        // ═══════════════════════════════════════════════════════

        // 3.a — Recoveries of CPF: challanFromBill amountType IN the 3 CPF types.
        const receiptCpf = cfbRows
            .filter((r) =>
                ["CPF Council Share", "CPF Contribution", "CPF Advance"].includes(r.amountType)
            )
            .reduce((s, r) => s + safe(r.amount), 0);

        // 3.b — Security Deposit: cfb majorHead=664, amountType='Security
        // Deposits', sector=COUNCIL + cfb majorHead=8443, amountType=
        // 'Security Deposits', sector=STATE.
        const receiptSecDep =
            cfbRows
                .filter((r) => r.sector === "COUNCIL" && isMajorHeadEqual12(r.majorHead, 664) && r.amountType === "Security Deposits")
                .reduce((s, r) => s + safe(r.amount), 0) +
            cfbRows
                .filter((r) => r.sector === "STATE" && isMajorHeadEqual12(r.majorHead, 8443) && r.amountType === "Security Deposits")
                .reduce((s, r) => s + safe(r.amount), 0);

        // 3.c — Earnest Money: same pattern with amountType='Earnest Money'.
        const receiptEarnestDep =
            cfbRows
                .filter((r) => r.sector === "COUNCIL" && isMajorHeadEqual12(r.majorHead, 664) && r.amountType === "Earnest Money")
                .reduce((s, r) => s + safe(r.amount), 0) +
            cfbRows
                .filter((r) => r.sector === "STATE" && isMajorHeadEqual12(r.majorHead, 8443) && r.amountType === "Earnest Money")
                .reduce((s, r) => s + safe(r.amount), 0);

        // ═══════════════════════════════════════════════════════
        // RECEIPT — PART 4 — all StateChallan excluding detailHead 31/32
        // ═══════════════════════════════════════════════════════
        const receiptPart4 = stateChallanRows
            .filter((r) => !isDetailHead3132(r))
            .reduce((s, r) => s + scAmount(r), 0);

        // ═══════════════════════════════════════════════════════
        // RECEIPT — PART 5
        // ═══════════════════════════════════════════════════════

        // 5.a — Form 3 total: all Expenditure grossAmount, scope-wide.
        const form3Total = expenditureRows.reduce((s, r) => s + safe(r.grossAmount), 0);

        // 5.b — Form 4 total: (Challan + cfb, majorHead IN 001-016/661/664,
        // scope-wide) + all StateChallan.
        const form4ChallanTotal = challanRows
            .filter((c) => isForm4MajorHead(c.majorHead))
            .reduce((s, c) => s + safe(c.amount), 0);
        const form4CfbTotal = cfbRows
            .filter((r) => isForm4MajorHead(r.majorHead))
            .reduce((s, r) => s + safe(r.amount), 0);
        const form4StateChallanTotal = stateChallanRows.reduce((s, r) => s + scAmount(r), 0);
        const form4Total = form4ChallanTotal + form4CfbTotal + form4StateChallanTotal;

        // ═══════════════════════════════════════════════════════
        // RECEIPT GRAND TOTAL
        // ═══════════════════════════════════════════════════════
        const receiptGrandTotal =
            FORM12_OPENING_CASH +
            FORM12_OPENING_PLA +
            receiptRevenue +
            receiptGrantsGovt +
            receiptMiscPart1 +
            loansGovt +
            loansOther +
            recoverLoans +
            otherCategoriesReceipt +
            receiptCpf +
            receiptSecDep +
            receiptEarnestDep +
            receiptPart4 +
            form3Total +
            form4Total;

        // ═══════════════════════════════════════════════════════
        // DISBURSEMENT — PART 1
        // Expenditure sector=COUNCIL excluding majorHead IN (661,664,662)
        // + Expenditure sector=STATE where detailHead IN (31,32)
        // ═══════════════════════════════════════════════════════
        const disbPart1Council = expenditureRows
            .filter(
                (e) =>
                    e.sector === "COUNCIL" &&
                    !["661", "664", "662"].some((mh) => isMajorHeadEqual12(e.majorHead, mh))
            )
            .reduce((s, e) => s + safe(e.grossAmount), 0);
        const disbPart1State = expenditureRows
            .filter((e) => e.sector === "STATE" && isDetailHead3132(e))
            .reduce((s, e) => s + safe(e.grossAmount), 0);
        const disbPart1 = disbPart1Council + disbPart1State;

        // ═══════════════════════════════════════════════════════
        // DISBURSEMENT — PART 2
        // ═══════════════════════════════════════════════════════

        // 2.a — By repayment of loans received from govt: Expenditure.loanRepayGovt, scope-wide.
        const disbLoanRepayGovt = expenditureRows.reduce((s, e) => s + safe(e.loanRepayGovt), 0);

        // 2.b — Payment of loans/advances made by Council: Expenditure.loansAdvances,
        // majorHead=661, sector=COUNCIL only.
        const disbLoansAdvances = expenditureRows
            .filter((e) => e.sector === "COUNCIL" && isMajorHeadEqual12(e.majorHead, 661))
            .reduce((s, e) => s + safe(e.loansAdvances), 0);

        // 2.c — Repayment of loans from other sources: Expenditure.loanRepayOther, scope-wide.
        const disbLoanRepayOther = expenditureRows.reduce((s, e) => s + safe(e.loanRepayOther), 0);

        // ═══════════════════════════════════════════════════════
        // DISBURSEMENT — PART 3
        // ═══════════════════════════════════════════════════════

        // 3.a — By payment of CPF: cfb majorHead=662 sector=COUNCIL +
        // Expenditure majorHead=662 sector=COUNCIL (grossAmount).
        const disbCpfCfb = cfbRows
            .filter((r) => r.sector === "COUNCIL" && isMajorHeadEqual12(r.majorHead, 662))
            .reduce((s, r) => s + safe(r.amount), 0);
        const disbCpfExpenditure = expenditureRows
            .filter((e) => e.sector === "COUNCIL" && isMajorHeadEqual12(e.majorHead, 662))
            .reduce((s, e) => s + safe(e.grossAmount), 0);
        const disbPayCpf = disbCpfCfb + disbCpfExpenditure;

        // 3.b — Remittance of contribution into Post Office: nil.
        const disbRemitPostOffice = 0;

        // 3.c — Repayment of Security Deposits: Expenditure.securityDeposit
        // majorHead=664 sector=COUNCIL + cfb majorHead=8443
        // amountType='Security Deposits' sector=STATE.
        const disbSecDep =
            expenditureRows
                .filter((e) => e.sector === "COUNCIL" && isMajorHeadEqual12(e.majorHead, 664))
                .reduce((s, e) => s + safe(e.securityDeposit), 0) +
            cfbRows
                .filter((r) => r.sector === "STATE" && isMajorHeadEqual12(r.majorHead, 8443) && r.amountType === "Security Deposits")
                .reduce((s, r) => s + safe(r.amount), 0);

        // 3.d — Repayment of Earnest Money: same pattern, Expenditure.earnestMoney.
        const disbEarnest =
            expenditureRows
                .filter((e) => e.sector === "COUNCIL" && isMajorHeadEqual12(e.majorHead, 664))
                .reduce((s, e) => s + safe(e.earnestMoney), 0) +
            cfbRows
                .filter((r) => r.sector === "STATE" && isMajorHeadEqual12(r.majorHead, 8443) && r.amountType === "Earnest Money")
                .reduce((s, r) => s + safe(r.amount), 0);

        // ═══════════════════════════════════════════════════════
        // DISBURSEMENT — PART 4 — Expenditure sector=STATE excluding
        // detailHead 31/32 (transferred functions)
        // ═══════════════════════════════════════════════════════
        const disbTransferExp = expenditureRows
            .filter((e) => e.sector === "STATE" && !isDetailHead3132(e))
            .reduce((s, e) => s + safe(e.grossAmount), 0);

        // ═══════════════════════════════════════════════════════
        // DISBURSEMENT — PART 5 (mirrors receipt Part 5, swapped order)
        // ═══════════════════════════════════════════════════════
        const disbForm4Total = form4Total;
        const disbForm3Total = form3Total;

        // ═══════════════════════════════════════════════════════
        // CASH COLUMN — receipt/disbursement cash sub-totals used for
        // the closing balance below. Same convention as the earlier
        // Cash/PLA split work: cash column = CashReceipt (receipt
        // side) + Challan-with-counterfoilNo (disbursement side).
        // ═══════════════════════════════════════════════════════
        const cashReceiptsSum = cashReceiptRows.reduce((s, r) => s + safe(r.rupeesInCash), 0);
        const challanWithCounterfoilSum = challanRows
            .filter((c) => c.counterfoilNo && c.counterfoilNo !== "0")
            .reduce((s, c) => s + safe(c.amount), 0);

        const closingCash = FORM12_OPENING_CASH + cashReceiptsSum - challanWithCounterfoilSum;

        // ═══════════════════════════════════════════════════════
        // DISBURSEMENT — PART 3 (e) — Other categories of deposits
        // = opening balance of cash - closing balance (current year, cash)
        // 🔸 Rendered on the frontend as row id "r13e" (di side only,
        // no receipt-side counterpart) — key below MUST stay "r13e_di"
        // so Form12.jsx's generic `row.id + "_di"` lookup finds it.
        // ═══════════════════════════════════════════════════════
        const disbOtherDeposits = FORM12_OPENING_CASH - closingCash;

        // ═══════════════════════════════════════════════════════
        // TOTAL DISBURSEMENT
        // ═══════════════════════════════════════════════════════
        const totalDisbursement =
            disbPart1 +
            disbLoanRepayGovt +
            disbLoansAdvances +
            disbLoanRepayOther +
            disbPayCpf +
            disbRemitPostOffice +
            disbSecDep +
            disbEarnest +
            disbOtherDeposits +
            disbTransferExp +
            disbForm4Total +
            disbForm3Total;

        // ═══════════════════════════════════════════════════════
        // CLOSING BALANCE
        // Cash = openingCash + cashReceipts - challanWithCounterfoil (above)
        // Treasury PLA = Form4 - Form3 + opening PLA
        // ═══════════════════════════════════════════════════════
        const closingTreasuryPla = form4Total - form3Total + FORM12_OPENING_PLA;
        const totalClosing = closingCash + closingTreasuryPla;
        const disbGrandTotal = totalDisbursement + closingCash + closingTreasuryPla;

        // ─────────────────────────────
        // MAP TO STRUCTURE
        // ─────────────────────────────
        const money = {
            // RECEIPTS
            r1: { re_amount: FORM12_OPENING_CASH },       // Opening Balance - Cash
            r2: { re_amount: FORM12_OPENING_PLA },        // Opening Balance - Treasury PLA
            r3: { re_amount: FORM12_OPENING_CASH + FORM12_OPENING_PLA },
            r5: { re_amount: receiptRevenue },            // Part1.a
            r6: { re_amount: receiptGrantsGovt },         // Part1.b
            r7: { re_amount: receiptMiscPart1 },          // Part1.c
            r10: { re_amount: loansGovt },                // Part2.a
            r11: { re_amount: loansOther },               // Part2.b
            r12: { re_amount: recoverLoans },             // Part2.c
            r13: { re_amount: otherCategoriesReceipt },   // Part2.d
            r15: { re_amount: receiptCpf },               // Part3.a
            r16: { re_amount: receiptSecDep },            // Part3.b
            r17: { re_amount: receiptEarnestDep },        // Part3.c
            r14_part4: { re_amount: receiptPart4 },       // Part4 (all state challan excl 31/32)
            r_form3: { re_amount: form3Total },           // Part5.a
            r_form4: { re_amount: form4Total },           // Part5.b
            r22: { re_amount: receiptGrandTotal },

            // DISBURSEMENTS
            r4_di: { di_amount: disbPart1 },              // Part1
            r5_di: { di_amount: disbLoanRepayGovt },      // Part2.a
            r6_di: { di_amount: disbLoansAdvances },      // Part2.b
            r7_di: { di_amount: disbLoanRepayOther },     // Part2.c
            r10_di: { di_amount: disbPayCpf },            // Part3.a
            r11_di: { di_amount: disbRemitPostOffice },   // Part3.b
            r12_di: { di_amount: disbSecDep },            // Part3.c
            r13_di: { di_amount: disbEarnest },           // Part3.d
            r13e_di: { di_amount: disbOtherDeposits },    // Part3.e — matches Form12.jsx row id "r13e"
            r15_di: { di_amount: disbTransferExp },       // Part4
            r_form4_di: { di_amount: disbForm4Total },    // Part5.a
            r_form3_di: { di_amount: disbForm3Total },    // Part5.b
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