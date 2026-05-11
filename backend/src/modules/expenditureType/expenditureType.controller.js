import {
    createExpenditureTypeSchema,
    updateExpenditureTypeSchema
} from "./expenditureType.schema.js";
import {
    createExpenditureType,
    getAllExpenditureTypes,
    updateExpenditureType,
    toggleExpenditureTypeStatus
} from "./expenditureType.service.js";

export const create = async (req, res) => {
    try {
        const result = createExpenditureTypeSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const expenditureType = await createExpenditureType(result.data);
        return res.status(201).json({
            success: true,
            message: "Expenditure type created successfully",
            expenditureType,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const expenditureTypes = await getAllExpenditureTypes();
        return res.status(200).json({ success: true, expenditureTypes });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch expenditure types" });
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const result = updateExpenditureTypeSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const expenditureType = await updateExpenditureType(id, result.data);
        return res.status(200).json({
            success: true,
            message: "Expenditure type updated successfully",
            expenditureType,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const expenditureType = await toggleExpenditureTypeStatus(id);
        return res.status(200).json({
            success: true,
            message: `Expenditure type ${expenditureType.isActive ? "reactivated" : "deactivated"}`,
            expenditureType,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};