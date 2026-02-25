import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────
// Amount types that go into Treasury PLA column (DR side)
// and Disbursement Cash column (CR side)
// ─────────────────────────────────────────────────────────────
const PLA_AMOUNT_TYPES = [
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

const CASH_AMOUNT_TYPES = [
    "CGST",
    "SGST",
    "IGST",
    "ITAX",
    "MDRRF",
    "DMFT",
    "Labour Cess",
    "IT Forest Royalty",
    "VAT",
    "CPF Council Share",
    "CPF Contribution",
    "CPF Advance",
];

function getFyRange(year) {
    const from = new Date(year, 3, 1);       // 1 April
    const to = new Date(year + 1, 2, 31);  // 31 March
    return { from, to };
}

// Build a fully empty row — all fields null
function createEmptyRow() {
    return {
        id: null,
        // DR side
        receiptDate: null,
        receiptItemNo: null,
        receiptCounterfoilNo: null,
        receiptParticulars: null,
        receiptCashAmount: null,
        receiptPlaColumn: null,
        receiptClassification: null,
        // CR side
        disbursementDate: null,
        voucherNo: null,
        disbursementCounterfoilNo: null,
        disbursementDetails: null,
        disbursementCashAmount: null,
        chequeNo: null,
        plaColumnPayment: null,
        treasuryClassification: null,
    };
}

// Build classification string from head codes
const buildClassification = (major, subMajor, minor) =>
    [major, subMajor, minor]
        .filter((p) => p && p.trim() !== "")
        .join("-");

export const getCashbookRowsByFy = async (year, sector) => {
    try {
        const { from, to } = getFyRange(year);

        logger.info(`Cashbook fetch started`, {
            year, sector,
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
        });

        // ── Sector filters ───────────────────────────────────────
        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};

        const challanSectorFilter =
            sector && sector !== "CONSOLIDATED" ? { challanType: sector } : {};

        // ── Fetch all tables in parallel ─────────────────────────
        const [
            cashReceipts,
            challans,
            challanFromBills,
            challanTwoRows,
            expenditures,
        ] = await Promise.all([
            // 1. CashReceipt
            prisma.cashReceipt.findMany({
                where: {
                    date: { gte: from, lte: to },
                    isActive: true,
                },
                orderBy: { date: "asc" },
            }),

            // 2. Challan (all active in FY)
            prisma.challan.findMany({
                where: {
                    challanDate: { gte: from, lte: to },
                    isActive: true,
                    ...challanSectorFilter,
                },
                orderBy: { challanDate: "asc" },
            }),

            // 3. ChallanFromBill — only PLA + Cash types
            prisma.challanFromBill.findMany({
                where: {
                    voucharDate: { gte: from, lte: to },
                    isActive: true,
                    amountType: { in: [...PLA_AMOUNT_TYPES, ...CASH_AMOUNT_TYPES] },
                    ...sectorFilter,
                },
                orderBy: { voucharDate: "asc" },
            }),

            // 4. ChallanTwo
            prisma.challanTwo.findMany({
                where: {
                    kaacChallanDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { kaacChallanDate: "asc" },
            }),

            // 5. Expenditure
            prisma.expenditure.findMany({
                where: {
                    voucherDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { voucherDate: "asc" },
            }),
        ]);

        logger.info(`Data fetched`, {
            cashReceipts: cashReceipts.length,
            challans: challans.length,
            challanFromBills: challanFromBills.length,
            challanTwoRows: challanTwoRows.length,
            expenditures: expenditures.length,
        });

        const rows = [];

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 1: CashReceipt
        // Date, counterfoilNo, receivedFrom+letterNo+letterDate,
        // rupeesInCash in Cash column, PLA=empty, Classification=empty
        // ════════════════════════════════════════════════════════
        cashReceipts.forEach((r) => {
            const row = createEmptyRow();

            row.id = `R-${r.id}`;

            row.receiptDate = r.date
                ? r.date.toISOString().slice(0, 10)
                : null;
            row.receiptItemNo = null; // empty per spec
            row.receiptCounterfoilNo = r.counterfoilNo ?? null;

            // Particulars = receivedFrom + letterNo + letterDate
            const parts = [
                r.receivedFrom,
                r.letterNo ? `Letter No: ${r.letterNo}` : null,
                r.letterDate ? `Letter Date: ${new Date(r.letterDate).toLocaleDateString()}` : null,
            ].filter(Boolean);
            row.receiptParticulars = parts.join(" | ") || null;

            row.receiptCashAmount = r.rupeesInCash
                ? parseFloat(r.rupeesInCash)
                : null;
            row.receiptPlaColumn = null; // empty
            row.receiptClassification = null; // empty

            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 2: Challan (WITHOUT counterfoilNo)
        // Date=challanDate, No.ofItem=challanNo, counterfoil=empty,
        // Particulars=remarks, Cash=empty, PLA=amount,
        // Classification=minorHead-detailHead
        // ════════════════════════════════════════════════════════
        challans
            .filter((c) => !c.counterfoilNo || c.counterfoilNo.trim() === "")
            .forEach((c) => {
                const row = createEmptyRow();

                row.id = `C-DR-${c.id}`;

                row.receiptDate = c.challanDate
                    ? c.challanDate.toISOString().slice(0, 10)
                    : null;
                row.receiptItemNo = c.challanNo ?? null;
                row.receiptCounterfoilNo = null; // empty — no counterfoil
                row.receiptParticulars = c.remarks ?? null;
                row.receiptCashAmount = null; // empty
                row.receiptPlaColumn = c.amount
                    ? parseFloat(c.amount.toString())
                    : null;
                row.receiptClassification = [c.minorHead, c.detailHead]
                    .filter(Boolean)
                    .join("-") || null;

                rows.push(row);
            });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3A: ChallanFromBill (PLA types)
        // One row per amountType entry
        // Date=voucharDate, No.ofItem=challanNo, counterfoil=empty,
        // Particulars=amountType, Cash=empty, PLA=amount,
        // Classification=majorHead-subMajor-minorHead
        // ════════════════════════════════════════════════════════
        challanFromBills
            .filter((cfb) => PLA_AMOUNT_TYPES.includes(cfb.amountType))
            .forEach((cfb) => {
                const row = createEmptyRow();

                row.id = `CFB-DR-PLA-${cfb.id}`;

                row.receiptDate = cfb.voucharDate
                    ? cfb.voucharDate.toISOString().slice(0, 10)
                    : null;
                row.receiptItemNo = cfb.challanNo ?? null;
                row.receiptCounterfoilNo = null;
                row.receiptParticulars = cfb.amountType ?? null;
                row.receiptCashAmount = null;
                row.receiptPlaColumn = cfb.amount
                    ? parseFloat(cfb.amount.toString())
                    : null;
                row.receiptClassification = buildClassification(
                    cfb.majorHead, cfb.subMajor, cfb.minorHead
                );

                rows.push(row);
            });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3B: ChallanFromBill (Cash types)
        // One row per amountType entry
        // Date=voucharDate, No.ofItem=challanNo, counterfoil=empty,
        // Particulars=amountType, Cash=amount, PLA=empty,
        // Classification=majorHead-subMajor-minorHead
        // ════════════════════════════════════════════════════════
        challanFromBills
            .filter((cfb) => CASH_AMOUNT_TYPES.includes(cfb.amountType))
            .forEach((cfb) => {
                const row = createEmptyRow();

                row.id = `CFB-DR-CASH-${cfb.id}`;

                row.receiptDate = cfb.voucharDate
                    ? cfb.voucharDate.toISOString().slice(0, 10)
                    : null;
                row.receiptItemNo = cfb.challanNo ?? null;
                row.receiptCounterfoilNo = null;
                row.receiptParticulars = cfb.amountType ?? null;
                row.receiptCashAmount = cfb.amount
                    ? parseFloat(cfb.amount.toString())
                    : null;
                row.receiptPlaColumn = null;
                row.receiptClassification = buildClassification(
                    cfb.majorHead, cfb.subMajor, cfb.minorHead
                );

                rows.push(row);
            });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 4: Challan WITH counterfoilNo
        // Appears on BOTH DR and CR sides as two separate rows
        // ════════════════════════════════════════════════════════
        challans
            .filter((c) => c.counterfoilNo && c.counterfoilNo.trim() !== "")
            .forEach((c) => {
                const challanDate = c.challanDate
                    ? c.challanDate.toISOString().slice(0, 10)
                    : null;

                // ── DR row ───────────────────────────────────────────
                const drRow = createEmptyRow();

                drRow.id = `C-DR-CF-${c.id}`;

                drRow.receiptDate = challanDate;
                drRow.receiptItemNo = c.challanNo ?? null;
                drRow.receiptCounterfoilNo = c.counterfoilNo ?? null;
                drRow.receiptParticulars = c.remarks ?? null;
                drRow.receiptCashAmount = null;
                drRow.receiptPlaColumn = c.amount
                    ? parseFloat(c.amount.toString())
                    : null;
                drRow.receiptClassification = [c.minorHead, c.detailHead]
                    .filter(Boolean)
                    .join("-") || null;

                rows.push(drRow);

                // ── CR row (same challan, counterfoil present) ───────
                const crRow = createEmptyRow();

                crRow.id = `C-CR-CF-${c.id}`;

                crRow.disbursementDate = challanDate;
                crRow.voucherNo = c.challanNo ?? null;
                crRow.disbursementCounterfoilNo = c.counterfoilNo ?? null;
                crRow.disbursementDetails = c.remarks ?? null;
                crRow.disbursementCashAmount = c.amount
                    ? parseFloat(c.amount.toString())
                    : null;
                crRow.chequeNo = null;  // empty
                crRow.plaColumnPayment = null;  // empty
                crRow.treasuryClassification = c.minorHead ?? null;

                rows.push(crRow);
            });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 5: ChallanTwo
        // Date=kaacChallanDate, No.ofItem=kaacChallanNo,
        // counterfoil=empty, Particulars=remarks,
        // Cash=empty, PLA=amount, Classification=minorHead
        // ════════════════════════════════════════════════════════
        challanTwoRows.forEach((ct) => {
            const row = createEmptyRow();

            row.id = `CT-DR-${ct.id}`;

            row.receiptDate = ct.kaacChallanDate
                ? ct.kaacChallanDate.toISOString().slice(0, 10)
                : null;
            row.receiptItemNo = ct.kaacChallanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = ct.remarks ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn = ct.amount
                ? parseFloat(ct.amount.toString())
                : null;
            row.receiptClassification = ct.minorHead ?? null;

            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 2: Expenditure
        // Date=voucherDate, VoucherNo=voucherNo, counterfoil=empty,
        // Classification=remarks, Disbursement Cash=empty,
        // ChequeNo=chequeNo, Treasury PLA=grossAmount,
        // Treasury Classification=minorHead
        // ════════════════════════════════════════════════════════
        expenditures.forEach((e) => {
            const row = createEmptyRow();

            row.id = `E-CR-${e.id}`;

            row.disbursementDate = e.voucherDate
                ? e.voucherDate.toISOString().slice(0, 10)
                : null;
            row.voucherNo = e.voucherNo ?? null;
            row.disbursementCounterfoilNo = null;         // empty
            row.disbursementDetails = e.remarks ?? null;
            row.disbursementCashAmount = null;          // empty
            row.chequeNo = e.chequeNo ?? e.chequeBookNo ?? null;
            row.plaColumnPayment = e.grossAmount
                ? parseFloat(e.grossAmount.toString())
                : null;
            row.treasuryClassification = e.minorHead ?? null;

            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 3: ChallanFromBill (Cash types)
        // One row per entry
        // Date=voucharDate, VoucherNo=challanNo (voucharDate field?),
        // counterfoil=empty, Classification=amountType,
        // Disbursement Cash=amount (CGST,SGST... types only),
        // ChequeNo=chequeNo, PLA=empty,
        // Treasury Classification=majorHead-subMajor-minorHead
        // ════════════════════════════════════════════════════════
        challanFromBills
            .filter((cfb) => CASH_AMOUNT_TYPES.includes(cfb.amountType))
            .forEach((cfb) => {
                const row = createEmptyRow();

                row.id = `CFB-CR-${cfb.id}`;

                row.disbursementDate = cfb.voucharDate
                    ? cfb.voucharDate.toISOString().slice(0, 10)
                    : null;
                // Per spec: VoucherNo = voucharDate field value
                row.voucherNo = cfb.challanNo ?? null;
                row.disbursementCounterfoilNo = null;
                row.disbursementDetails = cfb.amountType ?? null;
                row.disbursementCashAmount = cfb.amount
                    ? parseFloat(cfb.amount.toString())
                    : null;
                row.chequeNo = cfb.chequeNo ?? null;
                row.plaColumnPayment = null;
                row.treasuryClassification = buildClassification(
                    cfb.majorHead, cfb.subMajor, cfb.minorHead
                );

                rows.push(row);
            });

        // ════════════════════════════════════════════════════════
        // SORT all rows by date (receipt date or disbursement date)
        // ════════════════════════════════════════════════════════
        rows.sort((a, b) => {
            const dateA = a.receiptDate || a.disbursementDate || "";
            const dateB = b.receiptDate || b.disbursementDate || "";
            return dateA.localeCompare(dateB);
        });

        // ════════════════════════════════════════════════════════
        // ASSIGN running item numbers on DR side (receipt rows only)
        // ════════════════════════════════════════════════════════
        let itemCounter = 1;
        rows.forEach((row) => {
            if (row.receiptDate && !row.receiptItemNo) {
                row.receiptItemNo = String(itemCounter).padStart(3, "0");
                itemCounter++;
            }
        });

        logger.info(`Cashbook generated`, {
            totalRows: rows.length,
            drRows: rows.filter((r) => r.receiptDate).length,
            crRows: rows.filter((r) => r.disbursementDate).length,
        });

        return rows;
    } catch (error) {
        logger.error(`Cashbook service error`, {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};




// ─────────────────────────────────────────────────────────────
// Save cashbook summary to cashbookInformations table
// Keep only the latest entry per sector (deactivate old ones)
// ─────────────────────────────────────────────────────────────

export const saveCashbookSummary = async ({
    sector,
    month,
    year,
    financialYear,
    receiptCashColumn,
    receiptTreasuryPla,
    disbursementCashColumn,
    disbursementTreasuryPla,
}) => {
    try {
        logger.info(`Saving cashbook summary for sector: ${sector}, year: ${year}`);

        // Step 1 — deactivate all previous entries for this sector
        await prisma.cashbookInformations.updateMany({
            where: {
                sector: sector ?? undefined,
                isActive: true,
            },
            data: { isActive: false },
        });

        // Step 2 — insert the new active entry
        const newEntry = await prisma.cashbookInformations.create({
            data: {
                sector: sector ?? null,
                month: month ?? null,
                year: year ?? null,
                financialYear: financialYear ?? null,
                receiptCashColumn: receiptCashColumn ?? 0,
                receiptTreasuryPla: receiptTreasuryPla ?? 0,
                disbursementCashColumn: disbursementCashColumn ?? 0,
                disbursementTreasuryPla: disbursementTreasuryPla ?? 0,
                isActive: true,
            },
        });

        logger.info(`Cashbook summary saved — id: ${newEntry.id}`);

        return newEntry;
    } catch (error) {
        logger.error(`Error saving cashbook summary: ${error.message}`);
        throw error;
    }
};
