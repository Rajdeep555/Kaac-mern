import logger from "../../utils/logger.js";
import { createDepartmentSchema } from "./department.schema.js"
import { createDepartment, getAllDepartment } from "./department.service.js";

export const create = async (req, res) => {
    try {
        const data = createDepartmentSchema.safeParse(req.body);

        const department = await createDepartment(data);

        return res.status(201).json({
            message: "Department created successfully",
            success: true,
            department: {
                id: department.id,
                name: department.name,
                code: department.code,
                sector: department.sector,
                isActive: department.isActive
            }
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false
        })
    }
}

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
        res.status(500).json({ error: "Failed to fetch departments" });
    }
};