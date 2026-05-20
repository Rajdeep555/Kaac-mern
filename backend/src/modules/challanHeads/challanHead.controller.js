// challanHead.controller.js

import logger from "../../utils/logger.js";

import {
    getAllChallanHeads,
    createReceiptHeadService,
    getReceiptHeadByIdService,
    updateReceiptHeadService,
    deleteReceiptHeadService,
} from "./challanHead.service.js";

import {
    createReceiptHeadSchema,
    updateReceiptHeadSchema,
} from "./challanHead.schema.js";

// ─────────────────────────────────────────────
// Get All
// ─────────────────────────────────────────────
export const getAll = async (req, res) => {
    try {
        const heads = await getAllChallanHeads();

        return res.json({
            success: true,
            data: heads,
        });
    } catch (error) {
        logger.error(
            "Failed to fetch heads",
            error,
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────
export const create = async (req, res) => {
    try {
        const validatedData =
            createReceiptHeadSchema.parse(req.body);

        const head =
            await createReceiptHeadService(
                validatedData,
            );

        return res.status(201).json({
            success: true,
            message:
                "Receipt Head created successfully",
            data: head,
        });
    } catch (error) {
        logger.error(
            "Failed to create receipt head",
            error,
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ─────────────────────────────────────────────
// Get By ID
// ─────────────────────────────────────────────
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const head =
            await getReceiptHeadByIdService(id);

        if (!head) {
            return res.status(404).json({
                success: false,
                message: "Receipt Head not found",
            });
        }

        return res.json({
            success: true,
            data: head,
        });
    } catch (error) {
        logger.error(
            "Failed to fetch receipt head",
            error,
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────
export const update = async (req, res) => {
    try {
        const { id } = req.params;

        const validatedData =
            updateReceiptHeadSchema.parse(req.body);

        const updatedHead =
            await updateReceiptHeadService(
                id,
                validatedData,
            );

        return res.json({
            success: true,
            message:
                "Receipt Head updated successfully",
            data: updatedHead,
        });
    } catch (error) {
        logger.error(
            "Failed to update receipt head",
            error,
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────
export const remove = async (req, res) => {
    try {
        const { id } = req.params;

        await deleteReceiptHeadService(id);

        return res.json({
            success: true,
            message:
                "Receipt Head deleted successfully",
        });
    } catch (error) {
        logger.error(
            "Failed to delete receipt head",
            error,
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};