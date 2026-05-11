import { http } from "./apiClient";

export const getAllChallanDepartments = ({ type } = {}) =>
    http.get("/department", { params: { type } });

export const createDepartment = (data) =>
    http.post("/department/create", data);


export const updateDepartment = (id, data) =>
    http.put(`/department/${id}`, data);

export const toggleDepartmentStatus = (id) =>
    http.put(`/department/${id}/toggle`);