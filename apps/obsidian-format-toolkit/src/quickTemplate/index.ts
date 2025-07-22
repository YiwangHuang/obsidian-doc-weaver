/**
 * Quick Template 模块入口
 */

import { SettingsRegistry } from '../main';
import { DEFAULT_QUICK_TEMPLATE_SETTINGS } from './types';
import { getLocalizedText } from '../lib/textUtils';
import QuickTemplateSettings from './components/QuickTemplateSettings.vue';

// Quick template settings registry
export const quickTemplateSettingTab: SettingsRegistry = {
    name: 'quickTemplate',
    settingTabName: getLocalizedText({ en: "Quick Template", zh: "快捷模板" }),
    description: 'Settings for quick template commands',
    defaultConfigs: DEFAULT_QUICK_TEMPLATE_SETTINGS,
    component: QuickTemplateSettings
};

// 导出模板管理器
export { QuickTemplateManager } from './quickTemplateManager';

// 导出类型
export type { TemplateConfig, QuickTemplateSettings } from './types';