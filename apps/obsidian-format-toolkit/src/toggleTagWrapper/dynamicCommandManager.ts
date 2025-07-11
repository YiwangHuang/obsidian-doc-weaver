/**
 * 动态命令管理器
 * 
 * 完全独立的标签包装器命令管理模块，与主插件解耦
 * 支持命令和 CSS 片段的动态热插拔
 */

import { Editor, MarkdownView, Command } from "obsidian";
import type MyPlugin from "../main";
import type { TagConfig, TagWrapperSettings } from "./types";
import { debugLog } from "../lib/testUtils";

/**
 * 动态命令管理器
 */
export class DynamicCommandManager {
    private plugin: MyPlugin;
    private registeredCommands = new Map<string, Command>();
    private injectedStyles = new Map<string, HTMLStyleElement>();

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
     * 更新命令和 CSS 样式
     */
    updateCommands(settings: TagWrapperSettings): void {
        debugLog('Starting command update');
        debugLog('Current commands:', Array.from(this.registeredCommands.keys()));
        
        const enabledTags = settings.tags.filter(tag => tag.enabled);
        const newCommandIds = new Set(enabledTags.map(tag => tag.id));
        debugLog('Enabled tags:', enabledTags.map(t => t.name));
        
        // 移除不再需要的命令
        const toRemove = Array.from(this.registeredCommands.keys()).filter(id => !newCommandIds.has(id));
        if (toRemove.length > 0) {
            debugLog('Removing commands:', toRemove);
            toRemove.forEach(commandId => this.removeCommand(commandId));
        }
        
        // 移除不再需要的CSS
        const stylesToRemove = Array.from(this.injectedStyles.keys()).filter(id => !newCommandIds.has(id));
        if (stylesToRemove.length > 0) {
            debugLog('Removing styles:', stylesToRemove);
            stylesToRemove.forEach(tagId => this.removeCSS(tagId));
        }
        
        // 添加新的命令和更新CSS样式
        enabledTags.forEach(tag => {
            // 处理命令注册
            if (!this.registeredCommands.has(tag.id)) {
                debugLog('Adding command:', tag.name);
                this.registerCommand(tag);
            }
            
            // 处理CSS注入和更新
            if (tag.cssSnippet && tag.cssSnippet.trim()) {
                const existingStyle = this.injectedStyles.get(tag.id);
                const newCssContent = `/* Doc Weaver CSS Snippet for: ${tag.name} */\n${tag.cssSnippet}`;
                
                // 检查CSS是否需要更新
                if (!existingStyle) {
                    // 没有现有样式，直接注入
                    debugLog('Adding CSS:', tag.name);
                    this.injectCSS(tag);
                } else if (existingStyle.textContent !== newCssContent) {
                    // CSS内容发生变化，重新注入
                    debugLog('Updating CSS:', tag.name);
                    this.removeCSS(tag.id);
                    this.injectCSS(tag);
                }
            } else if (this.injectedStyles.has(tag.id)) {
                // 如果CSS被清空，移除现有样式
                debugLog('Removing empty CSS:', tag.name);
                this.removeCSS(tag.id);
            }
        });

        debugLog(`Update complete: ${this.registeredCommands.size} commands, ${this.injectedStyles.size} CSS snippets`);
    }

    /**
     * 清理所有命令和 CSS 样式
     */
    cleanup(): void {
        debugLog('Starting cleanup');
        
        // 清理所有命令
        Array.from(this.registeredCommands.keys()).forEach(commandId => {
            this.removeCommand(commandId);
        });
        
        // 清理所有CSS样式
        Array.from(this.injectedStyles.keys()).forEach(tagId => {
            this.removeCSS(tagId);
        });
        
        debugLog('Cleanup complete');
    }

    /**
     * 移除单个命令
     * @param commandId 命令ID
     */
    private removeCommand(commandId: string): void {
        try {
            this.plugin.removeCommand(commandId);
            this.registeredCommands.delete(commandId);
            debugLog('Command removed:', commandId);
            
        } catch (error) {
            debugLog('Failed to remove command:', commandId, error);
        }
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
            this.registeredCommands.set(tag.id, command);
            debugLog('Command registered:', tag.name);
        } catch (error) {
            debugLog('Failed to register command:', tag.id, error);
        }
    }



    /**
     * 注入 CSS 片段到 Obsidian
     * @param tag 标签配置
     */
    private injectCSS(tag: TagConfig): void {
        if (!tag.cssSnippet?.trim()) {
            return;
        }

        try {
            const styleElement = document.createElement('style');
            styleElement.id = `doc-weaver-css-${tag.id}`;
            styleElement.textContent = `/* Doc Weaver CSS Snippet for: ${tag.name} */\n${tag.cssSnippet}`;
            
            document.head.appendChild(styleElement);
            this.injectedStyles.set(tag.id, styleElement);
            
            debugLog('CSS injected:', tag.name);
        } catch (error) {
            debugLog('Failed to inject CSS:', tag.id, error);
        }
    }

    /**
     * 移除指定标签的 CSS 片段
     * @param tagId 标签ID
     */
    private removeCSS(tagId: string): void {
        const styleElement = this.injectedStyles.get(tagId);
        if (styleElement?.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
            this.injectedStyles.delete(tagId);
            debugLog('CSS removed:', tagId);
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