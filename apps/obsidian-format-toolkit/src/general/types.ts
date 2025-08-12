/**
 * 编辑工具栏相关类型定义
 */

/**
 * 工具栏项目类型定义
 * 支持自包含的树形结构，类似文件和文件夹结构，以适配二级菜单
 */
export interface ToolbarItem {
  /** 项目唯一标识符（可选，用于执行命令） */
  commandId?: string;
  
  /** 显示名称 */
  name: string;
  
  /** 图标名称（Obsidian 图标） */
  icon?: string;

  /**
   * 是否启用此项目
   * 默认为 true
   */
  enabled: boolean;
  
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
  children?: ToolbarItem[];
}

/**
 * 单个命令配置接口，修改需同步修改类型守卫函数isExtraCommandConfig
 */
export interface ExtraCommandConfig extends ToolbarItem {
    /** 命令ID，用于执行Obsidian命令 */
    commandId: string;
    /** 显示名称 */
    name: string;
    /** 图标名称 */
    icon: string;
    /** 是否启用 */
    enabled: boolean;
}

/**
 * 类型守卫函数：检查对象是否符合 ExtraCommandConfig 接口
 * @param obj 要检查的对象
 * @returns 是否符合 ExtraCommandConfig 接口
 */
export function isExtraCommandConfig(obj: unknown): obj is ExtraCommandConfig {
    if (!obj || typeof obj !== 'object') return false;
    
    const cmd = obj as Record<string, unknown>;
    return typeof cmd.commandId === 'string' &&
           typeof cmd.name === 'string' &&
           typeof cmd.enabled === 'boolean' &&
           typeof cmd.icon === 'string';
}