/**
 * Quick Template 模块入口
 */

import { ModuleInfoRegistry } from '../main';
import { getLocalizedText } from '../lib/textUtils';
import QuickTemplateSettingsComponent from './components/QuickTemplateSettings.vue';

/**
 * Quick Template 模块的类型定义
 */

/**
 * 单个模板配置接口，修改需同步修改类型守卫函数isTemplateConfig
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
 * 快捷模板设置接口，修改需同步修改类型守卫函数isQuickTemplateSettings
 */
export interface QuickTemplateSettings {
    /** 模板配置数组 */
    templates: TemplateConfig[];
}

/**
 * 类型守卫函数：检查对象是否符合 TemplateConfig 接口
 * @param obj 要检查的对象
 * @returns 是否符合 TemplateConfig 接口
 */
export function isTemplateConfig(obj: unknown): obj is TemplateConfig {
    if (!obj || typeof obj !== 'object') return false;
    
    const tmpl = obj as Record<string, unknown>;
    return typeof tmpl.id === 'string' &&
           typeof tmpl.name === 'string' &&
           typeof tmpl.template === 'string' &&
           typeof tmpl.enabled === 'boolean';
}

/**
 * 类型守卫函数：检查对象是否符合 QuickTemplateSettings 接口
 * @param obj 要检查的对象
 * @returns 是否符合 QuickTemplateSettings 接口
 */
export function isQuickTemplateSettings(obj: unknown): obj is QuickTemplateSettings {
    if (!obj || typeof obj !== 'object') return false;
    
    const settings = obj as Record<string, unknown>;
    if (!Array.isArray(settings.templates)) return false;
    
    return settings.templates.every((template: unknown) => isTemplateConfig(template));
}

/**
 * 快捷模板的默认设置
 */
export const DEFAULT_QUICK_TEMPLATE_SETTINGS: QuickTemplateSettings = {
    templates: [
        {
            id: 'quick-template-multi-column',
            name: 'Multi Column Template',
            template: ":::col|width(50%, 50%)\n\n@col\n\n{{selectedText}}\n\n@col\n\n\n\n:::\n",
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



// Quick template settings registry
export const quickTemplateInfo: ModuleInfoRegistry<QuickTemplateSettings> = {
    name: 'quickTemplate',
    settingTabName: getLocalizedText({ en: "Quick Template", zh: "快速模板" }),
    description: 'Settings for quick template',
    defaultConfigs: DEFAULT_QUICK_TEMPLATE_SETTINGS,
    component: QuickTemplateSettingsComponent
};

// 导出模板管理器
export { QuickTemplateManager } from './quickTemplateManager';
