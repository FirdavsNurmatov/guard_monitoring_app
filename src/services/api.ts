import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../constants/config";
import { AuthResponse, CheckinResponse, User } from "../types";

export const ApiService = {
  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries: number = CONFIG.RETRY.MAX_ATTEMPTS,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
      const headers: Record<string, string> =
        (options.headers as Record<string, string>) || {};
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Auto-add organization_id to GET requests if not already present
      if (!options.method || options.method === "GET") {
        const organization_id = await AsyncStorage.getItem("organization_id");
        if (organization_id && !url.includes("organization_id")) {
          const separator = url.includes("?") ? "&" : "?";
          url = `${url}${separator}organization_id=${encodeURIComponent(organization_id)}`;
          console.log("Auto-added organization_id to request", {
            organization_id,
            url,
          });
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (
        retries > 0 &&
        (error.name === "AbortError" || error.message?.includes("network"))
      ) {
        console.warn(
          `Retry attempt ${CONFIG.RETRY.MAX_ATTEMPTS - retries + 1} for ${url}`,
        );
        await this.delay(CONFIG.RETRY.DELAY_MS);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  },

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async get(endpoint: string): Promise<any> {
    const url = CONFIG.API_BASE_URL + endpoint;
    console.log("GET request", url);

    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - auto logout
        if (response.status === 401) {
          console.error("401 Unauthorized - logging out");
          // Clear all auth data
          await AsyncStorage.multiRemove([
            "id",
            "login",
            "username",
            "lastLog",
            "selectedLogin",
            "selectedUsername",
            "access_token",
            "organization_id",
          ]);
          throw new Error("Session expired - logged out");
        }
        throw new Error(
          `HTTP ${response.status}: ${data.message || "Unknown error"}`,
        );
      }

      console.log("GET success", { url, status: response.status });
      return data;
    } catch (error) {
      console.error("GET failed", error);
      throw error;
    }
  },

  async post(endpoint: string, body: any): Promise<any> {
    const url = CONFIG.API_BASE_URL + endpoint;
    console.log("POST request", { url, body });

    try {
      const response = await this.fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - auto logout
        if (response.status === 401) {
          console.error("401 Unauthorized - logging out");
          // Clear all auth data
          await AsyncStorage.multiRemove([
            "id",
            "login",
            "username",
            "lastLog",
            "selectedLogin",
            "selectedUsername",
            "access_token",
            "organization_id",
          ]);
          throw new Error("Session expired - logged out");
        }
        throw new Error(
          `HTTP ${response.status}: ${data.message || "Unknown error"}`,
        );
      }

      console.log("POST success", { url, status: response.status });
      return data;
    } catch (error) {
      console.error("POST failed", error);
      throw error;
    }
  },

  // API specific methods
  async getGuardList(organization_id: string): Promise<User[]> {
    return this.get(
      `${CONFIG.ENDPOINTS.GUARD_LIST}?organization_id=${organization_id}`,
    );
  },

  async authGuard(login: string, password: string): Promise<AuthResponse> {
    return this.post(CONFIG.ENDPOINTS.AUTH_GUARD, { login, password });
  },

  async checkin(
    userId: number,
    checkpointCardNum: string,
    latitude?: number,
    longitude?: number,
  ): Promise<CheckinResponse> {
    const body: any = { userId, checkpointCardNum };
    if (latitude !== undefined && longitude !== undefined) {
      body.latitude = latitude;
      body.longitude = longitude;
    }
    return this.post(CONFIG.ENDPOINTS.CHECKIN, body);
  },

  async updateLocation(
    userId: number,
    latitude: number,
    longitude: number,
  ): Promise<any> {
    return this.post("/api/v1/admin/gps", {
      userId,
      location: {
        lat: latitude,
        lng: longitude,
      },
    });
  },
};
