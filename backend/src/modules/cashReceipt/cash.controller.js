import logger from "../../utils/logger.js";
import { createCashReceiptSchema } from "./cash.schema.js"
import { createCashReceipt, getAllCashReceipts, getCashReceiptById, updateCashReceipt } from "./cash.service.js";

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