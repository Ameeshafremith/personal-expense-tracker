
import axios, {
    type InternalAxiosRequestConfig,
    type AxiosError,
} from "axios";

const baseURL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach the access token to outgoing requests.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Track refresh requests to prevent multiple simultaneous refresh calls.
let isRefreshing = false;

let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((request) => {
        if (error) {
            request.reject(error);
        } else if (token) {
            request.resolve(token);
        }
    });

    failedQueue = [];
};

// Automatically refresh an expired access token.
api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as
            | (InternalAxiosRequestConfig & { _retry?: boolean })
            | undefined;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/register") ||
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/logout")
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Queue requests while another refresh is in progress.
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        isRefreshing = true;

        try {
            // Use plain axios so this request doesn't trigger this interceptor.
            const response = await axios.post(
                `${baseURL}/auth/refresh`,
                {},
                { withCredentials: true }
            );

            const newToken = response.data.token;

            if (!newToken) {
                throw new Error("No access token received from refresh endpoint");
            }

            localStorage.setItem("token", newToken);

            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);

            localStorage.removeItem("token");

            // Redirect only when the user is not already on an authentication page.
            if (
                window.location.pathname !== "/login" &&
                window.location.pathname !== "/register"
            ) {
                window.location.assign("/login");
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
