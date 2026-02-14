import { Notice } from "obsidian";

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

    /**
     * 校验并修复单个字段
     * @param silent 为 true 时静默修复（不弹 Notice），用于 sanitize 场景
     * @returns true = 合法或已修复；false = 无法修复
     */
    private repairField(record: Record<string, unknown>, key: string, def: FieldDef, silent = false): boolean {
        if (this.isFieldValid(record[key], def)) return true;
        if (!('default' in def)) return false;
        if (!silent) {
            const old = record[key] === undefined ? '(缺失)' : JSON.stringify(record[key]);
            new Notice(`配置项 "${key}" 的值 ${old} 无效，已重置为默认值: ${JSON.stringify(def.default)}`);
        }
        record[key] = def.default;
        return true;
    }

    /** 类型守卫：校验并自动修复（弹 Notice） */
    isValid(obj: unknown): obj is T {
        if (!obj || typeof obj !== 'object') return false;
        const record = obj as Record<string, unknown>;
        let ok = true;
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            if (!this.repairField(record, key, def)) ok = false;
        }
        return ok;
    }

    /** 安全解析：合法返回 T，否则 undefined */
    parse(obj: unknown): T | undefined {
        return this.isValid(obj) ? obj : undefined;
    }

    /** 静默修复所有不合法或缺失的字段（不弹 Notice） */
    sanitize(config: T): T {
        const record = config as Record<string, unknown>;
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            this.repairField(record, key, def, true);
        }
        return config;
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
}

/** 常用的 validate 工具函数 */
export const oneOf = (...values: unknown[]) => (v: unknown) => values.includes(v);
export const between = (min: number, max: number) => (v: unknown) => typeof v === 'number' && v >= min && v <= max;