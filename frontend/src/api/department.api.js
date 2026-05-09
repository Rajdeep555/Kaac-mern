import { http } from "./apiClient";

export const getAllChallanDepartments = ({ type } = {}) =>
    http.get("/department", {
        params: { type },
    });

export const createDepartment = (data) =>
    http.post("/department/create", data);