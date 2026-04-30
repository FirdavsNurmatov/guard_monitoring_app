import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckinLog, OfflineCheckin, User } from "../types";

export const StorageService = {
  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------

  async setOrganizationId(organization_id: string) {
    await AsyncStorage.setItem("organization_id", organization_id);
  },

  async getOrganizationId(): Promise<string | null> {
    return AsyncStorage.getItem("organization_id");
  },

  async removeOrganizationId() {
    await AsyncStorage.removeItem("organization_id");
  },

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  async setAccessToken(token: string) {
    await AsyncStorage.setItem("access_token", token);
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem("access_token");
  },

  async removeAccessToken() {
    await AsyncStorage.removeItem("access_token");
  },

  // ---------------------------------------------------------------------------
  // User
  // ---------------------------------------------------------------------------

  async setUser(user: User) {
    await AsyncStorage.setItem("id", user.id.toString());
    await AsyncStorage.setItem("login", user.login);
    await AsyncStorage.setItem("username", user.username);
  },

  async getUser(): Promise<User | null> {
    const id = await AsyncStorage.getItem("id");
    const login = await AsyncStorage.getItem("login");
    const username = await AsyncStorage.getItem("username");

    if (id && login && username) {
      return { id: parseInt(id), login, username };
    }
    return null;
  },

  async removeUser() {
    await AsyncStorage.multiRemove(["id", "login", "username"]);
  },

  // ---------------------------------------------------------------------------
  // Selected user for PIN
  // ---------------------------------------------------------------------------

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
    await AsyncStorage.multiRemove(["selectedLogin", "selectedUsername"]);
  },

  // ---------------------------------------------------------------------------
  // Last log
  // ---------------------------------------------------------------------------

  async setLastLog(log: string) {
    await AsyncStorage.setItem("lastLog", log);
  },

  async getLastLog(): Promise<string | null> {
    return AsyncStorage.getItem("lastLog");
  },

  async removeLastLog() {
    await AsyncStorage.removeItem("lastLog");
  },

  // ---------------------------------------------------------------------------
  // Offline checkins
  // ✅ id qo'shildi — sync da qaysinisini o'chirishni bilamiz
  // ---------------------------------------------------------------------------

  async storeOfflineCheckin(data: OfflineCheckin): Promise<void> {
    try {
      const existing = await this.getOfflineCheckins();
      existing.push(data);

      // Oxirgi 100 ta saqlanadi
      const trimmed = existing.slice(-100);
      await AsyncStorage.setItem(
        "offline_checkin_data",
        JSON.stringify(trimmed),
      );
    } catch (err) {
      console.error("Failed to store offline checkin:", err);
    }
  },

  async getOfflineCheckins(): Promise<OfflineCheckin[]> {
    try {
      const json = await AsyncStorage.getItem("offline_checkin_data");
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  // ✅ Yangi — sync bo'lgandan keyin bitta offline checkinni o'chirish
  async removeOfflineCheckin(id: string): Promise<void> {
    try {
      const existing = await this.getOfflineCheckins();
      const filtered = existing.filter((item) => item.id !== id);
      await AsyncStorage.setItem(
        "offline_checkin_data",
        JSON.stringify(filtered),
      );
    } catch (err) {
      console.error("Failed to remove offline checkin:", err);
    }
  },

  async clearOfflineCheckins(): Promise<void> {
    await AsyncStorage.removeItem("offline_checkin_data");
  },

  // ---------------------------------------------------------------------------
  // Checkin logs
  // ---------------------------------------------------------------------------

  async getCheckinLogs(): Promise<CheckinLog[]> {
    try {
      const json = await AsyncStorage.getItem("checkin_logs");
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async addCheckinLog(log: CheckinLog): Promise<void> {
    try {
      const logs = await this.getCheckinLogs();
      logs.unshift(log); // Boshiga qo'shamiz
      const trimmed = logs.slice(0, 100);
      await AsyncStorage.setItem("checkin_logs", JSON.stringify(trimmed));
    } catch (err) {
      console.error("Failed to add checkin log:", err);
    }
  },

  // ✅ Yangi — offline log sync bo'lganda yangilanadi
  async updateCheckinLogSynced(
    id: string,
    checkpointName?: string,
  ): Promise<void> {
    try {
      const logs = await this.getCheckinLogs();
      const updated = logs.map((log) =>
        log.id === id
          ? {
              ...log,
              status: "success" as const,
              synced: true,
              // ✅ Server dan nom kelsa yangilanadi, kelmasa Unknown qoladi
              checkpointName: checkpointName || log.checkpointName,
            }
          : log,
      );
      await AsyncStorage.setItem("checkin_logs", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to update checkin log:", err);
    }
  },

  async clearCheckinLogs(): Promise<void> {
    await AsyncStorage.removeItem("checkin_logs");
  },

  // ---------------------------------------------------------------------------
  // Clear
  // ✅ clearAll da offline checkinlar saqlanadi — logout da yo'qolmaydi
  // ---------------------------------------------------------------------------

  async clearAuthData(): Promise<void> {
    await this.removeAccessToken();
    await this.removeUser();
    await this.removeLastLog();
    await this.removeSelectedUser();
  },

  async clearAll(): Promise<void> {
    await this.clearAuthData();
    // ✅ Offline checkinlar o'chirilmaydi — keyingi login da sync bo'ladi
    // await this.clearOfflineCheckins();
    await this.clearCheckinLogs();
  },
};
