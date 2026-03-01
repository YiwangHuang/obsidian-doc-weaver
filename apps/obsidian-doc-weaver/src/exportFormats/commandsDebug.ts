import { TFile } from 'obsidian';
import * as path from 'path';
import type DocWeaver from "../main";
import { DEBUG, logger } from "../lib/debugUtils";
import { TextConverter } from './textConvert/index';
import { type ExportConfig, FORMAT_OPTIONS, getExportConfigIOByFormat } from './types';

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
    const raw: string = (plugin.app.vault.getConfig("attachmentFolderPath") as string) ?? "/";
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
                item.setTitle("Debug: export preview")
                    .setIcon("bug");

                item.setSubmenu();
                const submenu = item.submenu;
                if (!submenu) return;

                for (const { value: format, label } of FORMAT_OPTIONS) {
                    submenu.addItem((subItem) => {
                        subItem
                            .setTitle(`Convert to ${label}`)
                            .setIcon("file-text")
                            .onClick(async () => {
                                const selection = editor.getSelection();
                                if (!selection) {
                                    logger.debug('[Debug Convert] No text selected');
                                    return;
                                }

                                const file = plugin.app.workspace.getActiveFile();
                                if (!file || !(file instanceof TFile)) {
                                    logger.debug('[Debug Convert] No active file');
                                    return;
                                }

                                const debugConfig = createDebugConfig(format);
                                const converter = new TextConverter(plugin, file, debugConfig);
                                logger.debug(`[Debug Convert][${label}] tokens:`, converter.md.parse(selection, {}));
                                logger.debug(`[Debug Convert][${label}] result:`, await converter.convert(selection, format));
                            });
                    });
                }
            });
        })
    );
}
