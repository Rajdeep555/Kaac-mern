import { http } from "./apiClient.js";

export const createHead = (payload) => http.post("/heads/create", payload)

export const updateHead = async (id, data) => {
    return http.put(`/heads/${id}`, data);
};

export const deleteHead = async (id) => {
    return http.put(`/heads/${id}/deactivate`, { isActive: false });
};

export const getHeads = (sector) => http.get("/heads", {
    params: { sector },
});

export const getHeadHierarchy = (params) =>
    http.get("/heads/hierarchy", { params });