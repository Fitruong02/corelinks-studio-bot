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
export declare class FeatureManager {
    private static features;
    private static autoSetup;
    static isEnabled(feature: keyof FeatureFlags): boolean;
    static getFeatures(): FeatureFlags;
    static getAutoSetupConfig(): AutoSetupConfig;
    static setFeature(feature: keyof FeatureFlags, enabled: boolean): void;
    static getEnabledFeatures(): string[];
    static getDisabledFeatures(): string[];
}
//# sourceMappingURL=features.d.ts.map