
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../services/api";

interface User {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    initialized: boolean;
    error: string | null;
}

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user: User & { _id?: string };
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    initialized: false,
    error: null,
};

export const loginUser = createAsyncThunk<
    AuthResponse,
    LoginData,
    { rejectValue: string }
>(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post<AuthResponse>(
                "/auth/login",
                credentials
            );

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data?.message || "Login failed"
                );
            }

            return rejectWithValue("Something went wrong");
        }
    }
);

export const registerUser = createAsyncThunk<
    AuthResponse,
    RegisterData,
    { rejectValue: string }
>(
    "auth/register",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post<AuthResponse>(
                "/auth/register",
                userData
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data?.message || "Registration failed"
                );
            }

            return rejectWithValue("Something went wrong");
        }
    }
);

export const logoutUser = createAsyncThunk<
    void,
    void,
    { rejectValue: string }
>(
    "auth/logout",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            await api.post("/auth/logout");
            dispatch(logout());
        } catch (error) {
            // Clear the local session even if the server request fails.
            dispatch(logout());

            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data?.message || "Logout request failed"
                );
            }

            return rejectWithValue("Something went wrong during logout");
        }
    }
);

export const restoreSession = createAsyncThunk<
    User,
    void,
    { rejectValue: string }
>(
    "auth/restoreSession",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get<{ user: User }>("/auth/profile");
            return response.data.user;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data?.message || "Session expired"
                );
            }

            return rejectWithValue("Unable to restore session");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem("token");
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                const user = action.payload.user;

                state.user = {
                    ...user,
                    id: user.id || user._id || "",
                };
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
            })

            // Registration
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Registration failed";
            })
            .addCase(restoreSession.pending, (state) => {
            state.initialized = false;
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.initialized = true;
            })
            .addCase(restoreSession.rejected, (state) => {
                localStorage.removeItem("token");
                state.user = null;
                state.isAuthenticated = false;
                state.initialized = true;
            });
    },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
