import { CorelinksBot } from '../../bot';
export declare class RolePickerManager {
    private bot;
    private logger;
    private rolePickers;
    constructor(bot: CorelinksBot);
    createRolePicker(title: string, description: string, channelId: string, creatorId: string): Promise<boolean>;
    addRoleToRolePicker(messageId: string, roleId: string, emoji: string, description: string): Promise<boolean>;
    handleReactionRoleToggle(messageId: string, userId: string, emoji: string, added: boolean): Promise<void>;
    handleRoleSelection(interaction: any, params: string[]): Promise<void>;
    private updateRolePickerEmbed;
    private logRolePickerAction;
    getRolePickers(): Map<string, RolePickerData>;
    isRolePickerMessage(messageId: string): boolean;
}
interface RolePickerData {
    messageId: string;
    channelId: string;
    title: string;
    description: string;
    roles: Map<string, RolePickerRole>;
    creatorId: string;
    createdAt: Date;
}
interface RolePickerRole {
    roleId: string;
    roleName: string;
    description: string;
    emoji: string;
}
export {};
//# sourceMappingURL=picker.d.ts.map