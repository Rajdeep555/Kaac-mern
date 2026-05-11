import { createPlanNonPlanSchema, updatePlanNonPlanSchema } from "./planNonPlan.schema.js";
import {
    createPlanNonPlan,
    getAllPlanNonPlans,
    updatePlanNonPlan,
    togglePlanNonPlanStatus
} from "./planNonPlan.service.js";

export const create = async (req, res) => {
    try {
        const result = createPlanNonPlanSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const planNonPlan = await createPlanNonPlan(result.data);
        return res.status(201).json({
            success: true,
            message: "Plan / Non-Plan created successfully",
            planNonPlan,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAll = async (req, res) => {
    try {
        const planNonPlans = await getAllPlanNonPlans();
        return res.status(200).json({ success: true, planNonPlans });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ NEW
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const result = updatePlanNonPlanSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const planNonPlan = await updatePlanNonPlan(id, result.data);
        return res.status(200).json({
            success: true,
            message: "Plan / Non-Plan updated successfully",
            planNonPlan,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ NEW
export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const planNonPlan = await togglePlanNonPlanStatus(id);
        return res.status(200).json({
            success: true,
            message: `Plan / Non-Plan ${planNonPlan.isActive ? "reactivated" : "deactivated"}`,
            planNonPlan,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};