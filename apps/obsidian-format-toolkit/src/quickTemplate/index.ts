/**
 * Quick Template 模块入口
 */

import { SettingsRegistry } from '../main';
import { DEFAULT_QUICK_TEMPLATE_SETTINGS, QuickTemplateSettings } from './types';
import { getLocalizedText } from '../lib/textUtils';
import QuickTemplateSettingsComponent from './components/QuickTemplateSettings.vue';

// Quick template settings registry
export const quickTemplateSettingTab: SettingsRegistry<QuickTemplateSettings> = {
    name: 'quickTemplate',
    settingTabName: getLocalizedText({ en: "Quick Template", zh: "快速模板" }),
    description: 'Settings for quick template',
    defaultConfigs: DEFAULT_QUICK_TEMPLATE_SETTINGS,
    component: QuickTemplateSettingsComponent
};

// 导出模板管理器
export { QuickTemplateManager } from './quickTemplateManager';

// 导出类型
export type { TemplateConfig, QuickTemplateSettings } from './types';