/**
 * General 模块入口
 */

import { ModuleInfoRegistry } from '../main';

import { getLocalizedText } from '../lib/textUtils';
import GeneralSettingsComponent from './components/GeneralSettings.vue';

/**
 * 通用模块设置接口
 */
export interface GeneralSettings {
    /** 是否显示 SpeedDial 悬浮按钮 */
    showSpeedDial: boolean;
}

/**
 * 通用模块的默认设置
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
    showSpeedDial: true
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


