import { http } from "./apiClient.js";

export const getFormOne = (params) => {
    return http.get("/formOne", { params });
};

export const saveCashbookSummary = (data) =>
    http.post("/formOne/cashbook-summary", data);