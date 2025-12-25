import { createExpenditureTypeSchema } from "./expenditureType.schema.js"
import { createExpenditureType } from "./expenditureType.service.js";

export const create = async (req, res) => {
    try {
        const data = createExpenditureTypeSchema.safeParse(req.body);

        const expenditureType = await createExpenditureType(data);

        return res.status(201).json({
            success: true,
            message: "Expenditure type created successfully",
            expenditureType: {
                id: expenditureType.id,
                name: expenditureType.name,
                sector: expenditureType.sector,
                isActive: expenditureType.isActive
            }
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}