import { http } from "./apiClient.js";

export const getUsers = () => http.get("/users");
export const createUser = (data) => http.post("/users", data);
export const updateUser = (id, data) => http.put(`/users/${id}`, data);
export const toggleUserStatus = (id) => http.put(`/users/${id}/toggle`);