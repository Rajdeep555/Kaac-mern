import { createExpenditureSchema } from "./expenditure.schema.js"
import { createExpenditure } from "./expenditure.service.js";
import logger from "../../utils/logger.js";

export const create = async (req, res) => {
    try {
        const payload = createExpenditureSchema.parse(req.body);

        const expenditure = await createExpenditure(payload);

        return res.status(201).json({
            success: true,
            message: "Expenditure Created Successfully",
            data: expenditure,
        })
    } catch (error) {
        console.error("Create Expenditure Error:", error);

        if (error.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "Invalid reference ID (Department / DDO / Division not found)",
                meta: error.meta,
            });
        }

        if (error.name === "ZodError") {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}