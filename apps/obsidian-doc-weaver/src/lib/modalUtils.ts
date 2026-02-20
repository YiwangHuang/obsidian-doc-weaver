import { App, Modal } from 'obsidian';
import { getLocalizedText } from './textUtils';
/**
 * 确认对话框 Modal
 * 用于替代原生的 confirm() 方法
 */
export class ConfirmModal extends Modal {
    private message: string;
    private onConfirm: () => void;
    private onCancel: () => void;

    constructor(app: App, message: string, onConfirm: () => void, onCancel?: () => void) {
        super(app);
        this.message = message;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel || (() => {});
    }

    onOpen() {
        const { contentEl } = this;
        
        // 添加消息内容
        contentEl.createEl('p', { text: this.message });
        
        // 创建按钮容器
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';
        
        // 创建确认按钮
        const confirmBtn = buttonContainer.createEl('button', { 
            text: getLocalizedText({ en: 'Confirm', zh: '确认' }),
            cls: 'mod-cta'
        });
        confirmBtn.addEventListener('click', () => {
            this.close();
            this.onConfirm();
        });
        
        // 创建取消按钮
        const cancelBtn = buttonContainer.createEl('button', { 
            text: getLocalizedText({ en: 'Cancel', zh: '取消' })
        });
        cancelBtn.addEventListener('click', () => {
            this.close();
            this.onCancel();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}