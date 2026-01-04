import { http } from "./apiClient.js";

export const getDDOs = () => http.get("/ddo");