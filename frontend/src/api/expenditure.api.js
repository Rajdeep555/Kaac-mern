import { http } from "./apiClient";

export const createExpenditure = (data) => http.post("/expenditure/create", data);

export const updateExpenditure = (id, data) => http.put(`/expenditure/${id}`, data);

export const getExpenditureById = (id) => http.get(`/expenditure/${id}`);

export const getCashierExpenditures = (params = {}) =>
    http.get("/expenditure/cashier", { params });

export const getAdminExpenditures = (params = {}) => {
    console.log('API Call params:', params); // Debug log
    return http.get("/expenditure/admin", { params });
};

export const deleteExpenditure = async (id) => {
    return http.delete(`/expenditure/${id}`);
};

export const getChequeDetailsApi = (params = {}) => {
    const query = new URLSearchParams();
    if (params.sector) query.append("sector", params.sector);
    if (params.financialYear) query.append("financialYear", params.financialYear);
    if (params.month) query.append("month", params.month);
    return http.get(`/expenditure/cheque-details?${query.toString()}`);
};