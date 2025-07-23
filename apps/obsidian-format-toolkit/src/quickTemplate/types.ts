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
            id: 'quick-template-multi-column',
            name: 'Multi Column Template',
            template: ":::col|width(50%, 50%)\n\n@col\n\n{{selectedText}}\n\n@col\n\n\n:::\n",
            enabled: true   
        },
        {
            id: 'quick-template-callout',
            name: 'Callout Template', 
            template: '> [!info] 讲解注释\n> {{selectedText}}',
            enabled: true
        }
    ]
}; 