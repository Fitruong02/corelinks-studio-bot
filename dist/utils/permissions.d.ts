import { Guild, GuildMember, Role } from 'discord.js';
export declare class PermissionManager {
    private static logger;
    static isFounder(member: GuildMember): boolean;
    static isStaff(member: GuildMember): boolean;
    static isCustomer(member: GuildMember): boolean;
    static hasPermission(member: GuildMember, requiredRole: 'founder' | 'staff' | 'customer'): boolean;
    static grantCustomerRole(member: GuildMember): Promise<boolean>;
    static removeRole(member: GuildMember, roleId: string): Promise<boolean>;
    static addRole(member: GuildMember, roleId: string): Promise<boolean>;
    static getRoleHierarchy(guild: Guild): Role[];
    static canModerate(moderator: GuildMember, target: GuildMember): boolean;
}
//# sourceMappingURL=permissions.d.ts.map