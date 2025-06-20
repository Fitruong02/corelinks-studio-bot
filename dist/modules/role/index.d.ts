import { CorelinksBot } from '../../bot';
import { GuildMember } from 'discord.js';
import { RolePickerManager } from './picker';
import { MassRoleManager } from './massRole';
export declare class RoleManager {
    private bot;
    private logger;
    private rolePickerManager;
    private massRoleManager;
    constructor(bot: CorelinksBot);
    addRole(member: GuildMember, roleId: string, moderatorId: string): Promise<boolean>;
    removeRole(member: GuildMember, roleId: string, moderatorId: string): Promise<boolean>;
    massAddRole(targetRoleId: string, filterRoleId: string, moderatorId: string): Promise<MassRoleResult>;
    massRemoveRole(targetRoleId: string, filterRoleId: string, moderatorId: string): Promise<MassRoleResult>;
    createRolePicker(title: string, description: string, channelId: string, creatorId: string): Promise<boolean>;
    addRoleToRolePicker(messageId: string, roleId: string, emoji: string, description: string): Promise<boolean>;
    handleRoleSelection(interaction: any, params: string[]): Promise<void>;
    handleReactionRoleToggle(messageId: string, userId: string, emoji: string, added: boolean): Promise<void>;
    private logRoleAction;
    getRolePickerManager(): RolePickerManager;
    getMassRoleManager(): MassRoleManager;
}
interface MassRoleResult {
    total: number;
    successful: number;
    failed: number;
    errors: string[];
}
export {};
//# sourceMappingURL=index.d.ts.map