import { http } from "./apiClient.js";

export const createChallan = (payload) => http.post("/challan/create", payload);