import 'obsidian';

declare module 'obsidian' {
    interface MenuItem {
        setSubmenu(): this;
        submenu: Menu;
    }

    interface App {
        plugins: {
            plugins: Record<string, Plugin>;
        };
    }

    interface Vault {
        config: {
            attachmentFolderPath?: string;
        };
        getConfig(key: string): unknown;
    }
}
