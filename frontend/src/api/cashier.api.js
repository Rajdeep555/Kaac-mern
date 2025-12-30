import { http } from "./apiClient";

export const getCashiers = () => {
    return http.get("/cashier");
};

export const createCashier = (payload, token) =>
    http.post("/cashier/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
    });

export const updateCashier = async (id, data) => {
    return api.put(`/cashiers/${id}`, data);
};

export const deleteCashier = async (id) => {
    return api.delete(`/cashiers/${id}`);
};
