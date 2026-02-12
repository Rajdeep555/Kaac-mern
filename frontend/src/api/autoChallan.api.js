import { http } from "./apiClient.js";

export const getGeneratedChallanNo = (type) => http.get("/challan/next", {
    params: { type },
});


export const getGeneratedVoucherNo = (type) => http.get("/expenditure/next", {
    params: { type },
});