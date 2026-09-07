// ── formOne.controller.js ──────────────────────────────────────────

import { getCashbookRowsByDateRange, saveCashbookSummary } from "./formOne.service.js";

export const getCashbookByFy = async (req, res) => {
    try {
        const { from, to, sector } = req.query;
        // console.log("👉 req.query:", req.query); // ADD THIS
        // console.log("👉 sector:", sector);        // ADD THIS

        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: "Query params 'from' and 'to' are required",
            });
        }

        const rows = await getCashbookRowsByDateRange(from, to, sector);

        return res.status(200).json({
            success: true,
            message: "Cashbook fetched successfully",
            data: rows,
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};


export const postCashbookSummary = async (req, res) => {
    try {
        // 🔍 STEP 1 — what did we actually receive on the wire?
        // console.log("🟡 [postCashbookSummary] raw req.body:", req.body);

        const {
            sector,
            month,
            year,
            financialYear,
            fromDate,
            toDate,
            receiptCashColumn,
            receiptTreasuryPla,
            disbursementCashColumn,
            disbursementTreasuryPla,
        } = req.body;

        // // 🔍 STEP 2 — did fromDate/toDate survive destructuring, and what type are they?
        // console.log("🟡 [postCashbookSummary] destructured fromDate:", fromDate, typeof fromDate);
        // console.log("🟡 [postCashbookSummary] destructured toDate:", toDate, typeof toDate);

        if (!year) {
            return res.status(400).json({
                success: false,
                message: "Field 'year' is required",
            });
        }

        // 🔍 STEP 3 — what are we about to hand to the service?
        const payload = {
            sector,
            month,
            year,
            financialYear,
            fromDate,
            toDate,
            receiptCashColumn,
            receiptTreasuryPla,
            disbursementCashColumn,
            disbursementTreasuryPla,
        };
        // console.log("🟡 [postCashbookSummary] payload sent to saveCashbookSummary:", payload);

        const result = await saveCashbookSummary(payload);

        // 🔍 STEP 4 — what did the DB actually end up storing?
        // console.log("🟢 [postCashbookSummary] saved row returned from DB:", result);

        return res.status(200).json({
            success: true,
            message: "Cashbook summary saved successfully",
            data: result,
        });
    } catch (error) {
        console.log("🔴 [postCashbookSummary] error:", error.message);
        logger.error(`postCashbookSummary error: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to save cashbook summary",
            error: error.message,
        });
    }
};


