import { http } from "./apiClient";

export const createCashier = (payload, token) =>
    http.post("/cashier/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
