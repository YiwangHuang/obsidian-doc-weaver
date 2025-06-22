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
 * 设置标签页Props
 */
export interface SettingsTabsProps {
    tabs: SettingsRegistry[];
    activeTab: string;
    onTabChange: (tabName: string) => void;
}

/**
 * 设置面板Props
 */
export interface SettingsPanelProps {
    plugin: MyPlugin;
    activeTab: string;
    moduleSettings: SettingsRegistry[];
}

/**
 * 设置状态管理相关类型
 */
export interface SettingsState {
    [key: string]: any;
}

/**
 * 保存状态
 */
export interface SaveState {
    saving: boolean;
    error: string | null;
} 