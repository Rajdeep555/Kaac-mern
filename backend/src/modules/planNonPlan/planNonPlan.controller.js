import { createPlanNonPlanSchema } from "./planNonPlan.schema.js"
import { createPlanNonPlan } from "./planNonPlan.service.js";

export const create = async (req, res) => {
    try {
        const data = createPlanNonPlanSchema.safeParse(req.body);

        const planNonPlan = await createPlanNonPlan(data);

        return res.status(201).json({
            message: "Plan non plan created successfully",
            success: true,
            planNonPlan: {
                id: planNonPlan.id,
                name: planNonPlan.name,
                sector: planNonPlan.sector,
                isActive: planNonPlan.isActive
            }
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false
        })
    }
}