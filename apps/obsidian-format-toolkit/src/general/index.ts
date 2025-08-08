/**
 * General 模块入口
 */

import { ModuleInfoRegistry } from '../main';

import { getLocalizedText } from '../lib/textUtils';
import GeneralSettingsComponent from './components/GeneralSettings.vue';
import { ToolbarItem } from './types';
/**
 * 通用模块设置接口，修改需同步修改类型守卫函数isGeneralSettings
 */
export interface GeneralSettings {
    /** 是否显示 SpeedDial 悬浮按钮 */
    showToolBar: boolean;
    commands: ToolbarItem[];
}

/**
 * 类型守卫函数：检查对象是否符合 GeneralSettings 接口
 * @param obj 要检查的对象
 * @returns 是否符合 GeneralSettings 接口
 */
export function isGeneralSettings(obj: unknown): obj is GeneralSettings {
    if (!obj || typeof obj !== 'object') return false;
    
    const settings = obj as Record<string, unknown>;
    return typeof settings.showSpeedDial === 'boolean';
}

/**
 * 通用模块的默认设置
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    showToolBar: true,
    commands: []
};

// General settings registry
export const generalInfo: ModuleInfoRegistry<GeneralSettings> = {
    name: 'general',
    settingTabName: getLocalizedText({ en: "General", zh: "通用设置" }),
    description: 'Settings for general functionality',
    defaultConfigs: DEFAULT_GENERAL_SETTINGS,
    component: GeneralSettingsComponent
};

// 导出管理器
export { GeneralManager } from './generalManager';

