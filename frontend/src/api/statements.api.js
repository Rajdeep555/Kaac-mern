import { http } from "./apiClient.js";

export const getStatement7 = (params) => {
    return http.get("/statements/statement7", { params });
};
export const getStatement6 = (params) => {
    return http.get("/statements/statement6", { params });
};

export const getStatement5 = (params) => {
    return http.get("/statements/statement5", { params });
};

export const getStatement4 = (params) => {
    return http.get("/statements/statement4", { params });
};

export const getStatement2 = (params) => {
    return http.get("/statements/statement2", { params });
};

export const getStatement3Debt = (params) => {
    return http.get("/statements/statement3/debt", { params });
};

export const getStatement3WaysAndMeans = (params) => {
    return http.get("/statements/statement3/ways-and-means", { params });
};

export const getStatement1 = (params) => {
    return http.get("/statements/statement1", { params });
};



