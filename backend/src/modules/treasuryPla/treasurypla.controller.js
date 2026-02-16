import { ZodError } from "zod";
import logger from "../../utils/logger.js";
import { createTreasuryPlaSchema, updateTreasuryPlaSchema } from "./treasurypla.schema.js";
import { createTreasuryPla, getAllTreasuryPla, updateTreasuryPla } from "./treasurypla.service.js";

export const create = async (req, res) => {
    try {
        const validateData = createTreasuryPlaSchema.parse(req.body);
        const cashierId = req.user.id;

        const treasuryPla = await createTreasuryPla({
            ...validateData,
            cashierId
        })

        return res.status(201).json({
            success: true,
            message: "Treasury PLA created successfully",
            data: treasuryPla,
        })
    } catch (error) {
        logger.error("Failed to create Treasury PLA", error);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export const getAll = async (req, res) => {
    try {
        const data = await getAllTreasuryPla(req.user);

        return res.status(200).json({
            success: true,
            count: data.length,
            data,
        });

    } catch (error) {
        logger.error("Failed to fetch Treasury PLA", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const edit = async (req, res) => {
    try {
        const { id } = req.params;

        const validatedData = updateTreasuryPlaSchema.parse(req.body);

        const updated = await updateTreasuryPla(
            id,
            req.user,
            validatedData
        );

        return res.status(200).json({
            success: true,
            message: "Treasury PLA updated successfully",
            data: updated,
        });

    } catch (error) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors,
            });
        }

        logger.error("Failed to update Treasury PLA", error);

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
