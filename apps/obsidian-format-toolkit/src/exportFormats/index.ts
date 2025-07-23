import { SettingsRegistry } from '../main';
import { DEFAULT_EXPORT_FORMATS_SETTINGS, ExportManagerSetting } from './types';
import { getLocalizedText } from '../lib/textUtils';
import ExportFormatsSettings from './components/ExportFormatsSettings.vue';

// Export formats settings registry
export const exportFormatsSetting: SettingsRegistry<ExportManagerSetting> = {
    name: 'exportFormats',
    settingTabName: getLocalizedText({ en: "Export Config", zh: "导出配置" }),
    description: 'Settings for export formats',
    defaultConfigs: DEFAULT_EXPORT_FORMATS_SETTINGS,
    component: ExportFormatsSettings // Vue组件
};

export { ExportFormatsManager } from './exportFormatsManager';
// Export commands
export * from './commands';
