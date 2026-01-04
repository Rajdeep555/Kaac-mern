import logger from "../../utils/logger.js";
import { createDivisionSchema } from "./division.schema.js";
import { createDivison, getAllDivisions } from "./division.service.js";

export const create = async (req, res) => {
    try {
        logger.info("Creating division == ", req.body);

        const result = createDivisionSchema.safeParse(req.body);
        logger.info("After division", result);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const division = await createDivison(result.data); // ✅ pass parsed object

        return res.status(201).json({
            success: true,
            message: "Divison created sucessfully",
            divison: {
                id: division.id,
                divisionName: division.divisionName,
                divisionCode: division.divisionCode,
            },
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};


export const getAll = async (req, res) => {
    try {
        const divisions = await getAllDivisions();

        // console.log("divisions", divisions);
        return res.status(200).json({
            success: true,
            divisions,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Divisions",
        });
    }
}