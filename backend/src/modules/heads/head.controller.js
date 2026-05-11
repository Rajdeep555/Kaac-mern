import logger from "../../utils/logger.js";
import { createHeadSchema, updateHeadSchema } from "./head.schema.js";
import { createHead, getAllHeads, getHeadsHierarchy, updateHead, toggleHeadStatus } from "./head.service.js";

export const create = async (req, res) => {
    try {
        const result = createHeadSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }
        // ✅ FIX: return full head data not just { id }
        const head = await createHead(result.data);
        return res.status(201).json({ success: true, message: "Head created successfully", head });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const { sector } = req.query;
        const heads = await getAllHeads({ sector });
        return res.status(200).json({ success: true, heads });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch heads" });
    }
};

// ✅ NEW
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const result = updateHeadSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }
        const head = await updateHead(id, result.data);
        return res.status(200).json({ success: true, message: "Head updated successfully", head });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ NEW
export const deactivate = async (req, res) => {
    try {
        const { id } = req.params;
        const head = await toggleHeadStatus(id);
        return res.status(200).json({
            success: true,
            message: `Head ${head.isActive ? "reactivated" : "deactivated"}`,
            head,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getHierarchy = async (req, res) => {
    try {
        const { sector, level, majorHeadCode, subMajorCode, minorHeadCode, subHeadCode, subSubHeadCode, detailHeadCode } = req.query;
        if (!sector || !level) {
            return res.status(400).json({ success: false, message: "sector and level are required" });
        }
        const data = await getHeadsHierarchy({ sector, level, majorHeadCode, subMajorCode, minorHeadCode, subHeadCode, subSubHeadCode, detailHeadCode });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};