export declare class ConfigModel {
    private static logger;
    static set(key: string, value: any): Promise<boolean>;
    static get(key: string): Promise<any | null>;
    static getAll(): Promise<Record<string, any>>;
    static delete(key: string): Promise<boolean>;
    static exists(key: string): Promise<boolean>;
}
//# sourceMappingURL=Config.d.ts.map