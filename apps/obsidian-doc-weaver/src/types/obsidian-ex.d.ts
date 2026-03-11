import 'obsidian';

declare module 'obsidian' {
    /** moment 可调用类型，用于修复 obsidian 中 moment 的 typeof 无调用签名问题 */
    export type MomentCallable = typeof import('moment');
    interface MenuItem {
        setSubmenu(): this;
        submenu: Menu;
    }

    interface App {
        plugins: {
            plugins: Record<string, Plugin>;
        };
        customCss: {
            snippets: string[];
            enabledSnippets: Set<string>;
            getSnippetsFolder(): string;
            getSnippetPath(name: string): string;
            setCssEnabledStatus(name: string, enabled: boolean): void;
            requestLoadSnippets(): void;
        };
        openWithDefaultApp(path: string): void;
    }

    interface Vault {
        config: {
            attachmentFolderPath?: string;
        };
        getConfig(key: string): unknown;
    }
}
