import { createObjectHeadSchema, updateObjectHeadSchema } from "./objectHead.schema.js";
import {
    createObjectHead,
    getObjectHead,
    updateObjectHead,
    toggleObjectHeadStatus
} from "./objectHead.service.js";

export const getAll = async (req, res) => {
    try {
        const objectHead = await getObjectHead();
        return res.status(200).json({ success: true, objectHead });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = createObjectHeadSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const objectHead = await createObjectHead(result.data);
        return res.status(201).json({
            success: true,
            message: "Object Head created successfully",
            objectHead,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};


export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const result = updateObjectHeadSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const objectHead = await updateObjectHead(id, result.data);
        return res.status(200).json({
            success: true,
            message: "Object Head updated successfully",
            objectHead,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};


export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const objectHead = await toggleObjectHeadStatus(id);
        return res.status(200).json({
            success: true,
            message: `Object Head ${objectHead.isActive ? "reactivated" : "deactivated"}`,
            objectHead,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};