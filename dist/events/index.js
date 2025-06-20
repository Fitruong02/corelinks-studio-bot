"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLoader = void 0;
const logger_1 = require("@utils/logger");
const discord_js_1 = require("discord.js");
const ready_1 = require("./ready");
const messageCreate_1 = require("./messageCreate");
const guildMemberAdd_1 = require("./guildMemberAdd");
const voiceStateUpdate_1 = require("./voiceStateUpdate");
const interactionCreate_1 = require("./interactionCreate");
const messageUpdate_1 = require("./messageUpdate");
class EventLoader {
    bot;
    logger;
    constructor(bot) {
        this.bot = bot;
        this.logger = new logger_1.Logger('EventLoader');
    }
    async loadEvents() {
        try {
            const events = [
                ready_1.readyEvent,
                messageCreate_1.messageCreateEvent,
                guildMemberAdd_1.guildMemberAddEvent,
                voiceStateUpdate_1.voiceStateUpdateEvent,
                interactionCreate_1.interactionCreateEvent,
                messageUpdate_1.messageUpdateEvent,
                messageUpdate_1.messageDeleteEvent
            ];
            let loadedCount = 0;
            for (const event of events) {
                event(this.bot);
                this.logger.debug(`Loaded event: ${event.name}`);
                loadedCount++;
            }
            await this.setupAdditionalEvents();
            this.logger.info(`Successfully loaded ${loadedCount} events`);
        }
        catch (error) {
            this.logger.error('Failed to load events:', error);
            throw error;
        }
    }
    async setupAdditionalEvents() {
        try {
            this.bot.client.on(discord_js_1.Events.MessageReactionAdd, async (reaction, user) => {
                if (user.bot)
                    return;
                try {
                    const { RoleManager } = await Promise.resolve().then(() => __importStar(require('@modules/role/index')));
                    const roleManager = new RoleManager(this.bot);
                    await roleManager.handleReactionRoleToggle(reaction.message.id, user.id, reaction.emoji.name || reaction.emoji.id || '', true);
                }
                catch (error) {
                    this.logger.error('Error handling reaction add:', error);
                }
            });
            this.bot.client.on(discord_js_1.Events.MessageReactionRemove, async (reaction, user) => {
                if (user.bot)
                    return;
                try {
                    const { RoleManager } = await Promise.resolve().then(() => __importStar(require('@modules/role/index')));
                    const roleManager = new RoleManager(this.bot);
                    await roleManager.handleReactionRoleToggle(reaction.message.id, user.id, reaction.emoji.name || reaction.emoji.id || '', false);
                }
                catch (error) {
                    this.logger.error('Error handling reaction remove:', error);
                }
            });
            this.bot.client.on(discord_js_1.Events.GuildMemberRemove, async (member) => {
                try {
                    const { LoggingManager } = await Promise.resolve().then(() => __importStar(require('@modules/logging/index')));
                    const loggingManager = new LoggingManager(this.bot);
                    await loggingManager.logJoinLeave(member, 'leave');
                }
                catch (error) {
                    this.logger.error('Error handling member leave:', error);
                }
            });
            this.bot.client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
                try {
                    const { LoggingManager } = await Promise.resolve().then(() => __importStar(require('@modules/logging/index')));
                    const loggingManager = new LoggingManager(this.bot);
                    const inviteUsed = await loggingManager.detectInviteUsed(member.guild.id);
                    await loggingManager.logJoinLeave(member, 'join', inviteUsed || undefined);
                    const { AnalyticsManager } = await Promise.resolve().then(() => __importStar(require('@modules/analytics/index')));
                    const analyticsManager = new AnalyticsManager(this.bot);
                    await analyticsManager.recordMemberGrowth(1);
                }
                catch (error) {
                    this.logger.error('Error handling member join with analytics:', error);
                }
            });
            this.bot.client.on(discord_js_1.Events.MessageCreate, async (message) => {
                if (message.author.bot || message.guild)
                    return;
                try {
                    const { AnonymousManager } = await Promise.resolve().then(() => __importStar(require('@modules/ticket/anonymous')));
                    const anonymousManager = new AnonymousManager(this.bot);
                    await anonymousManager.handleCustomerDM(message);
                }
                catch (error) {
                    this.logger.error('Error handling DM for ticket system:', error);
                }
            });
            this.logger.debug('Additional event handlers setup completed');
        }
        catch (error) {
            this.logger.error('Failed to setup additional events:', error);
        }
    }
}
exports.EventLoader = EventLoader;
//# sourceMappingURL=index.js.map