import { http } from "./apiClient.js";

export const createCashReceipt = (data) => http.post("/cashReceipt/create", data);
export const updateCashReceipt = (id, data) => http.put(`/cashReceipt/update/${id}`, data);
export const getCashReceiptById = (id) => http.get(`/cashReceipt/get/${id}`);
export const getAllCashReceipts = (params) => http.get("/cashReceipt", { params });
export const getCashReceiptByCounterfoil = (counterfoilNo) => http.get(`/cashReceipt/counterfoilNo/${counterfoilNo}`);
export const getPendingReceipts = () => {
    return http.get("/cashReceipt/pending");
};
export const getPendingReceiptsCount = () => {
    return http.get("/cashReceipt/pending/count");
};
