import type MyPlugin from '../../main';
import type { SettingsRegistry } from '../../main';

/**
 * Vue组件Props类型定义
 */
export interface SettingsAppProps {
    plugin: MyPlugin;
    moduleSettings: SettingsRegistry[];
}

/**
 * 设置状态管理相关类型
 */
export interface SettingsState {
    [key: string]: any;
}