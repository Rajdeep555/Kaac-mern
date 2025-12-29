import { createDepartmentSchema } from "./department.schema.js"
import { createDepartment } from "./department.service.js";

export const create = async (data) => {
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