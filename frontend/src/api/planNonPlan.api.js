import { http } from "./apiClient";

export const createPlanNonPlan = (payload) =>
    http.post("/planNonPlan/create", payload);

export const getAllPlanNonPlan = () =>
    http.get("/planNonPlan");

export const updatePlanNonPlan = (id, payload) =>
    http.put(`/planNonPlan/${id}`, payload);

// ✅ FIX: was http.delete — backend uses PUT toggle pattern
export const deletePlanNonPlan = (id) =>
    http.put(`/planNonPlan/${id}/toggle`);