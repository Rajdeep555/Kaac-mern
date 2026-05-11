import { http } from "./apiClient.js";

export const getAllObjectHead = () => http.get("/objectHead");
export const createObjectHead = (data) => http.post("/objectHead/create", data);
export const updateObjectHead = (id, data) => http.put(`/objectHead/${id}`, data);
export const toggleObjectHeadStatus = (id) => http.put(`/objectHead/${id}/toggle`);       