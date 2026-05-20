// challanHead.api.js

import { http } from "./apiClient.js";

// ─────────────────────────────────────────────
// Get All Challan Heads
// ─────────────────────────────────────────────
export const getAllChallanHead = () =>
    http.get("/challanHeads");

// ─────────────────────────────────────────────
// Get Challan Head By ID
// ─────────────────────────────────────────────
export const getChallanHeadById = (id) =>
    http.get(`/challanHeads/${id}`);

// ─────────────────────────────────────────────
// Create Challan Head
// ─────────────────────────────────────────────
export const createChallanHead = (data) =>
    http.post("/challanHeads/create", data);

// ─────────────────────────────────────────────
// Update Challan Head
// ─────────────────────────────────────────────
export const updateChallanHead = (
    id,
    data,
) =>
    http.put(
        `/challanHeads/update/${id}`,
        data,
    );

// ─────────────────────────────────────────────
// Delete Challan Head
// ─────────────────────────────────────────────
export const deleteChallanHead = (id) =>
    http.delete(
        `/challanHeads/delete/${id}`,
    );