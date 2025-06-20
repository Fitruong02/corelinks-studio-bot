// ===== src/types/config.ts =====
export interface BotConfig {
  discord: DiscordConfig;
  database: DatabaseConfig;
  payos: PayOSConfig;
  google: GoogleConfig;
  roles: RoleConfig;
  channels: ChannelConfig;
  settings: BotSettings;
}

export interface DiscordConfig {
  token: string;
  clientId: string;
  guildId: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface PayOSConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

export interface GoogleConfig {
  sheetsId: string;
  credentials: string;
}

export interface RoleConfig {
  founder: string;
  staff: string;
  customer: string;
  discordServiceStaff: string;
  minecraftServiceStaff: string;
  gameServiceStaff: string;
}

export interface ChannelConfig {
  ticketRequests: string;
  ticketLogs: string;
  paymentLogs: string;
  voiceLogs: string;
  modLogs: string;
  automodLogs: string;
  joinLeave: string;
  inviteLogs: string;
  cmdLogs: string;
  alerts: string;
  voiceCreate: string;
  voiceTempCategoryId: string;
  voiceTempCategory: string;
}

export interface BotSettings {
  nodeEnv: string;
  logLevel: string;
  ticketAutoCloseDays: number;
  voiceInactiveMinutes: number;
  paymentTimeoutHours: number;
}
