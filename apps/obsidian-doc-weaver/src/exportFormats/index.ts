import { ModuleRegistration } from '../main';
import { ExportManagerSettings, exportManagerSettingsIO } from './types';
import { getLocalizedText } from '../lib/textUtils';
import ExportFormatsSettings from './components/ExportFormatsSettings.vue';

// Export formats settings registry
export const exportFormatsInfo: ModuleRegistration<ExportManagerSettings> = {
    name: 'export',
    settingTabName: getLocalizedText({ en: "Export", zh: "导出" }),
    description: 'Settings for export formats',
    defaultConfigs: exportManagerSettingsIO.getDefaults(),
    component: ExportFormatsSettings // Vue组件
};

export { ExportFormatsManager } from './exportFormatsManager';
// Export commands
export * from './commands';
