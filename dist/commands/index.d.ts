import { CorelinksBot } from '../bot';
export declare class CommandLoader {
    private bot;
    private logger;
    constructor(bot: CorelinksBot);
    loadCommands(): Promise<void>;
    getCommand(name: string): any;
    getAllCommands(): any[];
    getEnabledFeatures(): string[];
    getDisabledFeatures(): string[];
}
//# sourceMappingURL=index.d.ts.map