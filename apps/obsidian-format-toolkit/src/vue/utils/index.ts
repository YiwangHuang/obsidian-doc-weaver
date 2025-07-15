import { reactive, watch } from 'vue';
import type MyPlugin from '../../main';
import type { SettingsState, SaveState } from '../types';

/**
 * 防抖函数
 * @param func 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * TODO: 简化这部分实现
 * 设置状态管理组合式函数
 * @param plugin 插件实例
 * @returns 设置状态和相关操作函数
 */
export function useSettingsState(plugin: MyPlugin) {
    // 创建响应式设置状态
    const settings = reactive<SettingsState>(plugin.settingList);
    
    // 保存状态
    const saveState = reactive<SaveState>({
        saving: false,
        error: null
    });

    // 防抖保存函数
    const saveSettings = debounce(async () => {
        saveState.saving = true;
        saveState.error = null;
        
        try {
            await plugin.saveData(settings);
        } catch (error) {
            saveState.error = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to save settings:', error);
        } finally {
            saveState.saving = false;
        }
    }, 500);

    // 监听设置变更并自动保存
    watch(settings, () => {
        saveSettings();
    }, { deep: true });

    return {
        settings,
        saveState,
        saveSettings
    };
} 