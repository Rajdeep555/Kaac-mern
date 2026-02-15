import { http } from "./apiClient.js";

export const createChallan = (payload) => http.post("/challan/create", payload);
export const updateChallan = (id, data) => http.put(`/challan/${id}`, data);
export const getChallanById = (id) => http.get(`/challan/${id}`);
export const getAllChallans = (params) => http.get("/challan", { params });