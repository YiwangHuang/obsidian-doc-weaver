import { TFile } from 'obsidian';
import * as path from 'path';
import type DocWeaver from "../main";
import { DEBUG } from "../lib/debugUtils";
import { FORMAT_OPTIONS, getExportConfigIOByFormat } from './types';
import { TextConverter } from './textConvert/index';
import type { ExportConfig } from './types';

function createDebugConfig(format: typeof FORMAT_OPTIONS[number]['value']): ExportConfig {
    return getExportConfigIOByFormat(format).createConfig('debug');
}

/**
 * 获取 Obsidian 设置中配置的附件默认存放位置(处理成绝对路径)
 *
 * attachmentFolderPath 取值规则：
 *   "/"            → vault 根目录
 *   "./"           → 与当前文件同目录
 *   "./<sub>"      → 当前文件目录下的子文件夹
 *   "<folder>"     → vault 下的指定文件夹
 */
export function getAttachmentFolderPath(plugin: DocWeaver, file: TFile): string {
    const raw: string = (plugin.app.vault as any).getConfig("attachmentFolderPath") ?? "/"; //getConfig 不在官方 TypeScript 类型定义中（属于内部 API），所以需要 as any 来绕过类型检查
    const vaultAbsPath = plugin.VAULT_ABS_PATH;

    if (raw === "/") {
        return vaultAbsPath;
    }

    if (raw.startsWith("./")) {
        const fileDir = file.parent?.path ?? "";
        const sub = raw.slice(2);
        return path.join(vaultAbsPath, fileDir, sub);
    }

    return path.join(vaultAbsPath, raw);
}

export function debugCommands(plugin: DocWeaver): void {
    if (!DEBUG) return;

    plugin.registerEvent(
        plugin.app.workspace.on("editor-menu", (menu, editor, info) => {
            menu.addItem((item) => {
                item.setTitle("Debug: Export Preview")
                    .setIcon("bug");

                (item as any).setSubmenu();
                const submenu = (item as any).submenu;
                if (!submenu) return;

                for (const { value: format, label } of FORMAT_OPTIONS) {
                    submenu.addItem((subItem: any) => {
                        subItem
                            .setTitle(`Convert to ${label}`)
                            .setIcon("file-text")
                            .onClick(async () => {
                                const selection = editor.getSelection();
                                if (!selection) {
                                    console.warn('[Debug Convert] No text selected');
                                    return;
                                }

                                const file = plugin.app.workspace.getActiveFile();
                                if (!file || !(file instanceof TFile)) {
                                    console.warn('[Debug Convert] No active file');
                                    return;
                                }

                                const debugConfig = createDebugConfig(format);
                                const converter = new TextConverter(plugin, file, debugConfig);
                                const result = await converter.convert(selection, format);
                                console.log(`[Debug Convert][${label}] result:`, result);
                                console.log(`[Debug Convert][${label}] tokens:`, converter.md.parse(selection, {}));
                            });
                    });
                }
            });
        })
    );
}
