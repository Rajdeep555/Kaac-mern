import { http } from "./apiClient.js";

export const getGeneratedCounterfoilNo = () => {
    return http.get("/counterfoil/generate");
};