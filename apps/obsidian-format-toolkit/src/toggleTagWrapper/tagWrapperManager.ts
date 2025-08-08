import type MyPlugin from "../main";
import { Editor, MarkdownView, Command } from "obsidian";
import { watch } from "vue";
import { TagConfig, TagWrapperSettings, isTagWrapperSettings } from "./types";
import { tagWrapperInfo } from "./index";
import { generateTimestamp } from "../lib/idGenerator";
import { debugLog } from "../lib/debugUtils";
import { debounce } from 'lodash';

export class TagWrapperManager {
    private plugin: MyPlugin;
    private injectedStyles = new Map<string, HTMLStyleElement>();

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        // 第一步：注册模块设置
        this.registerSettings();
        this.initialize();
    }

    /**
     * 注册模块设置到插件的响应式设置列表中
     */
    private registerSettings(): void {
        // 获取当前设置
        const currentSettings = this.plugin.settingList[tagWrapperInfo.name];
        
        // 使用类型守卫函数检查设置是否需要重置
        const needsReset = !currentSettings || !isTagWrapperSettings(currentSettings);
        
        if (needsReset) {
            console.log(`Initializing settings for ${tagWrapperInfo.name} with type checking`);
            this.plugin.settingList[tagWrapperInfo.name] = tagWrapperInfo.defaultConfigs;
        }

        // 将模块信息添加到插件的模块设置列表中
        this.plugin.moduleSettings.push(tagWrapperInfo);
    }

    /**
     * 获取当前配置（始终从响应式settingList中获取最新配置）
     */
    get config(): TagWrapperSettings {
        return this.plugin.settingList[tagWrapperInfo.name] as TagWrapperSettings;
    }

    initialize(): void {
        // 配置现在通过getter动态获取，无需检查空值
        const enabledTags = this.config.tags.filter(tag => tag.enabled);
        enabledTags.forEach(tag => {
            this.addTagCommand(tag);
            this.injectCSS(tag);
        });
        this.config.tags.forEach(tag => {
            this.watchConfig(tag);
        });
    }
    
    addTagCommand(tag: TagConfig): void {
        const command: Command = {
            id: tag.id,
            name: `tag - ${tag.name}`,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.executeTagWrapper(editor, view, tag.prefix, tag.suffix);
            }
        };
        this.plugin.addCommand(command);
    }
    
    removeTagCommand(tag: TagConfig): void {
        this.plugin.removeCommand(tag.id);
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
            styleElement.id = tag.id;
            styleElement.textContent = `/* Doc Weaver CSS Snippet for: ${tag.name} */\n${tag.cssSnippet}`;
            
            document.head.appendChild(styleElement);
            this.injectedStyles.set(tag.id, styleElement);
            
            debugLog('CSS injected:', tag.name);
        } catch (error) {
            debugLog('Failed to inject CSS:', tag.id, error);
        }
    }

    private removeCSS(tag: TagConfig): void {
        const styleElement = this.injectedStyles.get(tag.id);
        if (styleElement?.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
            this.injectedStyles.delete(tag.id);
            debugLog('CSS removed:', tag.id);
        }
    }

    // TODO: 需要增加防抖机制，避免频繁触发
    watchConfig(tag: TagConfig): void {
        watch(() => tag.enabled, (newVal, oldVal) => {
            if (newVal) {
                this.addTagCommand(tag);
                this.injectCSS(tag);
            } else {
                this.removeTagCommand(tag);
                this.removeCSS(tag);
            }
        });           
        watch(() => tag.name, debounce((newVal, oldVal) => {
            if (tag.enabled) {
                this.removeTagCommand(tag);
                this.addTagCommand(tag);
            }
        }, 500));
        watch(() => tag.cssSnippet, debounce((newVal, oldVal) => {
            if (tag.enabled) {
                this.removeCSS(tag);
                this.injectCSS(tag);
            }
        }, 500));
    }
    
    addTagItem(): void {
        const tags = this.config.tags;
        tags.push(this.generateTagItem());
        this.addTagCommand(tags[tags.length - 1]);
        this.injectCSS(tags[tags.length - 1]);
        this.watchConfig(tags[tags.length - 1]);
    }

    deleteTagItem(tagIndex: number): void {
        const tag = this.config.tags[tagIndex];
        this.removeTagCommand(tag);
        this.removeCSS(tag);
        this.config.tags.splice(tagIndex, 1);
    }

    cleanup(): void {
        this.config.tags.forEach(tag => {
            this.removeTagCommand(tag);
            this.removeCSS(tag);
        });
        this.injectedStyles.clear();
    }

    generateTagItem(
        name?: string,
        prefix?: string,
        suffix?: string,
        cssSnippet?: string,
        icon?: string
    ): TagConfig {
        const hexId = generateTimestamp();
        return {
            id: `tag-${hexId}`,
            commandId: `doc-weaver:tag-${hexId}`,
            name: name || `${hexId}`,
            prefix: prefix || '<u>',
            suffix: suffix || '</u>',
            enabled: true,
            cssSnippet: cssSnippet || `u {
    color: blue;
    cursor: pointer; /* 鼠标悬停显示为手型 */
    text-decoration: none; /* 去掉默认的下划线 */
    border-bottom: 1px solid black; /* 使用边框模拟下划线 */
    position: relative; /* 使得伪元素定位可以相对于 <u> 元素 */
}`,
            icon: icon || 'tag' // 必须提供图标，默认为'tag'
        };
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