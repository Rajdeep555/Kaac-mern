import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:3000/api/v1/",
});

const STORAGE_KEY = "app_auth";

http.interceptors.request.use((config) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const { token } = JSON.parse(raw);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch { }
    }
    return config;
});


// http.interceptors.response.use(
//     res => res,
//     err => {
//         if (err.response?.status === 401) {
//             localStorage.removeItem("app_auth");
//             window.location.href = "/login";
//         }
//         return Promise.reject(err);
//     }
// );
