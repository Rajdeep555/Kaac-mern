import { createPlanNonPlanSchema } from "./planNonPlan.schema.js"
import { createPlanNonPlan, getAllPlanNonPlans } from "./planNonPlan.service.js";

export const create = async (req, res) => {
    try {
        const result = createPlanNonPlanSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.errors,
            });
        }

        const data = result.data;

        const planNonPlan = await createPlanNonPlan(data);

        return res.status(201).json({
            message: "Plan non plan created successfully",
            success: true,
            planNonPlan: {
                id: planNonPlan.id,
                name: planNonPlan.name,
                sector: planNonPlan.sector,
                isActive: planNonPlan.isActive,
            },
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false,
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const planNonPlans = await getAllPlanNonPlans();

        return res.status(200).json({
            message: "Plan non plan fetched successfully",
            success: true,
            planNonPlans
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false
        })
    }
}