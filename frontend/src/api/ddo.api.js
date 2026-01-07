import { http } from "./apiClient.js";

export const createDDO = (payload) => http.post("/ddo/create", payload)

export const updateDDO = async (id, data) => {
    return http.put(`/ddo/${id}`, data);
};

export const deleteDDO = async (id) => {
    return http.put(`/ddo/${id}/deactivate`, { isActive: false });
};

export const getDDOs = () => http.get("/ddo");