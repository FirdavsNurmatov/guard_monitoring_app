import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckinLog, OfflineCheckin, User } from "../types";

export const StorageService = {
  // Organization
  async setOrganizationId(organization_id: string) {
    await AsyncStorage.setItem("organization_id", organization_id);
  },

  async getOrganizationId(): Promise<string | null> {
    return AsyncStorage.getItem("organization_id");
  },

  async removeOrganizationId() {
    await AsyncStorage.removeItem("organization_id");
  },

  // Auth
  async setAccessToken(token: string) {
    await AsyncStorage.setItem("access_token", token);
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem("access_token");
  },

  async removeAccessToken() {
    await AsyncStorage.removeItem("access_token");
  },

  // User
  async setUser(user: User) {
    console.log("StorageService.setUser:", user);
    await AsyncStorage.setItem("id", user.id.toString());
    await AsyncStorage.setItem("login", user.login);
    await AsyncStorage.setItem("username", user.username);
    console.log("StorageService.setUser: user stored successfully");
  },

  async getUser(): Promise<User | null> {
    const id = await AsyncStorage.getItem("id");
    const login = await AsyncStorage.getItem("login");
    const username = await AsyncStorage.getItem("username");

    console.log("StorageService.getUser:", { id, login, username });

    if (id && login && username) {
      return { id: parseInt(id), login, username };
    }
    return null;
  },

  async removeUser() {
    await AsyncStorage.removeItem("id");
    await AsyncStorage.removeItem("login");
    await AsyncStorage.removeItem("username");
  },

  // Selected user for PIN
  async setSelectedUser(login: string, username: string) {
    await AsyncStorage.setItem("selectedLogin", login);
    await AsyncStorage.setItem("selectedUsername", username);
  },

  async getSelectedUser(): Promise<{ login: string; username: string } | null> {
    const login = await AsyncStorage.getItem("selectedLogin");
    const username = await AsyncStorage.getItem("selectedUsername");

    if (login && username) {
      return { login, username };
    }
    return null;
  },

  async removeSelectedUser() {
    await AsyncStorage.removeItem("selectedLogin");
    await AsyncStorage.removeItem("selectedUsername");
  },

  // Last log
  async setLastLog(log: string) {
    await AsyncStorage.setItem("lastLog", log);
  },

  async getLastLog(): Promise<string | null> {
    return AsyncStorage.getItem("lastLog");
  },

  async removeLastLog() {
    await AsyncStorage.removeItem("lastLog");
  },

  // Offline checkin data
  async storeOfflineCheckin(data: OfflineCheckin) {
    try {
      const offlineDataJson = await AsyncStorage.getItem(
        "offline_checkin_data",
      );
      const offlineData = offlineDataJson ? JSON.parse(offlineDataJson) : [];
      offlineData.push(data);

      // Keep only last 100 records
      if (offlineData.length > 100) {
        offlineData.shift();
      }

      await AsyncStorage.setItem(
        "offline_checkin_data",
        JSON.stringify(offlineData),
      );
    } catch (err) {
      console.error("Failed to store offline checkin:", err);
    }
  },

  async getOfflineCheckins(): Promise<OfflineCheckin[]> {
    try {
      const offlineDataJson = await AsyncStorage.getItem(
        "offline_checkin_data",
      );
      return offlineDataJson ? JSON.parse(offlineDataJson) : [];
    } catch (err) {
      return [];
    }
  },

  async clearOfflineCheckins() {
    await AsyncStorage.removeItem("offline_checkin_data");
  },

  // Checkin logs
  async getCheckinLogs(): Promise<CheckinLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem("checkin_logs");
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (err) {
      console.error("Failed to get checkin logs:", err);
      return [];
    }
  },

  async addCheckinLog(log: CheckinLog): Promise<void> {
    try {
      const logs = await this.getCheckinLogs();
      logs.unshift(log); // Add to beginning
      // Keep only last 100 logs
      const trimmedLogs = logs.slice(0, 100);
      await AsyncStorage.setItem("checkin_logs", JSON.stringify(trimmedLogs));
    } catch (err) {
      console.error("Failed to add checkin log:", err);
    }
  },

  async clearCheckinLogs(): Promise<void> {
    await AsyncStorage.removeItem("checkin_logs");
  },

  // Clear all auth data
  async clearAuthData() {
    await this.removeAccessToken();
    await this.removeUser();
    await this.removeLastLog();
    await this.removeSelectedUser();
  },

  // Clear all data (logout) - keep organization_id
  async clearAll() {
    await this.clearAuthData();
    // await this.removeOrganizationId(); // Keep organization_id for re-login
    await this.clearOfflineCheckins();
    await this.clearCheckinLogs();
  },
};
