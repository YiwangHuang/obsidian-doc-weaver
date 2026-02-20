/**
 * Toggle Tag Wrapper 模块入口
 */

import { ModuleRegistration } from '../main';
import { tagWrapperSettingsIO, TagWrapperSettings as TagWrapperSettingsType } from './types';
import { getLocalizedText } from '../lib/textUtils';
import TagWrapperSettingsComponent from './components/TagWrapperSettings.vue';

// Tag wrapper settings registry
export const tagWrapperInfo: ModuleRegistration<TagWrapperSettingsType> = {
    name: 'tagWrapper',
    settingTabName: getLocalizedText({ en: "HTML Tags", zh: "HTML 标签" }),
    description: 'Settings for tag wrapper commands',
    // 通过 ConfigIO 统一管理默认配置，避免散落常量
    defaultConfigs: tagWrapperSettingsIO.getDefaults(),
    component: TagWrapperSettingsComponent
};

// 导出动态命令管理器（作为主要接口）
export { TagWrapperManager } from './tagWrapperManager';

// 导出类型
export type { TagConfig, TagWrapperSettings } from './types';