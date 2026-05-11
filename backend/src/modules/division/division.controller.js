import logger from "../../utils/logger.js";
import { createDivisionSchema, updateDivisionSchema } from "./division.schema.js";
import { createDivison, getAllDivisions, updateDivision, toggleDivisionStatus } from "./division.service.js";

export const create = async (req, res) => {
    try {
        logger.info("Creating division == ", req.body);

        const result = createDivisionSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const division = await createDivison(result.data);

        return res.status(201).json({
            success: true,
            message: "Division created successfully",
            division: {
                id: division.id,
                divisionName: division.divisionName,
                divisionCode: division.divisionCode,
                sector: division.sector,
                isActive: division.isActive,
            },
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const divisions = await getAllDivisions();
        return res.status(200).json({ success: true, divisions });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch Divisions" });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;

        const result = updateDivisionSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const division = await updateDivision(id, result.data);
        return res.status(200).json({
            success: true,
            message: "Division updated successfully",
            division,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const division = await toggleDivisionStatus(id);
        return res.status(200).json({
            success: true,
            message: `Division ${division.isActive ? "reactivated" : "deactivated"} successfully`,
            division,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};