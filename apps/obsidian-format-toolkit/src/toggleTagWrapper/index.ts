/**
 * Toggle Tag Wrapper 模块入口
 */

import { SettingsRegistry } from '../main';
import { DEFAULT_TAG_WRAPPER_SETTINGS, TagWrapperSettings as TagWrapperSettingsType } from './types';
import { getLocalizedText } from '../lib/textUtils';
import TagWrapperSettingsComponent from './components/TagWrapperSettings.vue';

// Tag wrapper settings registry
export const tagWrapperSetting: SettingsRegistry<TagWrapperSettingsType> = {
    name: 'tagWrapper',
    settingTabName: getLocalizedText({ en: "Tags Config", zh: "标签配置" }),
    description: 'Settings for tag wrapper commands',
    defaultConfigs: DEFAULT_TAG_WRAPPER_SETTINGS,
    component: TagWrapperSettingsComponent
};

// 导出动态命令管理器（作为主要接口）
export { TagWrapperManager } from './tagWrapperManager';

// 导出类型
export type { TagConfig, TagWrapperSettings } from './types';