import { http } from "./apiClient.js";

export const getExpenditureTypes = () =>
    http.get("/expenditure-type");

export const createExpenditureType = (data) =>
    http.post("/expenditure-type/create", data);

export const updateExpenditureType = (id, data) =>
    http.put(`/expenditure-type/${id}`, data);

export const toggleExpenditureTypeStatus = (id) =>
    http.put(`/expenditure-type/${id}/toggle`);