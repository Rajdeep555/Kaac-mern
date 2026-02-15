import { http } from "./apiClient.js";

export const getAllChallanHead = () => http.get("/challanHeads");