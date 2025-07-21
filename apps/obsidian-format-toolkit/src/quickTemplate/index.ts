import { SettingsRegistry } from '../main';
import { getLocalizedText } from '../lib/textUtils';
import QuickTemplateSettingTab from './components/QuickTemplateSettingTab.vue';

export const quickTemplateSettingTab: SettingsRegistry = { 
    name: 'quickTemplate',
    settingTabName: getLocalizedText({ en: "Quick Template", zh: "快捷模板" }),
    description: 'Settings for quick template',
    defaultConfigs: {},
    component: QuickTemplateSettingTab
};