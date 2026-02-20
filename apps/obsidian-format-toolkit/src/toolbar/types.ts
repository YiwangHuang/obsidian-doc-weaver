/**
 * 编辑工具栏相关类型定义
 */
import type { FieldDef } from "../lib/configIOUtils";
import { ConfigIO } from "../lib/configIOUtils";


/**
 * 基本项目类型定义
 * 支持自包含的树形结构，类似文件和文件夹结构，以适配二级菜单
 */
export interface BaseConfig {
  /** 项目唯一标识符（可选，用于执行命令） */
  commandId?: string;
  
  /** 显示名称 */
  name: string;
  
  /** 图标名称（Obsidian 图标） */
  icon?: string;

  /** 是否启用此项目，默认为 true */
  enabled: boolean;
}


/**
 * 工具栏项目类型定义
 * 支持自包含的树形结构，类似文件和文件夹结构，以适配二级菜单
 */
export interface ToolbarItemConfig extends BaseConfig {
  /**
   * 是否展开
   * 默认为 false
   */
  unfolded?: boolean;

  /** 
   * 子菜单项目列表
   * 当存在子项时，此项目表现为一个容器（类似文件夹）
   * 当不存在子项时，此项目表现为一个叶子节点（类似文件）
   */
  children?: ToolbarItemConfig[];
}

/**
 * 单个命令配置接口，新增字段需同步修改 extraCommandConfigFields
 */
export interface ExtraCommandConfig extends ToolbarItemConfig {
    /** 命令ID，用于执行Obsidian命令 */
    commandId: string;
    /** 显示名称 */
    name: string;
    /** 图标名称 */
    icon: string;
    /** 是否启用 */
    enabled: boolean;
}

/** ExtraCommandConfig 字段定义：描述类型、是否必填和默认值 */
const extraCommandConfigFields: Record<keyof ExtraCommandConfig, FieldDef> = {
    commandId: { type: 'string',  required: true },
    name:      { type: 'string',  required: true },
    icon:      { type: 'string',  required: true, default: 'question-mark-glyph' },
    enabled:   { type: 'boolean', required: true, default: true },
    unfolded:  { type: 'boolean', required: false, default: false },
    children:  { type: 'array',   required: false, default: [] },
};

/**
 * ExtraCommandConfig 读写中间层
 * 负责命令项配置的校验、默认值和创建逻辑
 */
class ExtraCommandConfigIO extends ConfigIO<ExtraCommandConfig> {
    constructor() {
        super(extraCommandConfigFields);
    }
}

/** 单例实例：供 toolbar 模块复用 */
export const extraCommandConfigIO = new ExtraCommandConfigIO();