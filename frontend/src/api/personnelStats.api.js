import { http } from "./apiClient";

export const getPersonnelStats = () => http.get("/dashboard/personnal-stats");
