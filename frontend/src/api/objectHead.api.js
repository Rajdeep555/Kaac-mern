import { http } from "./apiClient";

export const getAllObjectHead = () => http.get("/objectHead");

export const createObjectHead = (data) =>
    http.post("/objectHead/create", data);