/**
 * Toolbar 模块入口
 */

import { ModuleRegistration } from '../main';
import { getLocalizedText } from '../lib/textUtils';
import ToolbarSettingsComponent from './components/ToolbarSettings.vue';
import type { ExtraCommandConfig } from './types';
import { ConfigIO } from '../lib/configIOUtils';

/**
 * 通用模块设置接口，新增字段需同步修改 ToolbarSettingsIO
 */
export interface ToolbarSettings {
    /** 是否显示 SpeedDial 悬浮按钮 */
    showToolBar: boolean;
    /** 自定义命令配置数组 */
    extraCommands: ExtraCommandConfig[];
}

/**
 * ToolbarSettings 读写中间层
 * 集中维护模块设置的校验与默认值
 */
class ToolbarSettingsIO extends ConfigIO<ToolbarSettings> {
    constructor() {
        super({
            showToolBar: { type: 'boolean', required: true, default: true },
            extraCommands: { type: 'array', required: true, default: [] },
        });
    }

    /** 覆盖父类返回值类型，便于调用侧直接获得完整类型 */
    getDefaults(): ToolbarSettings {
        return super.getDefaults() as ToolbarSettings;
    }
}

/** 单例实例：供入口和管理器复用 */
export const toolbarSettingsIO = new ToolbarSettingsIO();

// Toolbar settings registry
export const toolbarInfo: ModuleRegistration<ToolbarSettings> = {
    name: 'toolbar',
    settingTabName: getLocalizedText({ en: "Toolbar", zh: "工具栏" }),
    description: 'Settings for toolbar functionality',
    // 通过 ConfigIO 统一管理默认配置，避免散落常量
    defaultConfigs: toolbarSettingsIO.getDefaults(),
    component: ToolbarSettingsComponent
};

// 导出管理器
export { ToolbarManager } from './toolbarManager';

// 导出类型
export type { ExtraCommandConfig } from './types';