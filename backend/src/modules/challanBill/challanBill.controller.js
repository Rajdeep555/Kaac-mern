import { createChallanService, deleteChallanService, getChallanByIdService, getChallansByCashierService, getChallansByExpenditureService, updateChallanService } from "./challanBill.service.js";

/* ================= GET ALL CHALLANS (cashier-wise) ================= */
export const getChallansByCashier = async (req, res) => {
    try {
        const cashierId = req.user.id; // from JWT middleware

        const challans = await getChallansByCashierService(cashierId);

        res.status(200).json({
            success: true,
            count: challans.length,
            data: challans,
        });
    } catch (error) {
        console.error("getChallansByCashier error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch challans",
        });
    }
};

/* ================= GET SINGLE CHALLAN BY ID ================= */
export const getChallanById = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const { id } = req.params;

        const challan = await getChallanByIdService(id, cashierId);

        res.status(200).json({
            success: true,
            data: challan,
        });
    } catch (error) {
        console.error("getChallanById error:", error);
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || "Failed to fetch challan",
        });
    }
};

/* ================= GET CHALLANS BY EXPENDITURE ID ================= */
export const getChallansByExpenditure = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const { expenditureId } = req.params;

        const challans = await getChallansByExpenditureService(expenditureId, cashierId);

        res.status(200).json({
            success: true,
            count: challans.length,
            data: challans,
        });
    } catch (error) {
        console.error("getChallansByExpenditure error:", error);
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || "Failed to fetch challans",
        });
    }
};

/* ================= CREATE CHALLAN ================= */
export const createChallan = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const payload = req.body;

        const challan = await createChallanService(cashierId, payload);

        res.status(201).json({
            success: true,
            message: "Challan created successfully",
            data: challan,
        });
    } catch (error) {
        console.error("createChallan error:", error);
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || "Failed to create challan",
        });
    }
};

/* ================= UPDATE CHALLAN ================= */
export const updateChallan = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const { id } = req.params;
        const payload = req.body;

        const updated = await updateChallanService(id, cashierId, payload);

        res.status(200).json({
            success: true,
            message: "Challan updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("updateChallan error:", error);
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || "Failed to update challan",
        });
    }
};

/* ================= DELETE CHALLAN (soft delete) ================= */
export const deleteChallan = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const { id } = req.params;

        await deleteChallanService(id, cashierId);

        res.status(200).json({
            success: true,
            message: "Challan deleted successfully",
        });
    } catch (error) {
        console.error("deleteChallan error:", error);
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || "Failed to delete challan",
        });
    }
};
