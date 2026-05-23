import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

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
    const from = new Date(year, 3, 1);
    const to = new Date(year + 1, 2, 31);
    return { from, to };
}

function createEmptyRow() {
    return {
        id: null,
        receiptDate: null,
        receiptItemNo: null,
        receiptCounterfoilNo: null,
        receiptParticulars: null,
        receiptCashAmount: null,
        receiptPlaColumn: null,
        receiptClassification: null,
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

// Joins only truthy, non-blank parts with "-"
const buildClassification = (...parts) =>
    parts.filter((p) => p != null && String(p).trim() !== "" && String(p).trim() !== "0")
        .join("-") || null;


export const getCashbookRowsByFy = async (year, sector) => {
    try {
        const { from, to } = getFyRange(year);

        logger.info(`Cashbook fetch started`, {
            year, sector,
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
        });

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};
        const challanSectorFilter =
            sector && sector !== "CONSOLIDATED" ? { challanType: sector } : {};
        const isStateSector = sector === "STATE";

        const [
            cashReceipts,
            challans,
            challanFromBills,
            challanTwoRows,
            expenditures,
            stateChallans,
        ] = await Promise.all([
            prisma.cashReceipt.findMany({
                where: { date: { gte: from, lte: to }, isActive: true },
                orderBy: { date: "asc" },
            }),
            prisma.challan.findMany({
                where: {
                    challanDate: { gte: from, lte: to },
                    isActive: true,
                    ...challanSectorFilter,
                },
                orderBy: { challanDate: "asc" },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    voucharDate: { gte: from, lte: to },
                    isActive: true,
                    amountType: { in: [...PLA_AMOUNT_TYPES, ...CASH_AMOUNT_TYPES] },
                    ...sectorFilter,
                },
                orderBy: { voucharDate: "asc" },
            }),
            prisma.challanTwo.findMany({
                where: {
                    kaacChallanDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { kaacChallanDate: "asc" },
            }),
            prisma.expenditure.findMany({
                where: {
                    voucherDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { voucherDate: "asc" },
            }),
            isStateSector
                ? prisma.stateChallan.findMany({
                    where: {
                        challanDate: { gte: from, lte: to },
                        sector: "STATE",
                    },
                    orderBy: { challanDate: "asc" },
                })
                : Promise.resolve([]),
        ]);

        logger.info(`[CASHBOOK] Raw fetch counts`, {
            cashReceipts: cashReceipts.length,
            challans: challans.length,
            challanFromBills: challanFromBills.length,
            challanTwoRows: challanTwoRows.length,
            expenditures: expenditures.length,
            stateChallans: stateChallans.length,
        });

        const challansWithoutCounterfoil = challans.filter(
            (c) => !c.counterfoilNo || c.counterfoilNo.trim() === ""
        );
        const challansWithCounterfoil = challans.filter(
            (c) => c.counterfoilNo && c.counterfoilNo.trim() !== ""
        );

        const cfbPlaRows = challanFromBills.filter((cfb) =>
            PLA_AMOUNT_TYPES.includes(cfb.amountType)
        );
        const cfbCashRows = challanFromBills.filter((cfb) =>
            CASH_AMOUNT_TYPES.includes(cfb.amountType)
        );

        const rows = [];

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 1: CashReceipt
        // Classification: CashReceipt has NO head fields — always null
        // ════════════════════════════════════════════════════════
        let c1Total = 0;
        cashReceipts.forEach((r) => {
            const row = createEmptyRow();
            row.id = `R-${r.id}`;
            row.receiptDate = r.date ? r.date.toISOString().slice(0, 10) : null;
            row.receiptCounterfoilNo = r.counterfoilNo ?? null;
            const parts = [
                r.receivedFrom,
                r.letterNo ? `Letter No: ${r.letterNo}` : null,
                r.letterDate
                    ? `Letter Date: ${new Date(r.letterDate).toLocaleDateString()}`
                    : null,
            ].filter(Boolean);
            row.receiptParticulars = parts.join(" | ") || null;
            row.receiptCashAmount = r.rupeesInCash ? parseFloat(r.rupeesInCash) : null;
            row.receiptPlaColumn = null;
            // CashReceipt schema has no head fields — classification is null
            row.receiptClassification = null;
            c1Total += row.receiptCashAmount ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 2: Challan WITHOUT counterfoilNo
        // Classification: majorHead - subMajorHead - minorHead - subHead - subSubHead - detailHead
        // ════════════════════════════════════════════════════════
        let c2Total = 0;
        challansWithoutCounterfoil.forEach((c) => {
            const row = createEmptyRow();
            row.id = `C-DR-${c.id}`;
            row.receiptDate = c.challanDate
                ? c.challanDate.toISOString().slice(0, 10)
                : null;
            row.receiptItemNo = c.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = c.remarks ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn = c.amount ? parseFloat(c.amount.toString()) : null;
            // Challan schema: majorHead, subMajorHead, minorHead, subHead, subSubHead, detailHead
            row.receiptClassification = buildClassification(
                c.majorHead,
                c.subMajorHead,
                c.minorHead,
                c.subHead,
                c.subSubHead,
                c.detailHead
            );
            c2Total += row.receiptPlaColumn ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3A: ChallanFromBill (PLA types)
        // Classification: majorHead - subMajor - minorHead  (schema only goes to minorHead)
        // ════════════════════════════════════════════════════════
        let c3aTotal = 0;
        cfbPlaRows.forEach((cfb) => {
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
            // challanFromBill schema: majorHead, subMajor, minorHead (no deeper heads)
            row.receiptClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            c3aTotal += row.receiptPlaColumn ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 3B: ChallanFromBill (Cash types)
        // Classification: majorHead - subMajor - minorHead
        // ════════════════════════════════════════════════════════
        let c3bTotal = 0;
        cfbCashRows.forEach((cfb) => {
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
            // challanFromBill schema: majorHead, subMajor, minorHead (no deeper heads)
            row.receiptClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            c3bTotal += row.receiptCashAmount ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 4: Challan WITH counterfoilNo (DR + CR pair)
        // DR Classification: majorHead - subMajorHead - minorHead - subHead - subSubHead - detailHead
        // CR treasuryClassification: same full chain
        // ════════════════════════════════════════════════════════
        let c4DrTotal = 0;
        let c4CrTotal = 0;
        challansWithCounterfoil.forEach((c) => {
            const challanDate = c.challanDate
                ? c.challanDate.toISOString().slice(0, 10)
                : null;

            const fullClassification = buildClassification(
                c.majorHead,
                c.subMajorHead,
                c.minorHead,
                c.subHead,
                c.subSubHead,
                c.detailHead
            );

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
            drRow.receiptClassification = fullClassification;
            c4DrTotal += drRow.receiptPlaColumn ?? 0;
            rows.push(drRow);

            const crRow = createEmptyRow();
            crRow.id = `C-CR-CF-${c.id}`;
            crRow.disbursementDate = challanDate;
            crRow.voucherNo = c.challanNo ?? null;
            crRow.disbursementCounterfoilNo = c.counterfoilNo ?? null;
            crRow.disbursementDetails = c.remarks ?? null;
            crRow.disbursementCashAmount = c.amount
                ? parseFloat(c.amount.toString())
                : null;
            crRow.chequeNo = null;
            crRow.plaColumnPayment = null;
            crRow.treasuryClassification = fullClassification;
            c4CrTotal += crRow.disbursementCashAmount ?? 0;
            rows.push(crRow);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 5: ChallanTwo
        // Classification: majorHead - subMajor - minorHead  (schema has no deeper heads)
        // ════════════════════════════════════════════════════════
        let c5Total = 0;
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
            // challanTwo schema: majorHead, subMajor, minorHead (no subHead/detailHead)
            row.receiptClassification = buildClassification(
                ct.majorHead,
                ct.subMajor,
                ct.minorHead
            );
            c5Total += row.receiptPlaColumn ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 6: StateChallan (STATE sector only)
        // Classification: majorHead - subMajorHead - minorHead - subHead - subSubHead - detailHead - subDetailHead
        // ════════════════════════════════════════════════════════
        let c6Total = 0;
        stateChallans.forEach((sc) => {
            const row = createEmptyRow();
            row.id = `SC-DR-${sc.id}`;
            row.receiptDate = sc.challanDate
                ? sc.challanDate.toISOString().slice(0, 10)
                : null;
            row.receiptItemNo = sc.challanNo ?? null;
            row.receiptCounterfoilNo = null;
            row.receiptParticulars = sc.remarks ?? null;
            row.receiptCashAmount = null;
            row.receiptPlaColumn =
                sc.totalAmount != null
                    ? parseFloat((sc.totalAmount * 100000).toFixed(2))
                    : null;
            // StateChallan schema has all 7 levels including subDetailHead
            row.receiptClassification = buildClassification(
                sc.majorHead,
                sc.subMajorHead,
                sc.minorHead,
                sc.subHead,
                sc.subSubHead,
                sc.detailHead,
                sc.subDetailHead
            );
            c6Total += row.receiptPlaColumn ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 2: Expenditure
        // treasuryClassification: majorHead - subMajorHead - minorHead - subHead - subSubHead - detailHead - subDetailHead
        // ════════════════════════════════════════════════════════
        let crETotal = 0;
        expenditures.forEach((e) => {
            const row = createEmptyRow();
            row.id = `E-CR-${e.id}`;
            row.disbursementDate = e.voucherDate
                ? e.voucherDate.toISOString().slice(0, 10)
                : null;
            row.voucherNo = e.voucherNo ?? null;
            row.disbursementCounterfoilNo = null;
            row.disbursementDetails = e.remarks ?? null;
            row.disbursementCashAmount = null;
            row.chequeNo = e.chequeNo ?? e.chequeBookNo ?? null;
            row.plaColumnPayment = e.grossAmount
                ? parseFloat(e.grossAmount.toString())
                : null;
            // Expenditure schema has all 7 levels including subDetailHead
            row.treasuryClassification = buildClassification(
                e.majorHead,
                e.subMajorHead,
                e.minorHead,
                e.subHead,
                e.subSubHead,
                e.detailHead,
                e.subDetailHead
            );
            crETotal += row.plaColumnPayment ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 3: ChallanFromBill (Cash types)
        // treasuryClassification: majorHead - subMajor - minorHead
        // ════════════════════════════════════════════════════════
        let crCfbTotal = 0;
        cfbCashRows.forEach((cfb) => {
            const row = createEmptyRow();
            row.id = `CFB-CR-${cfb.id}`;
            row.disbursementDate = cfb.voucharDate
                ? cfb.voucharDate.toISOString().slice(0, 10)
                : null;
            row.voucherNo = cfb.challanNo ?? null;
            row.disbursementCounterfoilNo = null;
            row.disbursementDetails = cfb.amountType ?? null;
            row.disbursementCashAmount = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;
            row.chequeNo = cfb.chequeNo ?? null;
            row.plaColumnPayment = null;
            // challanFromBill schema: majorHead, subMajor, minorHead
            row.treasuryClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            crCfbTotal += row.disbursementCashAmount ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // SORT all rows by date
        // ════════════════════════════════════════════════════════
        rows.sort((a, b) => {
            const dateA = a.receiptDate || a.disbursementDate || "";
            const dateB = b.receiptDate || b.disbursementDate || "";
            return dateA.localeCompare(dateB);
        });

        // ════════════════════════════════════════════════════════
        // ASSIGN running item numbers on DR side
        // ════════════════════════════════════════════════════════
        let itemCounter = 1;
        rows.forEach((row) => {
            if (row.receiptDate && !row.receiptItemNo) {
                row.receiptItemNo = String(itemCounter).padStart(3, "0");
                itemCounter++;
            }
        });

        // ── Final summary ─────────────────────────────────────────
        const drRows = rows.filter((r) => r.receiptDate);
        const crRows = rows.filter((r) => r.disbursementDate);

        logger.info(`[CASHBOOK] Final summary`, {
            totalRows: rows.length,
            drRows: drRows.length,
            crRows: crRows.length,
            drCashTotal: drRows.reduce((s, r) => s + (r.receiptCashAmount ?? 0), 0),
            drPlaTotal: drRows.reduce((s, r) => s + (r.receiptPlaColumn ?? 0), 0),
            crCashTotal: crRows.reduce((s, r) => s + (r.disbursementCashAmount ?? 0), 0),
            crPlaTotal: crRows.reduce((s, r) => s + (r.plaColumnPayment ?? 0), 0),
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

        await prisma.cashbookInformations.updateMany({
            where: { sector: sector ?? undefined, isActive: true },
            data: { isActive: false },
        });

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