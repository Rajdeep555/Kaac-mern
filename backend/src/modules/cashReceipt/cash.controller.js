import logger from "../../utils/logger.js";
import { createCashReceiptSchema } from "./cash.schema.js"
import { createCashReceipt, getAllCashReceipts, getCashReceiptByCounterfoilNo, getCashReceiptById, getCashReceiptTotal, getPendingReceipts, getPendingReceiptsCount, updateCashReceipt } from "./cash.service.js";

export const create = async (req, res) => {
    try {
        const parsed = createCashReceiptSchema.parse(req.body);

        const receipt = await createCashReceipt({
            ...parsed,
            cashierId: req.user.id
        })

        return res.status(201).json({
            success: true,
            message: "Cash receipt created successfully",
            data: receipt
        })
    } catch (error) {
        logger.error("Failed to create cash receipt", error);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export const update = async (req, res) => {
    try {
        const updated = await updateCashReceipt(
            req.params.id,
            req.body,
            req.user.id,
            req.user.role
        )

        return res.status(200).json({
            success: true,
            message: "Cash receipt updated successfully",
            data: updated,
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message,
        });
    }
}

export const getById = async (req, res) => {
    try {
        const receipt = await getCashReceiptById(
            req.params.id,
            req.user.id,
            req.user.role
        );

        return res.status(200).json({
            success: true,
            data: receipt,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        })
    }
}

export const getAll = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const result = await getAllCashReceipts({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            userId: req.user.id,
            role: req.user.role,
        })

        return res.status(200).json({
            success: true,
            ...result
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


export const getByCounterfoilNo = async (req, res) => {
    try {
        const receipt = await getCashReceiptByCounterfoilNo(
            req.params.counterfoilNo,
            req.user.id,
            req.user.role,
        )

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: "Counterfoil no not found"
            })
        }

        return res.json({
            success: true,
            data: receipt
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// ─── Pending Receipts ─────────────────────────────────────────────────────────

export const getPending = async (req, res) => {
    try {
        const data = await getPendingReceipts(req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        logger.error("Failed to get pending receipts", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const getPendingCount = async (req, res) => {
    try {
        const count = await getPendingReceiptsCount(req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            count,
        });
    } catch (error) {
        logger.error("Failed to get pending receipts count", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const getTotal = async (req, res) => {
    try {
        const { filterType, fy, month } = req.query;

        if (!filterType || !fy) {
            return res.status(400).json({
                success: false,
                message: "filterType and fy are required",
            });
        }

        if (filterType === "monthly" && !month) {
            return res.status(400).json({
                success: false,
                message: "month is required for monthly filter",
            });
        }

        const data = await getCashReceiptTotal({
            filterType,
            fy,
            month,
            userId: req.user.id,
            role: req.user.role,
        });

        return res.status(200).json({ success: true, ...data });
    } catch (error) {
        logger.error("Failed to get cash receipt total", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
