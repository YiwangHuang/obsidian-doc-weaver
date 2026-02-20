import { DEBUG } from "./debugUtils";
import { Notice } from "obsidian";
import { getLocalizedText } from "./textUtils";
// ======================== 字段描述符 ========================

/** 支持的字段类型：基础类型 + 数组（仅检查 Array.isArray） */
export type FieldType = 'string' | 'number' | 'boolean' | 'array';

/** 字段描述符：类型、是否必填、约束、默认值 */
export interface FieldDef {
    type: FieldType;
    required: boolean;
    /** 自定义校验函数，返回 true 表示合法（在基础类型检查通过后调用） */
    validate?: (value: unknown) => boolean;
    /** 默认值，不提供表示无默认值（如 id 需动态生成） */
    default?: unknown;
}

// ======================== ConfigIO ========================

/**
 * 通用配置读写中间层
 * 直接 new ConfigIO<T>(fieldDefs) 即可，无需继承
 */
export class ConfigIO<T extends object> {
    protected readonly fieldDefs: Record<string, FieldDef>;

    constructor(fieldDefs: Record<string, FieldDef>) {
        this.fieldDefs = fieldDefs;
    }

    /** 纯检查：字段值是否合法 */
    private isFieldValid(value: unknown, def: FieldDef): boolean {
        if (value === undefined) return !def.required;
        if (def.type === 'array') return Array.isArray(value);
        if (typeof value !== def.type) return false;
        if (def.validate && !def.validate(value)) return false;
        return true;
    }

    /** 校验并修复单个字段；返回 true = 合法或已修复，false = 无法修复；silent 为 true 时静默修复（不弹 Notice） */
    private repairField(record: Record<string, unknown>, key: string, def: FieldDef, silent = !DEBUG): boolean {
        if (this.isFieldValid(record[key], def)) return true;
        if (!('default' in def)) return false;
        if (!silent) {
            const old = record[key] === undefined ? getLocalizedText({en: '(missing)', zh: '(缺失)'}) : JSON.stringify(record[key]);
            new Notice(getLocalizedText({ 
                en: `Configuration item "${key}" value ${old} is invalid, reset to default value: ${JSON.stringify(def.default)}`, 
                zh: `配置项 "${key}" 的值 ${old} 无效，已重置为默认值: ${JSON.stringify(def.default)}` }), 5000)
        }
        record[key] = def.default;
        return true;
    }

    /**
     * 原地修复对象中所有非法或缺失的字段
     * @param obj 需要修复的对象
     * @param silent 为 true 时静默修复（不弹 Notice）
     * @returns true = 全部字段合法或已修复；false = 存在无法修复的字段（obj 为 null/非对象或有无默认值的必填字段）
     */
    sanitize(obj: unknown, silent?: boolean): obj is T {
        if (!obj || typeof obj !== 'object') return false;
        const record = obj as Record<string, unknown>;
        let ok = true;
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            if (!this.repairField(record, key, def, silent)) ok = false;
        }
        return ok;
    }

    /** 获取指定字段的默认值 */
    getDefault(key: string): unknown {
        const def = this.fieldDefs[key];
        return def && 'default' in def ? def.default : undefined;
    }

    /** 获取所有有默认值的字段 */
    getDefaults(): Partial<T> {
        const result: Record<string, unknown> = {};
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            if ('default' in def) result[key] = def.default;
        }
        return result as Partial<T>;
    }

    /**
     * 确保配置有效：不存在时返回默认值，存在时原地修复并返回
     * 集中处理"校验 + 修复 + 兜底重置"逻辑，避免各 Manager 重复实现
     * @param obj 当前持久化的配置（可能为 null/undefined）
     * @param defaults 兜底默认配置（所有字段均无法修复时使用）
     * @returns 有效的配置对象（原地修复后的 obj 或 defaults 的副本）
     */
    ensureValid(obj: unknown, defaults: Partial<T>): Partial<T> {
        if (!obj || typeof obj !== 'object') return { ...defaults };
        if (this.sanitize(obj)) return obj as Partial<T>;
        // sanitize 返回 false 表示存在无法修复的字段，回退到默认配置
        return { ...defaults };
    }
}

/** 常用的 validate 工具函数 */
export const oneOf = (...values: unknown[]) => (v: unknown) => values.includes(v);
export const between = (min: number, max: number) => (v: unknown) => typeof v === 'number' && v >= min && v <= max;