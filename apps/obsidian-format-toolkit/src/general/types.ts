/**
 * 编辑工具栏相关类型定义
 */

/**
 * 工具栏项目类型定义
 * 支持自包含的树形结构，类似文件和文件夹结构，以适配二级菜单
 */
export interface ToolbarItem {
  /** 项目唯一标识符 */
  id: string;
  
  /** 显示名称 */
  name: string;
  
  /** 图标名称（Obsidian 图标） */
  icon?: string;

  /**
   * 是否启用此项目
   * 默认为 true
   */
  enabled?: boolean;
  
  /** 
   * 子菜单项目列表
   * 当存在子项时，此项目表现为一个容器（类似文件夹）
   * 当不存在子项时，此项目表现为一个叶子节点（类似文件）
   */
  children?: ToolbarItem[];
  
  /**
   * 按钮触发操作的回调函数
   * 用于自定义操作逻辑
   */
  action?: () => void;
}