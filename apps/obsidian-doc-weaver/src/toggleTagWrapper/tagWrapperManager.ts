import type DocWeaver from "../main";
import { Editor, MarkdownView, Command, EditorPosition, Notice } from "obsidian";
import { watch } from "vue";
import { TagConfig, TagWrapperSettings, tagConfigIO, tagWrapperSettingsIO, generateStartTagFromConfig, generateEndTagFromConfig } from "./types";
import { tagWrapperInfo } from "./index";
import { generateHexId } from "../lib/idGenerator";
import { logger } from "../lib/debugUtils";
import { debounce } from 'lodash';
import { getLocalizedText } from "../lib/textUtils";



/**
 * 编辑器选区接口定义
 * 基于Obsidian Editor的listSelections()返回类型
 */
interface EditorSelection {
    /** 选区起始位置（锚点） */
    anchor: EditorPosition;
    /** 选区结束位置（头部） */
    head: EditorPosition;
}

/**
 * 选区标签包装处理器
 * 负责处理单个或多个选区的标签包装逻辑
 */
class SelectionTagProcessor {
    /** 编辑器实例 */
    private editor: Editor;
    /** 前缀标签 */
    private prefix: string;
    /** 后缀标签 */
    private suffix: string;
    /** 前缀标签长度 */
    private readonly PL: number;
    /** 后缀标签长度 */
    private readonly SL: number;
    /** 文档末尾位置信息 */
    private readonly lastLine: number;
    private readonly lastCh: number;
    private readonly lastOffset: number;
    /** 累积的字符偏移量（用于同行多选区位置调整） */
    private cumulativeOffset: number;
    /** 当前处理的行号（用于检测换行重置偏移量） */
    private currentLine: number;

    constructor(editor: Editor, prefix: string, suffix: string) {
        this.editor = editor;
        this.prefix = prefix;
        this.suffix = suffix;
        this.PL = prefix.length;
        this.SL = suffix.length;
        
        // 获取文档末尾位置信息，用于边界检查
        this.lastLine = editor.lastLine();
        this.lastCh = editor.getLine(this.lastLine).length;
        this.lastOffset = editor.posToOffset({ line: this.lastLine, ch: this.lastCh });
        
        // 初始化累积偏移量和当前行号
        this.cumulativeOffset = 0;
        this.currentLine = -1;
    }

    /**
     * 处理所有选区的标签包装
     * @returns 处理后的选区数组
     */
    public processAllSelections(): EditorSelection[] {
        const selections = this.editor.listSelections();
        logger.debug('SelectionTagProcessor.processAllSelections', 'processing', selections.length, 'selections');

        // 按位置从前往后排序，便于累积偏移量计算
        const sortedSelections = [...selections].sort((a, b) => {
            const aLine = Math.min(a.anchor.line, a.head.line);
            const bLine = Math.min(b.anchor.line, b.head.line);
            if (aLine !== bLine) return aLine - bLine;
            
            const aChar = Math.min(a.anchor.ch, a.head.ch);
            const bChar = Math.min(b.anchor.ch, b.head.ch);
            return aChar - bChar;
        });

        const newSelections: EditorSelection[] = [];

        for (const selection of sortedSelections) {
            // 跨行选区直接忽略
            if (selection.anchor.line !== selection.head.line) {
                logger.debug('SelectionTagProcessor', 'skipping cross-line selection');
                new Notice(`Doc Weaver: \n${getLocalizedText({en: 'HTML tags cannot wrap content across multiple lines', zh: 'HTML 标签无法在多行之间包裹内容'})}`);
                continue;
            }

            const result = this.processLineSelection(selection);
            if (result) {
                newSelections.push(result);
            }
        }

        return newSelections;
    }

    /**
     * 基于行内选区直接处理标签包装
     * @param selection 单行选区
     * @returns 处理后的选区信息
     */
    private processLineSelection(selection: EditorSelection): EditorSelection | null {
        const line = selection.anchor.line;
        const lineText = this.editor.getLine(line);
        
        // 检测是否换行，如果换行则重置累积偏移量
        if (this.currentLine !== line) {
            this.currentLine = line;
            this.cumulativeOffset = 0;
            logger.debug('processLineSelection', `新行 ${line}，重置累积偏移量为 0`);
        }
        
        // 获取选区在行内的字符位置，并应用累积偏移量
        const originalStart = Math.min(selection.anchor.ch, selection.head.ch);
        const originalEnd = Math.max(selection.anchor.ch, selection.head.ch);
        const isReversed = selection.anchor.ch > selection.head.ch;
        
        // 应用累积偏移量调整选区位置（仅限同行内的选区）
        const start = originalStart + this.cumulativeOffset;
        const end = originalEnd + this.cumulativeOffset;
        
        const selectedText = lineText.substring(start, end);
        
        // 检查周围文本
        const beforeText = lineText.substring(Math.max(0, start - this.PL), start);
        const afterText = lineText.substring(end, Math.min(lineText.length, end + this.SL));
        
        logger.debug('processLineSelection', { line, start, end, selectedText, beforeText, afterText });

        let newLineText: string;
        let newStart: number;
        let newEnd: number;

        // 情况1: 外部有标签
        if (beforeText === this.prefix && afterText === this.suffix) {
            newLineText = lineText.substring(0, start - this.PL) + selectedText + lineText.substring(end + this.SL);
            newStart = start - this.PL;
            newEnd = start - this.PL + selectedText.length;
        }
        // 情况2: 内部有标签
        else if (selectedText.startsWith(this.prefix) && selectedText.endsWith(this.suffix)) {
            const innerText = selectedText.substring(this.PL, selectedText.length - this.SL);
            newLineText = lineText.substring(0, start) + innerText + lineText.substring(end);
            newStart = start;
            newEnd = start + innerText.length;
        }
        // 情况3: 查找包围标签
        else {
            const enclosingResult = this.findEnclosingTagsInLine(lineText, start, end);
            if (enclosingResult) {
                newLineText = lineText.substring(0, enclosingResult.prefixStart) + 
                             enclosingResult.innerText + 
                             lineText.substring(enclosingResult.suffixEnd);
                newStart = enclosingResult.prefixStart + (start - enclosingResult.prefixStart - this.PL);
                newEnd = enclosingResult.prefixStart + (end - enclosingResult.prefixStart - this.PL);
            } else {
                // 情况4: 添加标签
                if (selectedText) {
                    newLineText = lineText.substring(0, start) + this.prefix + selectedText + this.suffix + lineText.substring(end);
                    newStart = start + this.PL;
                    newEnd = end + this.PL;
                } else {
                    newLineText = lineText.substring(0, start) + this.prefix + this.suffix + lineText.substring(end);
                    newStart = start + this.PL;
                    newEnd = start + this.PL;
                }
            }
        }

        // 计算字符变化量并更新累积偏移量
        const characterChange = newLineText.length - lineText.length;
        this.cumulativeOffset += characterChange;
        
        logger.debug('processLineSelection', { 
            line, 
            originalStart, 
            originalEnd, 
            adjustedStart: start, 
            adjustedEnd: end,
            characterChange, 
            cumulativeOffset: this.cumulativeOffset,
            isNewLine: this.currentLine === line ? 'same' : 'new'
        });

        // 直接替换整行文本
        this.editor.setLine(line, newLineText);

        // 返回新的选区位置（基于调整后的位置计算）
        const newAnchor = { line, ch: isReversed ? newEnd : newStart };
        const newHead = { line, ch: isReversed ? newStart : newEnd };
        
        return { anchor: newAnchor, head: newHead };
    }

    /**
     * 在行内查找包围指定位置的标签对
     * @param lineText 行文本
     * @param start 选区起始字符位置
     * @param end 选区结束字符位置
     * @returns 找到的标签对信息，未找到则返回null
     */
    private findEnclosingTagsInLine(lineText: string, start: number, end: number): { prefixStart: number; suffixEnd: number; innerText: string } | null {
        let prefixStart = -1;
        
        // 向前搜索前缀标签
        for (let i = start - 1; i >= 0; i--) {
            if (i + this.SL <= lineText.length) {
                if (lineText.substring(i, i + this.SL) === this.suffix) {
                    break; // 遇到后缀，停止搜索
                }
            }
            if (i + this.PL <= lineText.length) {
                if (lineText.substring(i, i + this.PL) === this.prefix) {
                    prefixStart = i;
                    break;
                }
            }
        }
        
        // 向后搜索后缀标签
        if (prefixStart >= 0) {
            for (let i = Math.max(end, prefixStart + this.PL); i <= lineText.length - this.SL; i++) {
                if (lineText.substring(i, i + this.PL) === this.prefix) {
                    break; // 遇到新的前缀，停止搜索
                }
                if (lineText.substring(i, i + this.SL) === this.suffix) {
                    const innerText = lineText.substring(prefixStart + this.PL, i);
                    return {
                        prefixStart,
                        suffixEnd: i + this.SL,
                        innerText
                    };
                }
            }
        }
        
        return null;
    }










}


export class TagWrapperManager {
    private plugin: DocWeaver;
    private injectedStyles = new Map<string, HTMLStyleElement>();

    constructor(plugin: DocWeaver) {
        this.plugin = plugin;
        // 第一步：注册模块设置
        this.registerSettings();
        this.initialize();
    }

    /**
     * 注册模块设置到插件的响应式设置列表中
     */
    private registerSettings(): void {
        // 校验并修复当前设置，无效或缺失时回退到默认配置
        this.plugin.settingList[tagWrapperInfo.name] = tagWrapperSettingsIO.ensureValid(
            this.plugin.settingList[tagWrapperInfo.name],
            tagWrapperInfo.defaultConfigs
        );

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
                // 基于tagType和tagClass动态生成HTML标签
                const prefix = generateStartTagFromConfig(tag);
                const suffix = generateEndTagFromConfig(tag);
                this.executeTagWrapper(editor, view, prefix, suffix);
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
            
            logger.debug('CSS injected:', tag.name);
        } catch (error) {
            logger.debug('Failed to inject CSS:', tag.id, error);
        }
    }

    private removeCSS(tag: TagConfig): void {
        const styleElement = this.injectedStyles.get(tag.id);
        if (styleElement?.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
            this.injectedStyles.delete(tag.id);
            logger.debug('CSS removed:', tag.id);
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
        // 监听标签类型变化，需要重新注册命令
        watch(() => tag.tagType, debounce((newVal, oldVal) => {
            if (tag.enabled) {
                this.removeTagCommand(tag);
                this.addTagCommand(tag);
            }
        }, 500));
        // 监听类名变化，需要重新注册命令
        watch(() => tag.tagClass, debounce((newVal, oldVal) => {
            if (tag.enabled) {
                this.removeTagCommand(tag);
                this.addTagCommand(tag);
            }
        }, 500));
    }
    
    addTagItem(): void {
        const tags = this.config.tags;
        const hexId = generateHexId();
        // 使用 ConfigIO 创建新标签配置（默认值 + 动态 id/commandId）
        const newTag = tagConfigIO.createConfig(hexId);
        tags.push(newTag);
        this.addTagCommand(newTag);
        this.injectCSS(newTag);
        this.watchConfig(newTag);
    }

    deleteTagItem(tagIndex: number): void {
        const tag = this.config.tags[tagIndex];
        this.removeTagCommand(tag);
        this.removeCSS(tag);
        this.config.tags.splice(tagIndex, 1);
    }

    /**
     * 复制标签配置
     * 创建指定标签配置的副本，包括CSS片段
     * @param tagIndex 要复制的标签配置索引
     */
    duplicateTagItem(tagIndex: number): void {
        const originalTag = this.config.tags[tagIndex];
        const hexId = generateHexId();
        
        // 创建标签配置的深拷贝并生成新的ID
        const newTag: TagConfig = {
            ...originalTag,
            id: `tag-${hexId}`,
            commandId: `doc-weaver:tag-${hexId}`,
            name: `${originalTag.name} - Copy`,
        };

        // 将新配置插入到原配置后面
        const tags = this.config.tags;
        tags.splice(tagIndex + 1, 0, newTag);
        
        // 为新配置添加命令、注入CSS和监听
        if (newTag.enabled) {
            this.addTagCommand(newTag);
            this.injectCSS(newTag);
        }
        this.watchConfig(newTag);
        
        logger.debug('Tag duplicated:', newTag.name);
    }

    cleanup(): void {
        this.config.tags.forEach(tag => {
            this.removeTagCommand(tag);
            this.removeCSS(tag);
        });
        this.injectedStyles.clear();
    }

    /**
     * 执行标签包装逻辑 - 使用选区处理器统一处理单选区和多选区
     * @param editor 编辑器实例
     * @param view 视图实例  
     * @param prefix 前缀标签（如 '<u>'）
     * @param suffix 后缀标签（如 '</u>'）
     */
    private executeTagWrapper(editor: Editor, view: MarkdownView, prefix: string, suffix: string): void {
        logger.debug('executeTagWrapper', 'start processing with prefix:', prefix, 'suffix:', suffix);

        // 创建选区标签处理器实例
        // 该处理器负责管理所有选区相关的状态和操作
        const processor = new SelectionTagProcessor(editor, prefix, suffix);
        
        // 处理所有选区（单选区或多选区）
        // 处理器内部会自动处理多选区的排序、逐个处理和位置计算
        const processedSelections = processor.processAllSelections();
        
        // 恢复处理后的选区状态
        // 如果是多选区，会尝试恢复多选状态；如果失败则降级为单选
        this.restoreSelections(editor, processedSelections);
        
        logger.debug('executeTagWrapper', 'completed processing', processedSelections.length, 'selections');
    }



    /**
     * 恢复选区状态（支持单选区和多选区）
     * @param editor 编辑器实例
     * @param selections 选区数组
     */
    private restoreSelections(editor: Editor, selections: EditorSelection[]): void {
        if (selections.length === 0) return;
        
        if (selections.length === 1) {
            // 单选区：直接设置
            editor.setSelection(selections[0].anchor, selections[0].head);
        } else {
            // 尝试恢复多选状态
            try {
                editor.setSelections(selections);
            } catch (error) {
                logger.debug('restoreSelections', 'failed to restore multiple selections:', error);
                // 如果多选恢复失败，至少保持第一个选区
                editor.setSelection(selections[0].anchor, selections[0].head);
            }
        }
    }
}