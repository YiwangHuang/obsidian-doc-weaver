import { App, Command, FuzzySuggestModal } from "obsidian";

/**
 * 命令选择器返回结果类型
 */
export interface CommandSelectResult {
  commandId: string;
  name: string;
}

/**
 * 命令选择器模态框
 * 继承 FuzzySuggestModal<Command>，提供模糊搜索功能
 */
class CommandPickerModal extends FuzzySuggestModal<Command> {
  private resolveCallback: ((value: CommandSelectResult | null) => void) | null = null;

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
      this.resolveCallback({
        commandId: item.id,
        name: item.name
      });
    }
    this.close();
  }

  /**
   * 设置Promise的resolve回调
   */
  setResolveCallback(callback: (value: CommandSelectResult | null) => void) {
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
 * @returns Promise<CommandSelectResult | null> 返回选择的命令信息，取消则返回null
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
export function openCommandSelector(app: App): Promise<CommandSelectResult | null> {
  return new Promise((resolve) => {
    const modal = new CommandPickerModal(app);
    modal.setResolveCallback(resolve);
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
  const selectCommand = async (): Promise<CommandSelectResult | null> => {
    // 这里需要在Vue组件内部调用，通过inject获取app
    // 示例中假设app已经通过某种方式获取到了
    throw new Error('请在Vue组件内部使用，并传入通过inject获取的app对象');
  };

  return {
    selectCommand
  };
}
