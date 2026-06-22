import { http } from "./apiClient.js";

export const getGrants = () => http.get("/grants");
export const createGrant = (data) => http.post("/grants", data);
export const updateGrant = (id, data) => http.put(`/grants/${id}`, data);
export const toggleGrant = (id) => http.patch(`/grants/${id}/toggle`);