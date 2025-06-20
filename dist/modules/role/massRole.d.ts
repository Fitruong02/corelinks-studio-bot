import { CorelinksBot } from '../../bot';
export declare class MassRoleManager {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    massAddRole(targetRoleId: string, filterRoleId: string, moderatorId: string): Promise<MassRoleResult>;
    massRemoveRole(targetRoleId: string, filterRoleId: string, moderatorId: string): Promise<MassRoleResult>;
    private logMassRoleStart;
    private logMassRoleComplete;
}
interface MassRoleResult {
    total: number;
    successful: number;
    failed: number;
    errors: string[];
}
export {};
//# sourceMappingURL=massRole.d.ts.map