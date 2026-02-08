import { http } from "./apiClient.js";

export const getGeneratedChallanNo = (type) => http.get("/challan/next", {
    params: { type },
});
