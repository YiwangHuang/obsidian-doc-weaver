import { App, FuzzySuggestModal, FuzzyMatch, Modal, setIcon, getIconIds } from "obsidian";

/**
 * 图标数组 - 从原项目复制的完整图标列表
 */
const appIcons = getIconIds()

/**
 * 图标选择器返回结果类型
 */
export interface IconSelectResult {
  iconName: string;
}

/**
 * 自定义SVG图标输入模态框
 */
class CustomIconModal extends Modal {
  private resolveCallback: ((value: string | null) => void) | null = null;
  private currentValue = "";

  constructor(app: App, initialValue?: string) {
    super(app);
    this.currentValue = initialValue || "";
    this.containerEl.addClass("editingToolbar-Modal");
    this.containerEl.addClass("customicon");
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("b", { text: "输入图标代码，格式为 <svg>.... </svg>" });
    
    const textComponent = document.createElement("textarea");
    textComponent.className = "wideInputPromptInputEl";
    textComponent.placeholder = "";
    textComponent.value = this.currentValue;
    textComponent.style.width = "100%";
    textComponent.style.height = "200px";
    contentEl.appendChild(textComponent);
    
    textComponent.addEventListener("input", () => {
      this.currentValue = textComponent.value;
    });

    // 添加确认和取消按钮
    const buttonContainer = contentEl.createDiv({ cls: "custom-icon-buttons" });
    buttonContainer.style.marginTop = "10px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "flex-end";

    const confirmButton = buttonContainer.createEl("button", { text: "确认" });
    confirmButton.style.padding = "5px 15px";
    confirmButton.addEventListener("click", () => {
      if (this.resolveCallback) {
        this.resolveCallback(this.currentValue);
      }
      this.close();
    });

    const cancelButton = buttonContainer.createEl("button", { text: "取消" });
    cancelButton.style.padding = "5px 15px";
    cancelButton.addEventListener("click", () => {
      if (this.resolveCallback) {
        this.resolveCallback(null);
      }
      this.close();
    });

    // 聚焦到文本框
    textComponent.focus();
  }

  onClose() {
    super.onClose();
    if (this.resolveCallback) {
      this.resolveCallback(null);
    }
  }

  setResolveCallback(callback: (value: string | null) => void) {
    this.resolveCallback = callback;
  }
}

/**
 * 图标选择器模态框
 * 继承 FuzzySuggestModal<string>，提供模糊搜索功能
 */
class IconPickerModal extends FuzzySuggestModal<string> {
  private resolveCallback: ((value: string | null) => void) | null = null;

  constructor(app: App) {
    super(app);
    this.setPlaceholder("选择一个图标");
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
    return appIcons;
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
  async onChooseItem(item: string): Promise<void> {
    // 如果选择了 "Custom"，打开自定义SVG输入框
    if (item === "Custom") {
      const customIcon = await this.openCustomIconInput();
      if (this.resolveCallback) {
        this.resolveCallback(customIcon);
      }
    } else {
      // 选择了内置图标
      if (this.resolveCallback) {
        this.resolveCallback(item);
      }
    }
    this.close();
  }

  /**
   * 打开自定义图标输入框
   * 使用相同的智能resolve机制防止意外关闭导致的问题
   */
  private openCustomIconInput(): Promise<string | null> {
    return new Promise((resolve) => {
      const customModal = new CustomIconModal(this.app);
      
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
      
      customModal.setResolveCallback(safeResolve);
      customModal.open();
    });
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
export function useIconSelector() {
  // 在Vue组件中，app对象通常通过inject获取
  const selectIcon = async (): Promise<string | null> => {
    // 这里需要在Vue组件内部调用，通过inject获取app
    // 示例中假设app已经通过某种方式获取到了
    throw new Error('请在Vue组件内部使用，并传入通过inject获取的app对象');
  };

  return {
    selectIcon
  };
}
