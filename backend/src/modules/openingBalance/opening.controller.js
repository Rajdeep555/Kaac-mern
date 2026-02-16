import { createOpeningBalanceSchema, updateOpeningBalanceSchema } from "./opening.schema.js";
import { createOpeningBalance, getAllOpeningBalance, updateOpeningBalance } from "./opening.service.js";
import logger from "../../utils/logger.js"

export const create = async (req, res) => {
    try {
        const validateData = createOpeningBalanceSchema.parse(req.body);
        const cashierId = req.user.id;

        const openingBalance = await createOpeningBalance({
            ...validateData,
            cashierId,
        })

        return res.status(201).json({
            success: true,
            message: "Opening Balance Created Successfully",
            data: openingBalance,
        })



    } catch (error) {
        logger.error("Failed to create opening balance", error);
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors,
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
        });

    }
}

export const getAll = async (req, res) => {
    try {
        const data = await getAllOpeningBalance();

        return res.status(200).json({
            success: true,
            message: "Opening Balance Fetched Successfully",
            data,
        })
    } catch (error) {
        logger.error("Failed to fetch opening balance", error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const edit = async (req, res) => {
    try {
        const { id } = req.params;

        // validate 
        const validateData = updateOpeningBalanceSchema.parse(req.body);

        const updated = await updateOpeningBalance(
            id,
            req.user,
            validateData
        )

        return res.status(200).json({
            success: true,
            message: "Opening balance updated successfully",
            data: updated,
        })
    } catch (error) {
        logger.error("Failed to update opening balance", error);
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors,
            });
        }
    }
}