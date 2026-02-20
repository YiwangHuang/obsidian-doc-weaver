/**
 * Base 模块入口
 * 提供一个不包含实际功能的基础模块，仅用于在设置面板中占位。
 */

import type { ModuleRegistration } from '../main';
import { getLocalizedText } from '../lib/textUtils';
import BaseSettingsComponent from './components/BaseSettings.vue';
import type { BaseSettings } from './types';
import { baseSettingsIO } from './types';
import { DEBUG } from '../lib/debugUtils';

/**
 * Base 模块设置注册信息
 * 通过 ModuleRegistration 接口向主插件声明本模块的基本元数据与默认配置。
 */
export const baseInfo: ModuleRegistration<BaseSettings> = {
    name: 'base',
    settingTabName: getLocalizedText({ en: "Base", zh: "基础" }),
    description: 'Placeholder module without concrete functionality, reserved for future extensions.',
    // 通过 ConfigIO 统一管理默认配置，当前为空对象，占位使用
    defaultConfigs: baseSettingsIO.getDefaults(),
    component: BaseSettingsComponent,
    hideSettingTab: !DEBUG,
};

// 导出管理器，供主插件在 onload 时初始化
export { BaseManager } from './baseManager';

// 导出类型与 IO，方便其他模块复用
export type { BaseSettings } from './types';
export { baseSettingsIO } from './types';

