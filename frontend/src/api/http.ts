import axios, { AxiosError } from "axios";
import { getSession } from "../state/session";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export async function apiRequest<T>(path: string, method: "GET" | "POST" | "PATCH" | "DELETE", payload?: unknown): Promise<T> {
  try {
    const response = await api.request<ApiResponse<T>>({
      url: path,
      method,
      data: payload
    });

    if (!response.data.success) {
      throw new Error(response.data.message ?? response.data.code ?? "Request failed");
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        (error.response?.data as { message?: string; code?: string } | undefined)?.message ??
        (error.response?.data as { message?: string; code?: string } | undefined)?.code ??
        error.message;
      throw new Error(message);
    }

    throw error;
  }
}
