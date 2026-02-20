import type { FieldDef } from "../lib/configIOUtils";
import { ConfigIO } from "../lib/configIOUtils";

/**
 * Base 模块设置接口
 * 目前不包含任何实际配置字段，仅作为占位类型。
 */
export interface BaseSettings {
    showFeatureDescription: boolean;
    // 暂无配置项，占位用
}



const baseSettingsFields: Record<keyof BaseSettings, FieldDef> = {
    showFeatureDescription: { type: 'boolean', required: true, default: true },
};

/**
 * BaseSettings 读写中间层
 * 使用 ConfigIO 统一管理设置的校验与默认值（当前为空对象）。
 */
class BaseSettingsIO extends ConfigIO<BaseSettings> {
    constructor() {
        // 传入空的字段定义对象，表示当前没有具体配置字段
        super(baseSettingsFields);
    }

    getDefaults(): BaseSettings {
        return super.getDefaults() as BaseSettings;
    }
}

/**
 * BaseSettingsIO 单例实例
 * 供入口文件与管理器复用，集中维护类型与默认值。
 */
export const baseSettingsIO = new BaseSettingsIO();

