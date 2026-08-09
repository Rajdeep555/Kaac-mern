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
    const from = new Date(Date.UTC(year, 3, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year + 1, 2, 31, 23, 59, 59, 999));
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
    parts
        .filter(
            (p) =>
                p != null &&
                String(p).trim() !== "" &&
                String(p).trim() !== "0"
        )
        .join("-") || null;

export const getCashbookRowsByFy = async (year, sector) => {
    try {
        const { from, to } = getFyRange(year);

        const isStateSector = sector === "STATE";
        const isConsolidated = sector === "CONSOLIDATED";

        logger.info(`Cashbook fetch started`, {
            year,
            sector,
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
        });

        // For models that have a sector field, filter by it unless CONSOLIDATED
        const sectorFilter = !isConsolidated ? { sector } : {};

        // Challan uses challanType instead of sector
        const challanSectorFilter = !isConsolidated ? { challanType: sector } : {};

        const [
            cashReceipts,
            challans,
            challanFromBills,
            challanTwoRows,
            expenditures,
            stateChallans,
        ] = await Promise.all([
            // ── CashReceipt: has sector field (default COUNCIL) ─────
            // Filter by sector unless CONSOLIDATED
            prisma.cashReceipt.findMany({
                where: {
                    date: { gte: from, lte: to },
                    isActive: true,
                    ...(isConsolidated ? {} : { sector }),
                },
                orderBy: { date: "asc" },
            }),

            // ── Challan: has challanType as sector field ─────────────
            prisma.challan.findMany({
                where: {
                    challanDate: { gte: from, lte: to },
                    isActive: true,
                    ...challanSectorFilter,
                },
                orderBy: { challanDate: "asc" },
            }),

            // ── ChallanFromBill: has sector field ────────────────────
            prisma.challanFromBill.findMany({
                where: {
                    voucharDate: { gte: from, lte: to },
                    isActive: true,
                    amountType: { in: [...PLA_AMOUNT_TYPES, ...CASH_AMOUNT_TYPES] },
                    ...sectorFilter,
                },
                orderBy: { voucharDate: "asc" },
            }),

            // ── ChallanTwo: has sector field ─────────────────────────
            prisma.challanTwo.findMany({
                where: {
                    kaacChallanDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { kaacChallanDate: "asc" },
            }),

            // ── Expenditure: has sector field ────────────────────────
            prisma.expenditure.findMany({
                where: {
                    voucherDate: { gte: from, lte: to },
                    isActive: true,
                    ...sectorFilter,
                },
                orderBy: { voucherDate: "asc" },
            }),

            // ── StateChallan: only for STATE or CONSOLIDATED ─────────
            isStateSector || isConsolidated
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

        // ── DEBUG: dump every fetched table ─────────────────────────
        console.log("[CASHBOOK DEBUG] ===== RAW TABLE DUMPS =====");
        console.log("[CASHBOOK DEBUG] sector param:", JSON.stringify(sector));
        console.log("[CASHBOOK DEBUG] year param:", year);

        console.log(
            `[CASHBOOK DEBUG] cashReceipts (${cashReceipts.length}):`,
            JSON.stringify(cashReceipts, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] challans (${challans.length}):`,
            JSON.stringify(challans, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] challanFromBills (${challanFromBills.length}):`,
            JSON.stringify(challanFromBills, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] challanTwoRows (${challanTwoRows.length}):`,
            JSON.stringify(challanTwoRows, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] expenditures (${expenditures.length}):`,
            JSON.stringify(expenditures, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] stateChallans (${stateChallans.length}):`,
            JSON.stringify(stateChallans, null, 2)
        );
        console.log("[CASHBOOK DEBUG] ===== END RAW TABLE DUMPS =====");
        // ── END DEBUG ────────────────────────────────────────────

        const challansWithoutCounterfoil = challans.filter(
            (c) => !c.counterfoilNo || c.counterfoilNo.trim() === ""
        );
        const challansWithCounterfoil = challans.filter(
            (c) => c.counterfoilNo && c.counterfoilNo.trim() !== ""
        );

        // STATE-sector challanFromBill rows have no cash-column activity:
        // every amountType (all 23 types — the old PLA_AMOUNT_TYPES +
        // CASH_AMOUNT_TYPES combined) posts to the receipt PLA column,
        // and to the disbursement PLA column too EXCEPT "Advance
        // Payment", which is receipt-side only.
        // Non-STATE (COUNCIL) rows keep the original split: PLA types go
        // to the receipt PLA column only, cash types go to both cash
        // columns.
        const cfbStateRows = challanFromBills.filter(
            (cfb) => cfb.sector === "STATE"
        );
        const cfbNonStateRows = challanFromBills.filter(
            (cfb) => cfb.sector !== "STATE"
        );

        const cfbPlaRows = cfbNonStateRows.filter((cfb) =>
            PLA_AMOUNT_TYPES.includes(cfb.amountType)
        );
        const cfbCashRows = cfbNonStateRows.filter((cfb) =>
            CASH_AMOUNT_TYPES.includes(cfb.amountType)
        );

        // ── DEBUG: derived challanFromBill buckets ──────────────────
        console.log("[CASHBOOK DEBUG] ===== DERIVED CFB BUCKETS =====");
        console.log(
            `[CASHBOOK DEBUG] cfbStateRows (${cfbStateRows.length}):`,
            JSON.stringify(cfbStateRows, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] cfbNonStateRows (${cfbNonStateRows.length}):`,
            JSON.stringify(cfbNonStateRows, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] cfbPlaRows (non-state, ${cfbPlaRows.length}):`,
            JSON.stringify(cfbPlaRows, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] cfbCashRows (non-state, ${cfbCashRows.length}):`,
            JSON.stringify(cfbCashRows, null, 2)
        );
        console.log(
            `[CASHBOOK DEBUG] FY date bounds -> from: ${from.toISOString()} to: ${to.toISOString()}`
        );
        if (cfbStateRows.length > 0) {
            const dates = cfbStateRows
                .map((cfb) => cfb.voucharDate)
                .filter(Boolean)
                .sort((a, b) => a - b);
            console.log(
                `[CASHBOOK DEBUG] cfbStateRows voucharDate range -> min: ${dates[0]?.toISOString()} max: ${dates[dates.length - 1]?.toISOString()}`
            );
        }
        console.log("[CASHBOOK DEBUG] ===== END DERIVED CFB BUCKETS =====");
        // ── END DEBUG ────────────────────────────────────────────

        const rows = [];

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 1: CashReceipt
        // Has sector field (default COUNCIL) — filtered correctly above
        // Classification: always null (no head fields in schema)
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
            row.receiptCashAmount = r.rupeesInCash
                ? parseFloat(r.rupeesInCash)
                : null;
            row.receiptPlaColumn = null;
            row.receiptClassification = null;
            c1Total += row.receiptCashAmount ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 2: Challan WITHOUT counterfoilNo
        // Classification: majorHead-subMajorHead-minorHead-subHead-subSubHead-detailHead
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
            row.receiptPlaColumn = c.amount
                ? parseFloat(c.amount.toString())
                : null;
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
        // Classification: majorHead-subMajor-minorHead
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
        // Classification: majorHead-subMajor-minorHead
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
            row.receiptClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            c3bTotal += row.receiptCashAmount ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR + CR SIDE — CONDITION 3C: ChallanFromBill (STATE-sector rows)
        // STATE has no cash-column activity. Every STATE-sector
        // amountType posts to the receipt PLA column. All types also
        // post to the disbursement PLA column EXCEPT "Advance Payment",
        // which is receipt-side only.
        // Classification: majorHead-subMajor-minorHead
        // ════════════════════════════════════════════════════════
        let c3cDrTotal = 0;
        let c3cCrTotal = 0;
        cfbStateRows.forEach((cfb) => {
            const cfbDate = cfb.voucharDate
                ? cfb.voucharDate.toISOString().slice(0, 10)
                : null;
            const classification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            const amount = cfb.amount
                ? parseFloat(cfb.amount.toString())
                : null;

            // Receipt side — always, for every STATE amountType
            const drRow = createEmptyRow();
            drRow.id = `CFB-DR-STATE-${cfb.id}`;
            drRow.receiptDate = cfbDate;
            drRow.receiptItemNo = cfb.challanNo ?? null;
            drRow.receiptCounterfoilNo = null;
            drRow.receiptParticulars = cfb.amountType ?? null;
            drRow.receiptCashAmount = null;
            drRow.receiptPlaColumn = amount;
            drRow.receiptClassification = classification;
            c3cDrTotal += amount ?? 0;
            rows.push(drRow);

            // Disbursement side — every STATE amountType EXCEPT
            // "Advance Payment"
            if (cfb.amountType !== "Advance Payment") {
                const crRow = createEmptyRow();
                crRow.id = `CFB-CR-STATE-${cfb.id}`;
                crRow.disbursementDate = cfbDate;
                crRow.voucherNo = cfb.challanNo ?? null;
                crRow.disbursementCounterfoilNo = null;
                crRow.disbursementDetails = cfb.amountType ?? null;
                crRow.disbursementCashAmount = null;
                crRow.chequeNo = cfb.chequeNo ?? null;
                crRow.plaColumnPayment = amount;
                crRow.treasuryClassification = classification;
                c3cCrTotal += amount ?? 0;
                rows.push(crRow);
            }
        });
        console.log(
            `[CASHBOOK] Total amount from Challan From Bill -> Receipt PLA: ${c3cDrTotal}, Disbursement PLA: ${c3cCrTotal}`
        );

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 4: Challan WITH counterfoilNo (DR + CR pair)
        // DR Classification: majorHead-subMajorHead-minorHead-subHead-subSubHead-detailHead
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
        // DR SIDE — CONDITION 5: ChallanTwo (has sector field — filtered correctly)
        // Classification: majorHead-subMajor-minorHead
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
            row.receiptClassification = buildClassification(
                ct.majorHead,
                ct.subMajor,
                ct.minorHead
            );
            c5Total += row.receiptPlaColumn ?? 0;
            rows.push(row);
        });

        // ════════════════════════════════════════════════════════
        // DR SIDE — CONDITION 6: StateChallan (STATE or CONSOLIDATED only)
        // Classification: majorHead-subMajorHead-minorHead-subHead-subSubHead-detailHead-subDetailHead
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
                    ? parseFloat((sc.totalAmount).toFixed(2))
                    : null;
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
        console.log(`[CASHBOOK] Total amount from State Challan -> Receipt PLA: ${c6Total}`);

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 2: Expenditure (has sector field — filtered correctly)
        // treasuryClassification: majorHead-subMajorHead-minorHead-subHead-subSubHead-detailHead-subDetailHead
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
        console.log(`[CASHBOOK] Total amount from Expenditure (CR side) -> Disbursement PLA: ${crETotal}`);

        // ════════════════════════════════════════════════════════
        // CR SIDE — CONDITION 3: ChallanFromBill (Cash types)
        // treasuryClassification: majorHead-subMajor-minorHead
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
            row.treasuryClassification = buildClassification(
                cfb.majorHead,
                cfb.subMajor,
                cfb.minorHead
            );
            crCfbTotal += row.disbursementCashAmount ?? 0;
            rows.push(row);
        });

        console.log(
            `[CASHBOOK] CR side total (Challan From Bill PLA + Expenditure): ${c3cCrTotal + crETotal
            } (Challan From Bill: ${c3cCrTotal}, Expenditure: ${crETotal})`
        );

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
            drCashTotal: drRows.reduce(
                (s, r) => s + (r.receiptCashAmount ?? 0),
                0
            ),
            drPlaTotal: drRows.reduce(
                (s, r) => s + (r.receiptPlaColumn ?? 0),
                0
            ),
            crCashTotal: crRows.reduce(
                (s, r) => s + (r.disbursementCashAmount ?? 0),
                0
            ),
            crPlaTotal: crRows.reduce(
                (s, r) => s + (r.plaColumnPayment ?? 0),
                0
            ),
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
        logger.info(
            `Saving cashbook summary for sector: ${sector}, year: ${year}`
        );

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