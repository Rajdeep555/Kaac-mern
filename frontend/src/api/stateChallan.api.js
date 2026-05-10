import { http } from "./apiClient.js";

export const getAllStateChallan = () =>
    http.get("/state-challan");

export const getStateChallanById = (id) =>
    http.get(`/state-challan/${id}`);

export const createStateChallan = (data) =>
    http.post("/state-challan", data);

export const updateStateChallan = (id, data) =>
    http.put(`/state-challan/${id}`, data);

export const deleteStateChallan = (id) =>
    http.delete(`/state-challan/${id}`);