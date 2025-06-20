"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureManager = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class FeatureManager {
    static features = {
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
    static autoSetup = {
        autoCreateChannels: process.env.AUTO_CREATE_CHANNELS === 'true',
        autoCreateRoles: process.env.AUTO_CREATE_ROLES === 'true',
        autoSetupPermissions: process.env.AUTO_SETUP_PERMISSIONS === 'true'
    };
    static isEnabled(feature) {
        return this.features[feature];
    }
    static getFeatures() {
        return { ...this.features };
    }
    static getAutoSetupConfig() {
        return { ...this.autoSetup };
    }
    static setFeature(feature, enabled) {
        this.features[feature] = enabled;
    }
    static getEnabledFeatures() {
        return Object.entries(this.features)
            .filter(([, enabled]) => enabled)
            .map(([feature]) => feature);
    }
    static getDisabledFeatures() {
        return Object.entries(this.features)
            .filter(([, enabled]) => !enabled)
            .map(([feature]) => feature);
    }
}
exports.FeatureManager = FeatureManager;
//# sourceMappingURL=features.js.map