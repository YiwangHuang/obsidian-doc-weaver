import { SettingsRegistry } from '../main';
import { DEFAULT_TAG_WRAPPER_SETTINGS } from './types';

// Tag wrapper settings registry
export const tagWrapperSetting: SettingsRegistry = {
    name: 'tagWrapper',
    description: 'Settings for tag wrapper commands',
    defaultSettings: DEFAULT_TAG_WRAPPER_SETTINGS,
    renderSettingTab: () => {} // Vue组件已替代此功能
};

// 导出所有命令
export * from './commands';