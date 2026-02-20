import type DocWeaver from '../../main';
import type { ModuleRegistration } from '../../main';

/**
 * Vue组件Props类型定义
 */
export interface SettingsAppProps {
    plugin: DocWeaver;
    moduleSettings: ModuleRegistration[];
}

/**
 * 设置状态管理相关类型
 */
export interface SettingsState {
    [key: string]: any;
}