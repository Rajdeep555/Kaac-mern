import { http } from "./apiClient.js";

export const getDivisions = () => http.get("/division");
