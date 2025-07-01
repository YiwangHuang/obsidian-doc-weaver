import { SettingsRegistry } from '../main';
import { DEFAULT_EXPORT_FORMATS_SETTINGS } from './types';

// Export formats settings registry
export const exportFormatsSetting: SettingsRegistry = {
    name: 'exportFormats',
    description: 'Settings for export formats',
    defaultSettings: DEFAULT_EXPORT_FORMATS_SETTINGS,
    renderSettingTab: () => {} // Vue组件已替代此功能
};

// Export commands
export * from './commands';
