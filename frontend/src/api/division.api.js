import { http } from "./apiClient.js";

export const getDivisions = () => http.get("/division");
export const createDivision = (data) => http.post("/division/create", data);
export const updateDivision = (id, data) => http.put(`/division/${id}`, data);
export const toggleDivisionStatus = (id) => http.put(`/division/${id}/toggle`); // ✅ was missing