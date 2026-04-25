// API Configuration
export const CONFIG = {
  API_BASE_URL: "https://guard.bgs.uz/api",
  ENDPOINTS: {
    GUARD_LIST: "/api/v1/admin/guardlist",
    AUTH_GUARD: "/api/v1/auth/guard",
    CHECKIN: "/api/v1/admin/checkin",
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
  TIMEOUT_MS: 10000,
  NFC: {
    SCAN_COOLDOWN: 2000, // 2 seconds between scans
    RETRY_INTERVAL: 3000, // 3 seconds
    MAX_RETRY_ATTEMPTS: 10,
  },
  GPS: {
    RETRY_INTERVAL: 3000, // 3 seconds
    MAX_RETRY_ATTEMPTS: 10,
  },
  OFFLINE: {
    MAX_RECORDS: 100,
  },
  CHECKIN: {
    MAX_RETRIES: 5,
    RETRY_DELAY: 3000,
    SUCCESS_MESSAGE_DURATION: 7000,
  },
  isDev: __DEV__,
};
