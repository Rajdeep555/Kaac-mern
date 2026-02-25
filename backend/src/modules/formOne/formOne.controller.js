import { getCashbookRowsByFy, saveCashbookSummary } from "./formOne.service.js";

export const getCashbookByFy = async (req, res) => {
    try {
        const { year, sector } = req.query;

        if (!year) {
            return res.status(400).json({
                success: false,
                message: "Query param 'year' is required",
            });
        }

        const rows = await getCashbookRowsByFy(Number(year), sector);

        return res.status(200).json({
            success: true,
            message: "Cashbook fetched successfully",
            data: rows,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};


export const postCashbookSummary = async (req, res) => {
    try {
        const {
            sector,
            month,
            year,
            financialYear,
            receiptCashColumn,
            receiptTreasuryPla,
            disbursementCashColumn,
            disbursementTreasuryPla,
        } = req.body;

        if (!year) {
            return res.status(400).json({
                success: false,
                message: "Field 'year' is required",
            });
        }

        const result = await saveCashbookSummary({
            sector,
            month,
            year,
            financialYear,
            receiptCashColumn,
            receiptTreasuryPla,
            disbursementCashColumn,
            disbursementTreasuryPla,
        });

        return res.status(200).json({
            success: true,
            message: "Cashbook summary saved successfully",
            data: result,
        });
    } catch (error) {
        logger.error(`postCashbookSummary error: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to save cashbook summary",
            error: error.message,
        });
    }
};