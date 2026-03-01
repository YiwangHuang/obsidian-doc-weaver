import { App, FuzzySuggestModal, FuzzyMatch, setIcon, getIconIds } from "obsidian";
import { getLocalizedText } from "./textUtils";

/**
 * 图标选择器模态框
 * 继承 FuzzySuggestModal<string>，提供模糊搜索功能
 */
class IconPickerModal extends FuzzySuggestModal<string> {
  private resolveCallback: ((value: string | null) => void) | null = null;

  constructor(app: App) {
    super(app);
    this.setPlaceholder(getLocalizedText({ en: "Select an icon (view all icons at https://lucide.dev)", zh: "选择图标（查看全部图标：https://lucide.dev）" }));
  }

  /**
   * 复制原项目的文本格式化方法
   */
  private capitalJoin(string: string): string {
    const icon = string.split(" ");
    return icon
      .map((icon) => {
        return icon[0].toUpperCase() + icon.substring(1);
      })
      .join(" ");
  }

  /**
   * 获取所有可用图标
   */
  getItems(): string[] {
    // 从原项目复制的完整图标列表
    return getIconIds();
  }

  /**
   * 获取图标显示文本 - 复制原项目的格式化逻辑
   */
  getItemText(item: string): string {
    return this.capitalJoin(
      item
        .replace("feather-", "")
        .replace("remix-", "")
        .replace("bx-", "")
        .replace(/([A-Z])/g, " $1")
        .trim()
        .replace(/-/gi, " ")
    );
  }

  /**
   * 渲染建议项 - 复制原项目的图标预览功能
   */
  renderSuggestion(icon: FuzzyMatch<string>, iconItem: HTMLElement): void {
    const span = iconItem.createSpan({ cls: "editingToolbarIconPick" });
    setIcon(span, icon.item); // 使用 Obsidian 的 setIcon 渲染图标
    super.renderSuggestion(icon, iconItem);
  }

  /**
   * 当用户选择图标时触发
   */
  onChooseItem(item: string): void {
    if (this.resolveCallback) {
      this.resolveCallback(item);
    }
    this.close();
  }

  /**
   * 设置Promise的resolve回调
   */
  setResolveCallback(callback: (value: string | null) => void) {
    this.resolveCallback = callback;
  }

  /**
   * 模态框关闭时，如果没有选择则返回null
   */
  onClose() {
    super.onClose();
    if (this.resolveCallback) {
      this.resolveCallback(null);
    }
  }
}

/**
 * 打开图标选择器
 * @param app Obsidian App 实例
 * @returns Promise<string | null> 返回选择的图标名称，取消则返回null
 * 
 * @example
 * // 在Vue组件中使用
 * import { inject } from 'vue';
 * import { openIconSelector } from './iconSelector';
 * 
 * const app = inject('obsidian-app'); // 通过inject获取app对象
 * 
 * const handleSelectIcon = async () => {
 *   const iconName = await openIconSelector(app);
 *   if (iconName) {
 *     console.log('选择的图标:', iconName);
 *   }
 * };
 */
/**
 * 打开图标选择器
 * 
 * 修复说明：
 * 原问题：FuzzySuggestModal在显示后会意外触发一次onClose事件，导致Promise被resolve(null)锁定，
 * 即使用户随后选择了图标，也无法覆盖已经resolved的Promise。
 * 
 * 解决方案：创建智能resolve包装器，优先处理用户的实际选择：
 * 1. 取消操作（null值）延迟100ms处理，为用户选择留出时间
 * 2. 用户选择（非null值）立即处理，具有最高优先级
 * 3. 使用isResolved标志确保Promise只被resolve一次
 */
export function openIconSelector(app: App): Promise<string | null> {
  return new Promise((resolve) => {
    const modal = new IconPickerModal(app);
    
    // 创建智能resolve包装器，优先处理用户选择
    let isResolved = false;
    let pendingCancel = false;
    const safeResolve = (value: string | null) => {
      if (value === null) {
        // 取消操作：延迟处理，给用户选择留出时间
        if (!isResolved) {
          pendingCancel = true;
          setTimeout(() => {
            if (pendingCancel && !isResolved) {
              isResolved = true;
              resolve(null);
            }
          }, 100);
        }
      } else {
        // 用户选择：立即处理，优先级最高
        if (!isResolved) {
          isResolved = true;
          pendingCancel = false; // 取消待处理的取消操作
          resolve(value);
        }
      }
    };
    
    modal.setResolveCallback(safeResolve);
    modal.open();
  });
}

/**
 * Vue Composition API 钩子函数
 * 提供更便捷的在Vue组件中使用的方式
 * 
 * @example
 * // 在Vue组件中使用
 * import { useIconSelector } from './iconSelector';
 * 
 * const { selectIcon } = useIconSelector();
 * 
 * const handleClick = async () => {
 *   const iconName = await selectIcon();
 *   if (iconName) {
 *     console.log('选择的图标:', iconName);
 *   }
 * };
 */
// export function useIconSelector() {
//   // 在Vue组件中，app对象通常通过inject获取
//   const selectIcon = async (): Promise<string | null> => {
//     // 这里需要在Vue组件内部调用，通过inject获取app
//     // 示例中假设app已经通过某种方式获取到了
//     throw new Error('请在Vue组件内部使用，并传入通过inject获取的app对象');
//   };

//   return {
//     selectIcon
//   };
// }
