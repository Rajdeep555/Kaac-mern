import logger from "../../utils/logger.js";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.schema.js";
import {
    createDepartment,
    getAllDepartment,
    updateDepartment,
    toggleDepartmentStatus
} from "./department.service.js";

export const create = async (req, res) => {
    try {
        // ✅ FIX: validate first, check success, then pass result.data
        const result = createDepartmentSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const department = await createDepartment(result.data); // ✅ result.data not result

        return res.status(201).json({
            success: true,
            message: "Department created successfully",
            department,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { role } = req.user;
        const { type } = req.query;

        const departments = await getAllDepartment({
            type: role === "ADMIN" ? undefined : type?.toUpperCase(),
            isAdmin: role === "ADMIN",
        });

        res.json(departments);
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        res.status(500).json({ success: false, message: "Failed to fetch departments" });
    }
};

// ✅ NEW: Update controller
export const update = async (req, res) => {
    try {
        const { id } = req.params;

        const result = updateDepartmentSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const department = await updateDepartment(id, result.data);
        return res.status(200).json({
            success: true,
            message: "Department updated successfully",
            department,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};


export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await toggleDepartmentStatus(id);
        return res.status(200).json({
            success: true,
            message: `Department ${department.isActive ? "reactivated" : "deactivated"} successfully`,
            department,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};