import {
    createChallan,
    getAllChallans,
    getChallanById,
    updateChallan,
} from "./challan.service.js";


export const createChallanController = async (req, res) => {
    try {
        const challan = await createChallan({
            ...req.body,
            cashierId: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Challan created successfully",
            data: challan,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create challan",
            error: error.message,
        });
    }
};


export const updateChallanController = async (req, res) => {
    try {
        const updated = await updateChallan(
            req.params.id,
            req.body,
            req.user.id,
            req.user.role
        );

        return res.status(200).json({
            success: true,
            message: "Challan updated successfully",
            data: updated,
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message,
        });
    }
};

export const getChallanByIdController = async (req, res) => {
    try {
        const challan = await getChallanById(
            req.params.id,
            req.user.id,
            req.user.role
        );

        return res.status(200).json({
            success: true,
            data: challan,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};


export const getAllChallansController = async (req, res) => {
    try {
        const { page, limit, departmentId, challanType } = req.query;

        const result = await getAllChallans({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            departmentId,
            challanType,
            userId: req.user.id,
            role: req.user.role,
        });

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

