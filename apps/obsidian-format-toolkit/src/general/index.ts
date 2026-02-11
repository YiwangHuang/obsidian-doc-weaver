/**
 * General 模块入口
 */

import { ModuleRegistration } from '../main';
import { getLocalizedText } from '../lib/textUtils';
import GeneralSettingsComponent from './components/GeneralSettings.vue';
import type { ExtraCommandConfig } from './types';
import { isExtraCommandConfig } from './types';

/**
 * 通用模块设置接口，修改需同步修改类型守卫函数isGeneralSettings
 */
export interface GeneralSettings {
    /** 是否显示 SpeedDial 悬浮按钮 */
    showToolBar: boolean;
    /** 自定义命令配置数组 */
    extraCommands: ExtraCommandConfig[];
}

/**
 * 类型守卫函数：检查对象是否符合 GeneralSettings 接口
 * @param obj 要检查的对象
 * @returns 是否符合 GeneralSettings 接口
 */
export function isGeneralSettings(obj: unknown): obj is GeneralSettings {
    if (!obj || typeof obj !== 'object') return false;
    
    const settings = obj as Record<string, unknown>;
    return typeof settings.showToolBar === 'boolean' &&
           Array.isArray(settings.extraCommands) &&
           settings.extraCommands.every((command: unknown) => isExtraCommandConfig(command));
}

/**
 * 通用模块的默认设置
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    showToolBar: true,
    extraCommands: []
};

// General settings registry
export const generalInfo: ModuleRegistration<GeneralSettings> = {
    name: 'general',
    settingTabName: getLocalizedText({ en: "Toolbar", zh: "工具栏" }),
    description: 'Settings for general functionality',
    defaultConfigs: DEFAULT_GENERAL_SETTINGS,
    component: GeneralSettingsComponent
};

// 导出管理器
export { GeneralManager } from './generalManager';

// 导出类型
export type { ExtraCommandConfig } from './types';