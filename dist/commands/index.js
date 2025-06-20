"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandLoader = void 0;
const logger_1 = require("@utils/logger");
const features_1 = require("../config/features");
const ticket_1 = require("./ticket");
const payment_1 = require("./payment");
const moderation_1 = require("./moderation");
const voice_1 = require("./voice");
const alert_1 = require("./alert");
const role_1 = require("./role");
class CommandLoader {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('CommandLoader');
    }
    async loadCommands() {
        try {
            const allCommands = [];
            if (features_1.FeatureManager.isEnabled('ticketSystem')) {
                allCommands.push(...ticket_1.ticketCommands);
                this.logger.debug('Loaded ticket commands');
            }
            if (features_1.FeatureManager.isEnabled('paymentSystem')) {
                allCommands.push(...payment_1.paymentCommands);
                this.logger.debug('Loaded payment commands');
            }
            if (features_1.FeatureManager.isEnabled('moderation')) {
                allCommands.push(...moderation_1.moderationCommands);
                this.logger.debug('Loaded moderation commands');
            }
            if (features_1.FeatureManager.isEnabled('voiceManagement')) {
                allCommands.push(...voice_1.voiceCommands);
                this.logger.debug('Loaded voice commands');
            }
            if (features_1.FeatureManager.isEnabled('alertSystem')) {
                allCommands.push(...alert_1.roleCommands);
                this.logger.debug('Loaded alert commands');
            }
            if (features_1.FeatureManager.isEnabled('roleManagement')) {
                allCommands.push(...role_1.roleCommands);
                this.logger.debug('Loaded role commands');
            }
            for (const command of allCommands) {
                if (command.data && command.execute) {
                    this.bot.commands.set(command.data.name, command);
                    this.logger.debug(`Registered command: ${command.data.name}`);
                }
                else {
                    this.logger.warn('Invalid command structure detected:', command);
                }
            }
            this.logger.info(`Successfully loaded ${this.bot.commands.size} commands`);
        }
        catch (error) {
            this.logger.error('Failed to load commands:', error);
            throw error;
        }
    }
    getCommand(name) {
        return this.bot.commands.get(name);
    }
    getAllCommands() {
        return Array.from(this.bot.commands.values());
    }
    getEnabledFeatures() {
        return features_1.FeatureManager.getEnabledFeatures();
    }
    getDisabledFeatures() {
        return features_1.FeatureManager.getDisabledFeatures();
    }
}
exports.CommandLoader = CommandLoader;
//# sourceMappingURL=index.js.map