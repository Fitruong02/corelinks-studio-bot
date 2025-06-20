import dotenv from 'dotenv';

dotenv.config();

export interface FeatureFlags {
  ticketSystem: boolean;
  paymentSystem: boolean;
  voiceManagement: boolean;
  moderation: boolean;
  analytics: boolean;
  alertSystem: boolean;
  roleManagement: boolean;
  autoModeration: boolean;
  inviteTracking: boolean;
  ratingSystem: boolean;
}

export interface AutoSetupConfig {
  autoCreateChannels: boolean;
  autoCreateRoles: boolean;
  autoSetupPermissions: boolean;
}

export class FeatureManager {
  private static features: FeatureFlags = {
    ticketSystem: process.env.ENABLE_TICKET_SYSTEM === 'true',
    paymentSystem: process.env.ENABLE_PAYMENT_SYSTEM === 'true',
    voiceManagement: process.env.ENABLE_VOICE_MANAGEMENT === 'true',
    moderation: process.env.ENABLE_MODERATION === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    alertSystem: process.env.ENABLE_ALERT_SYSTEM === 'true',
    roleManagement: process.env.ENABLE_ROLE_MANAGEMENT === 'true',
    autoModeration: process.env.ENABLE_AUTO_MODERATION === 'true',
    inviteTracking: process.env.ENABLE_INVITE_TRACKING === 'true',
    ratingSystem: process.env.ENABLE_RATING_SYSTEM === 'true'
  };

  private static autoSetup: AutoSetupConfig = {
    autoCreateChannels: process.env.AUTO_CREATE_CHANNELS === 'true',
    autoCreateRoles: process.env.AUTO_CREATE_ROLES === 'true',
    autoSetupPermissions: process.env.AUTO_SETUP_PERMISSIONS === 'true'
  };

  static isEnabled(feature: keyof FeatureFlags): boolean {
    return this.features[feature];
  }

  static getFeatures(): FeatureFlags {
    return { ...this.features };
  }

  static getAutoSetupConfig(): AutoSetupConfig {
    return { ...this.autoSetup };
  }

  static setFeature(feature: keyof FeatureFlags, enabled: boolean): void {
    this.features[feature] = enabled;
  }

  static getEnabledFeatures(): string[] {
    return Object.entries(this.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);
  }

  static getDisabledFeatures(): string[] {
    return Object.entries(this.features)
      .filter(([, enabled]) => !enabled)
      .map(([feature]) => feature);
  }
}