import { createDDOSchema, updateDDOSchema } from "./ddo.schema.js";
import { createDDO, getAllDDOs, updateDDO, deactivateDDO } from "./ddo.service.js";

export const create = async (req, res) => {
    try {
        const result = createDDOSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }
        const ddo = await createDDO(result.data);
        return res.status(201).json({ success: true, message: "DDO created successfully", ddo });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const ddos = await getAllDDOs();
        return res.status(200).json({ success: true, ddos });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch DDOs" });
    }
};

// ✅ FIX: Add update controller
export const update = async (req, res) => {
    try {
        const { id } = req.params;

        const result = updateDDOSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const ddo = await updateDDO(id, result.data);
        return res.status(200).json({ success: true, message: "DDO updated successfully", ddo });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ FIX: Add deactivate controller
export const deactivate = async (req, res) => {
    try {
        const { id } = req.params;
        const ddo = await deactivateDDO(id);
        return res.status(200).json({ success: true, message: "DDO status updated", ddo });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};