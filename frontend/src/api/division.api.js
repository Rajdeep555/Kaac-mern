import { http } from "./apiClient.js";

export const getDivisions = () => http.get("/division");

export const createDivision = (data) => http.post("/division/create", data);