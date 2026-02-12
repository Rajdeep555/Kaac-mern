import { http } from "./apiClient.js";

export const getGrants = () => http.get("/grants");