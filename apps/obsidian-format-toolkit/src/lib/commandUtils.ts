import { App, Command, FuzzySuggestModal } from "obsidian";

// 变更说明：
// 为了与 Obsidian 的类型对齐，命令选择不再返回自定义的 CommandSelectResult，
// 而是直接返回 Obsidian 提供的 Command 类型。

/**
 * 命令选择器模态框
 * 继承 FuzzySuggestModal<Command>，提供模糊搜索功能
 */
class CommandPickerModal extends FuzzySuggestModal<Command> {
  private resolveCallback: ((value: Command | null) => void) | null = null;

  constructor(app: App) {
    super(app);
    this.setPlaceholder("选择一个命令");
  }

  /**
   * 获取所有可用命令
   */
  getItems(): Command[] {
    // @ts-ignore - app.commands.listCommands() 是 Obsidian 内部 API
    return this.app.commands.listCommands();
  }

  /**
   * 获取命令显示文本
   */
  getItemText(item: Command): string {
    return item.name;
  }

  /**
   * 当用户选择命令时触发
   */
  async onChooseItem(item: Command): Promise<void> {
    if (this.resolveCallback) {
      // 直接返回 Obsidian 的 Command 对象
      this.resolveCallback(item);
    }
    this.close();
  }

  /**
   * 设置Promise的resolve回调
   */
  setResolveCallback(callback: (value: Command | null) => void) {
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
 * 打开命令选择器
 * @param app Obsidian App 实例
 * @returns Promise<Command | null> 返回选择的命令（Obsidian 类型），取消则返回 null
 * 
 * @example
 * // 在Vue组件中使用
 * import { inject } from 'vue';
 * import { openCommandSelector } from './commandSelector';
 * 
 * const app = inject('obsidian-app'); // 通过inject获取app对象
 * 
 * const handleSelectCommand = async () => {
 *   const result = await openCommandSelector(app);
 *   if (result) {
 *     console.log('选择的命令:', result.commandId, result.name);
 *   }
 * };
 */
/**
 * 打开命令选择器（返回 Obsidian 的 Command 类型）
 * 
 * 修复说明：
 * 原问题：FuzzySuggestModal在显示后会意外触发一次onClose事件，导致Promise被resolve(null)锁定，
 * 即使用户随后选择了命令，也无法覆盖已经resolved的Promise。
 * 
 * 解决方案：创建智能resolve包装器，优先处理用户的实际选择：
 * 1. 取消操作（null值）延迟100ms处理，为用户选择留出时间
 * 2. 用户选择（非null值）立即处理，具有最高优先级
 * 3. 使用isResolved标志确保Promise只被resolve一次
 */
export function openCommandSelector(app: App): Promise<Command | null> {
  return new Promise((resolve) => {
    const modal = new CommandPickerModal(app);
    
    // 创建智能resolve包装器，优先处理用户选择
    let isResolved = false;
    let pendingCancel = false;
    const safeResolve = (value: Command | null) => {
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
 * import { useCommandSelector } from './commandSelector';
 * 
 * const { selectCommand } = useCommandSelector();
 * 
 * const handleClick = async () => {
 *   const result = await selectCommand();
 *   if (result) {
 *     console.log('选择的命令:', result);
 *   }
 * };
 */
export function useCommandSelector() {
  // 在Vue组件中，app对象通常通过inject获取
  const selectCommand = async (): Promise<Command | null> => {
    // 这里需要在Vue组件内部调用，通过inject获取app
    // 示例中假设app已经通过某种方式获取到了
    throw new Error('请在Vue组件内部使用，并传入通过inject获取的app对象');
  };

  return {
    selectCommand
  };
}
