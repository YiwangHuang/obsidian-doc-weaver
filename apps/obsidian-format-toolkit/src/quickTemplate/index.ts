/**
 * Quick Template 模块入口
 *
 * - ConfigIO<T>：通用配置读写中间层，直接实例化并传入 fieldDefs 即可使用
 * - templateConfigIO / quickTemplateSettingsIO：预置实例
 */

import { ModuleRegistration } from '../main';
import { getLocalizedText } from '../lib/textUtils';
import QuickTemplateSettingsComponent from './components/QuickTemplateSettings.vue';
import type { BaseConfig } from '../general/types';
import type { FieldDef } from '../lib/configIOUtils';
import { ConfigIO } from '../lib/configIOUtils';

// ======================== 接口定义 ========================

/**
 * 单个模板配置接口，新增字段需同步修改 templateConfigFields
 */
export interface TemplateConfig extends BaseConfig {
    /** 模板ID，唯一标识符 */
    id: string;
    commandId: string;
    template: string;
}

/**
 * 快捷模板设置接口，新增字段需同步修改 quickTemplateSettingsIO
 */
export interface QuickTemplateSettings {
    /** 模板配置数组 */
    templates: TemplateConfig[];
}

// ======================== 字段定义 ========================

/** TemplateConfig 的字段描述，id / commandId / name 无默认值（动态生成） */
const templateConfigFields: Record<keyof TemplateConfig, FieldDef> = {
    name:      { type: 'string',  required: true },
    icon:      { type: 'string',  required: false, default: 'file' },
    enabled:   { type: 'boolean', required: true,  default: true },
    id:        { type: 'string',  required: true },
    commandId: { type: 'string',  required: true },
    template:  { type: 'string',  required: true,  default: '{{selectedText}}' },
};

// ======================== ConfigIO 实例 ========================

/**
 * TemplateConfig 读写中间层
 * 提供 createConfig 方法用于创建新的模板配置
 */
class TemplateConfigIO extends ConfigIO<TemplateConfig> {
    constructor() {
        super(templateConfigFields);
    }

    /**
     * 基于 getDefaults() 创建新的模板配置
     * 动态字段（id、commandId、name）由 timestamp 生成，其余使用 fieldDefs 中的默认值
     * @param timestamp 唯一时间戳标识符
     * @returns 完整的 TemplateConfig 对象
     */
    createConfig(timestamp: string): TemplateConfig {
        const defaults = this.getDefaults();
        return {
            ...defaults,
            id: `template-${timestamp}`,
            commandId: `doc-weaver:template-${timestamp}`,
            name: `Template-${timestamp}`,
        } as TemplateConfig;
    }
}

/**
 * QuickTemplateSettings 读写中间层，可在此扩展 Settings 特有的方法
 */
class QuickTemplateSettingsIO extends ConfigIO<QuickTemplateSettings> {
    constructor() {
        super({
            templates: { type: 'array', required: true, default: [
                {
                    id: 'quick-template-multi-column',
                    commandId: 'doc-weaver:quick-template-multi-column',
                    name: 'Multi Column Template',
                    template: ":::col|width(50%, 50%)\n\n@col\n\n{{selectedText}}\n\n@col\n\n\n\n:::\n",
                    enabled: true,
                    icon: 'columns-2'
                },
                {
                    id: 'quick-template-callout',
                    commandId: 'doc-weaver:quick-template-callout',
                    name: 'Callout Template',
                    template: '> [!info] 讲解注释\n> {{selectedText}}',
                    enabled: true,
                    icon: 'quote'
                }
            ]},
        });
    }

    /** 覆盖以返回完整类型 */
    getDefaults(): QuickTemplateSettings {
        return super.getDefaults() as QuickTemplateSettings;
    }
}

/** 单例实例 */
export const templateConfigIO = new TemplateConfigIO();
export const quickTemplateSettingsIO = new QuickTemplateSettingsIO();

// Quick template settings registry
export const quickTemplateInfo: ModuleRegistration<QuickTemplateSettings> = {
    name: 'quickTemplate',
    settingTabName: getLocalizedText({ en: "Quick Template", zh: "快速模板" }),
    description: 'Settings for quick template',
    defaultConfigs: quickTemplateSettingsIO.getDefaults(),
    component: QuickTemplateSettingsComponent
};

// 导出模板管理器
export { QuickTemplateManager } from './quickTemplateManager';
