import {
    createStateChallanService,
    getAllStateChallanService,
    getStateChallanByIdService,
    updateStateChallanService,
    deleteStateChallanService,
} from "./stateChallan.service.js";
import { stateChallanSchema, updateStateChallanSchema } from "./stateChallan.schema.js";

//  Create
export const createStateChallan = async (req, res) => {
    try {
        const parsed = stateChallanSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const challan = await createStateChallanService({
            ...parsed.data,
            userId: req.user.id,
        });

        return res.status(201).json({ success: true, data: challan });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


//  Get All
export const getAllStateChallan = async (req, res) => {
    try {
        const challans = await getAllStateChallanService();
        return res.status(200).json({ success: true, data: challans });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//  Get By ID
export const getStateChallanById = async (req, res) => {
    try {
        const challan = await getStateChallanByIdService(req.params.id);
        return res.status(200).json({ success: true, data: challan });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

//  Update
export const updateStateChallan = async (req, res) => {
    try {
        const parsed = updateStateChallanSchema.safeParse({
            ...req.body,
            id: req.params.id,
        });
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const { id, ...data } = parsed.data;
        const challan = await updateStateChallanService(id, data);
        return res.status(200).json({ success: true, data: challan });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//  Delete
export const deleteStateChallan = async (req, res) => {
    try {
        await deleteStateChallanService(req.params.id);
        return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
