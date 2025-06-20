import { ChatInputCommandInteraction } from 'discord.js';
import { CorelinksBot } from '../bot';
export declare const moderationCommands: ({
    data: import("discord.js").SlashCommandOptionsOnlyBuilder;
    execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot): Promise<void>;
} | {
    data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    execute(interaction: ChatInputCommandInteraction, bot: CorelinksBot): Promise<void>;
})[];
//# sourceMappingURL=moderation.d.ts.map