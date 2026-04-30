export interface User {
  id: number;
  login: string;
  username: string;
}

export interface AuthResponse {
  status: string;
  token?: {
    access_token: string;
  };
  id: number;
  login: string;
  username: string;
}

export interface CheckinResponse {
  success: boolean;
  message?: string;
  res?: {
    createdAt: string;
    checkpoint: {
      name: string;
    };
  };
}

export interface OfflineCheckin {
  id: string;
  userId: number;
  checkpointCardNum: string;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "error" | "warn";
  message: string;
  data?: any;
  error?: any;
}

export interface CheckinLog {
  id: string;
  userId: number;
  username: string;
  checkpointName: string;
  checkpointCardNum: string;
  timestamp: number;
  status: "success" | "offline" | "failed";
  synced: boolean;
}

export interface Translation {
  [key: string]: string;
}

export type LanguageCode = "uz" | "ru" | "uz_cyrl";
