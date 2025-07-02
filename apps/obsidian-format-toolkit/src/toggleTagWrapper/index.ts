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
    component: TagWrapperSettings // Vue组件
};

// 导出所有命令
export * from './commands';