import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:3000/api/v1/",
    // baseURL: "http://13.50.113.43:3000/api/v1/",
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
//     (response) => response,
//     (error) => {
//         if (error.response?.status === 401) {
//             localStorage.removeItem(STORAGE_KEY);

//             // Preventin infinite redirect loop
//             if (window.location.pathname !== "/login") {
//                 window.location.href = "/login";
//             }
//         }

//         return Promise.reject(error);
//     }
// );
