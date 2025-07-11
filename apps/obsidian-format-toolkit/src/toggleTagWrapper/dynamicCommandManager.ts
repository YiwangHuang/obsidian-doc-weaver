/**
 * 动态命令管理器
 * 
 * 完全独立的标签包装器命令管理模块，与主插件解耦
 */

import { Editor, MarkdownView, Command } from "obsidian";
import type MyPlugin from "../main";
import type { TagConfig, TagWrapperSettings } from "./types";

/**
 * 动态命令管理器
 */
export class DynamicCommandManager {
    private plugin: MyPlugin;
    private registeredCommands = new Set<string>();

    // 静态实例管理
    private static instance: DynamicCommandManager | null = null;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
    }

    /**
     * 初始化全局管理器实例
     * @param plugin 插件实例
     */
    static initialize(plugin: MyPlugin): DynamicCommandManager {
        if (DynamicCommandManager.instance) {
            DynamicCommandManager.instance.cleanup();
        }
        
        DynamicCommandManager.instance = new DynamicCommandManager(plugin);
        return DynamicCommandManager.instance;
    }

    /**
     * 获取全局管理器实例
     */
    static getInstance(): DynamicCommandManager | null {
        return DynamicCommandManager.instance;
    }

    /**
     * 静态方法：更新命令（外部调用）
     * @param settings 新的设置
     */
    static updateCommands(settings: TagWrapperSettings): void {
        const instance = DynamicCommandManager.getInstance();
        if (instance) {
            instance.updateCommands(settings);
        }
    }

    /**
     * 静态方法：清理所有命令（外部调用）
     */
    static cleanup(): void {
        const instance = DynamicCommandManager.getInstance();
        if (instance) {
            instance.cleanup();
            DynamicCommandManager.instance = null;
        }
    }

    /**
     * 初始化并注册命令
     */
    initialize(settings: TagWrapperSettings): void {
        this.updateCommands(settings);
    }

    /**
     * 更新命令
     */
    updateCommands(settings: TagWrapperSettings): void {
        // 清理现有命令
        this.cleanup();
        
        // 注册启用的命令
        settings.tags
            .filter(tag => tag.enabled)
            .forEach(tag => this.registerCommand(tag));

        console.log(`Dynamic commands updated: ${this.registeredCommands.size} commands registered`);
    }

    /**
     * 清理所有命令
     */
    cleanup(): void {
        this.registeredCommands.forEach(commandId => {
            try {
                (this.plugin.app as any).commands.removeCommand(commandId);
            } catch (error) {
                console.error(`Failed to remove command: ${commandId}`, error);
            }
        });
        this.registeredCommands.clear();
    }

    /**
     * 注册单个命令
     */
    private registerCommand(tag: TagConfig): void {
        const command: Command = {
            id: tag.id,
            name: tag.name,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.executeTagWrapper(editor, view, tag.prefix, tag.suffix);
            }
        };

        try {
            this.plugin.addCommand(command);
            this.registeredCommands.add(tag.id);
        } catch (error) {
            console.error(`Failed to register command: ${tag.id}`, error);
        }
    }

    /**
     * 执行标签包装逻辑
     */
    private executeTagWrapper(editor: Editor, view: MarkdownView, prefix: string, suffix: string): void {
        const PL = prefix.length;
        const SL = suffix.length;
        const selectedText = editor.somethingSelected() ? editor.getSelection() : "";

        const last_cursor = editor.getCursor();
        last_cursor.line = editor.lastLine();
        last_cursor.ch = editor.getLine(last_cursor.line).length;
        const last_offset = editor.posToOffset(last_cursor);

        function Cursor(offset: number) {
            if (offset > last_offset) return last_cursor;
            offset = offset < 0 ? 0 : offset;
            return editor.offsetToPos(offset);
        }

        const fos = editor.posToOffset(editor.getCursor("from"));
        const tos = editor.posToOffset(editor.getCursor("to"));

        const beforeText = editor.getRange(Cursor(fos - PL), Cursor(fos));
        const afterText = editor.getRange(Cursor(tos), Cursor(tos + SL));
        const startText = editor.getRange(Cursor(fos), Cursor(fos + PL));
        const endText = editor.getRange(Cursor(tos - SL), Cursor(tos));

        if (beforeText === prefix && afterText === suffix) {
            // 移除外部标签
            editor.setSelection(Cursor(fos - PL), Cursor(tos + SL));
            editor.replaceSelection(selectedText);
            editor.setSelection(Cursor(fos - PL), Cursor(tos - PL));
        } else if (startText === prefix && endText === suffix) {
            // 移除选中的标签
            editor.replaceSelection(editor.getRange(Cursor(fos + PL), Cursor(tos - SL)));
            editor.setSelection(Cursor(fos), Cursor(tos - PL - SL));
        } else {
            // 检查是否在标签内部
            let foundTagPair = false;
            let prefixStart = -1;
            
            // 向前搜索前缀
            for (let i = fos - 1; i >= 0; i--) {
                if (i + PL <= last_offset) {
                    const checkText = editor.getRange(Cursor(i), Cursor(i + PL));
                    if (checkText === prefix) {
                        prefixStart = i;
                        break;
                    }
                }
                if (i + SL <= last_offset) {
                    const checkSuffix = editor.getRange(Cursor(i), Cursor(i + SL));
                    if (checkSuffix === suffix) break;
                }
            }
            
            // 向后搜索后缀
            if (prefixStart >= 0) {
                for (let i = Math.max(tos, prefixStart + PL); i <= last_offset - SL; i++) {
                    const checkText = editor.getRange(Cursor(i), Cursor(i + SL));
                    if (checkText === suffix) {
                        const innerText = editor.getRange(Cursor(prefixStart + PL), Cursor(i));
                        editor.setSelection(Cursor(prefixStart), Cursor(i + SL));
                        editor.replaceSelection(innerText);
                        
                        const originalSelectionStart = fos - prefixStart - PL;
                        const originalSelectionEnd = tos - prefixStart - PL;
                        if (originalSelectionStart >= 0 && originalSelectionEnd >= 0) {
                            editor.setSelection(
                                Cursor(prefixStart + Math.max(0, originalSelectionStart)),
                                Cursor(prefixStart + Math.max(0, originalSelectionEnd))
                            );
                        } else {
                            editor.setCursor(Cursor(prefixStart));
                        }
                        foundTagPair = true;
                        break;
                    }
                    if (i + PL <= last_offset) {
                        const checkPrefix = editor.getRange(Cursor(i), Cursor(i + PL));
                        if (checkPrefix === prefix) break;
                    }
                }
            }
            
            if (!foundTagPair) {
                // 添加标签
                if (selectedText) {
                    editor.replaceSelection(`${prefix}${selectedText}${suffix}`);
                    editor.setSelection(
                        editor.offsetToPos(fos + PL),
                        editor.offsetToPos(tos + PL)
                    );
                } else {
                    editor.replaceSelection(`${prefix}${suffix}`);
                    const cursor = editor.getCursor();
                    cursor.ch -= SL;
                    editor.setCursor(cursor);
                }
            }
        }
    }
} 