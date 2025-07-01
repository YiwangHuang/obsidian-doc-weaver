import { SettingsRegistry } from '../main';
import { DEFAULT_EXPORT_FORMATS_SETTINGS } from './types';
import ExportFormatsSettings from './components/ExportFormatsSettings.vue';

// Export formats settings registry
export const exportFormatsSetting: SettingsRegistry = {
    name: 'exportFormats',
    description: 'Settings for export formats',
    defaultSettings: DEFAULT_EXPORT_FORMATS_SETTINGS,
    component: ExportFormatsSettings // Vue组件
};

// Export commands
export * from './commands';
