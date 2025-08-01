import type MyPlugin from "../main";
import { Editor, MarkdownView, Command } from "obsidian";
import { watch } from "vue";
import { TemplateConfig, QuickTemplateSettings } from "./types";
import { quickTemplateInfo } from "./index";
import { generateTimestamp } from "../lib/idGenerator";
import { debugLog } from "../lib/debugUtils";
import { replaceDatePlaceholders } from "../lib/constant";
import { debounce } from 'lodash';

/**
 * 快捷模板管理器
 * 负责管理模板配置、注册命令、处理模板插入逻辑
 */
export class QuickTemplateManager {
    private plugin: MyPlugin;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        this.initialize();
    }

    /**
     * 获取当前配置（始终从响应式settingList中获取最新配置）
     */
    get config(): QuickTemplateSettings {
        return this.plugin.settingList[quickTemplateInfo.name] as QuickTemplateSettings;
    }

    /**
     * 初始化模板管理器
     */
    initialize(): void {
        // 配置现在通过getter动态获取，无需检查空值
        
        // 为所有启用的模板注册命令
        const enabledTemplates = this.config.templates.filter(template => template.enabled);
        enabledTemplates.forEach(template => {
            this.addTemplateCommand(template);
        });
        
        // 监听配置变化
        this.config.templates.forEach(template => {
            this.watchConfig(template);
        });
    }

    /**
     * 添加模板命令
     * @param template 模板配置
     */
    addTemplateCommand(template: TemplateConfig): void {
        const command: Command = {
            id: template.id,
            name: `template - ${template.name}`,
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.executeTemplateInsertion(editor, view, template);
            }
        };
        this.plugin.addCommand(command);
        debugLog(`Template command added: ${template.name} (${template.id})`);
    }

    /**
     * 移除模板命令
     * @param template 模板配置
     */
    removeTemplateCommand(template: TemplateConfig): void {
        this.plugin.removeCommand(template.id);
        debugLog(`Template command removed: ${template.name} (${template.id})`);
    }

    /**
     * 监听模板配置变化
     * @param template 模板配置
     */
    watchConfig(template: TemplateConfig): void {
        // 监听启用状态变化
        watch(() => template.enabled, (newVal, oldVal) => {
            if (newVal) {
                this.addTemplateCommand(template);
            } else {
                this.removeTemplateCommand(template);
            }
        });

        // 监听模板名称变化（需要重新注册命令）
        watch(() => template.name, debounce((newVal, oldVal) => {
            if (template.enabled) {
                this.removeTemplateCommand(template);
                this.addTemplateCommand(template);
            }
        }, 500));

        // 监听模板内容变化（不需要重新注册命令）
        watch(() => template.template, debounce((newVal, oldVal) => {
            debugLog(`Template content updated: ${template.name}`);
        }, 500));
    }

    /**
     * 执行模板插入逻辑
     * @param editor 编辑器实例
     * @param view 视图实例
     * @param template 模板配置
     */
    private executeTemplateInsertion(editor: Editor, view: MarkdownView, template: TemplateConfig): void {
        try {
            // 获取选中的文本
            const selectedText = editor.somethingSelected() ? editor.getSelection() : "";
            
            // 处理模板内容，替换占位符
            const processedTemplate = this.replacePlaceholders(template.template, selectedText);
            
            // 插入处理后的模板内容
            if (editor.somethingSelected()) {
                // 如果有选中文本，替换选中文本
                editor.replaceSelection(processedTemplate);
            } else {
                // 如果没有选中文本，在光标位置插入
                editor.replaceRange(processedTemplate, editor.getCursor());
            }
            
            debugLog(`Template inserted: ${template.name}`, processedTemplate);
            
        } catch (error) {
            debugLog(`Error executing template: ${template.name}`, error);
        }
    }

    /**
     * 替换模板中的占位符
     * @param template 原始模板内容
     * @param selectedText 选中的文本
     * @returns 处理后的模板内容
     */
    private replacePlaceholders(template: string, selectedText: string): string {
        // 1. 替换选中文本占位符，然后替换日期占位符
        return replaceDatePlaceholders(
            template.replace(/\{\{selectedText\}\}/g, selectedText)
        );
    }

    /**
     * 添加新的模板项
     */
    addTemplateItem(): void {
        const templates = this.config.templates;
        const newTemplate = this.generateTemplateItem();
        templates.push(newTemplate);
        
        // 如果新模板是启用状态，注册命令并监听配置
        if (newTemplate.enabled) {
            this.addTemplateCommand(newTemplate);
        }
        this.watchConfig(newTemplate);
        
        debugLog('New template added:', newTemplate);
    }

    /**
     * 删除模板项
     * @param templateIndex 模板索引
     */
    deleteTemplateItem(templateIndex: number): void {
        const template = this.config.templates[templateIndex];
        if (template) {
            // 移除命令
            this.removeTemplateCommand(template);
            // 从配置中删除
            this.config.templates.splice(templateIndex, 1);
            debugLog('Template deleted:', template);
        }
    }

    /**
     * 生成新的模板项
     * @param name 模板名称
     * @param template 模板内容
     * @returns 新的模板配置
     */
    generateTemplateItem(name?: string, template?: string): TemplateConfig {
        const timestamp = generateTimestamp();
        return {
            id: `quick-template-${timestamp}`,
            name: name || `Template-${timestamp}`,
            template: template || '{{selectedText}}',
            enabled: true
        };
    }

    /**
     * 清理资源
     * 在插件卸载时调用
     */
    cleanup(): void {
        this.config.templates.forEach(template => {
            this.removeTemplateCommand(template);
        });
        debugLog('QuickTemplateManager cleanup completed');
    }
} 