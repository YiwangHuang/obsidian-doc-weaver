/**
 * Quick Template 模块的类型定义
 */

/**
 * 单个模板配置接口
 */
export interface TemplateConfig {
    /** 模板ID，唯一标识符 */
    id: string;
    /** 模板名称，用于显示和识别 */
    name: string;
    /** 模板内容，支持占位符 */
    template: string;
    /** 是否启用此模板配置 */
    enabled: boolean;
}

/**
 * 快捷模板设置接口
 */
export interface QuickTemplateSettings {
    /** 模板配置数组 */
    templates: TemplateConfig[];
}

/**
 * 快捷模板的默认设置
 */
export const DEFAULT_QUICK_TEMPLATE_SETTINGS: QuickTemplateSettings = {
    templates: [
        {
            id: 'quick-template-code-block',
            name: 'Code Block Template',
            template: '```{{language}}\n{{selectedText}}\n```',
            enabled: true
        },
        {
            id: 'quick-template-callout',
            name: 'Callout Template', 
            template: '> [!{{type}}] {{title}}\n> {{selectedText}}',
            enabled: true
        }
    ]
}; 