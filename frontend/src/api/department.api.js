import { http } from "./apiClient";

export const getAllChallanDepartments = ({ type }) =>
    http.get("/department", {
        params: { type },
    });