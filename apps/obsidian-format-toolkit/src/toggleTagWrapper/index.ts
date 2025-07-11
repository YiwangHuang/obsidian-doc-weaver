/**
 * Toggle Tag Wrapper 模块入口
 */

import { SettingsRegistry } from '../main';
import { DEFAULT_TAG_WRAPPER_SETTINGS } from './types';
import { getLocalizedText } from '../lib/textUtils';
import TagWrapperSettings from './components/TagWrapperSettings.vue';

// Tag wrapper settings registry
export const tagWrapperSetting: SettingsRegistry = {
    name: 'tagWrapper',
    settingTabName: getLocalizedText({ en: "Tags Config", zh: "标签配置" }),
    description: 'Settings for tag wrapper commands',
    defaultSettings: DEFAULT_TAG_WRAPPER_SETTINGS,
    component: TagWrapperSettings
};

// 导出动态命令管理器（作为主要接口）
export { DynamicCommandManager } from './dynamicCommandManager';

// 导出类型
export type { TagConfig, TagWrapperSettings } from './types';