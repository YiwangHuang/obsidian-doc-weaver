<!--
  Tag Wrapper模块设置面板
  
  功能说明：
  - 管理标签配置的列表
  - 支持拖拽排序标签配置
  - 支持启用/禁用每个标签配置
  - 支持编辑标签的名称、开始标签、结束标签等
  - 支持添加新的标签配置和删除现有配置
  - 自动保存配置到插件设置
  - 响应式设计，优化的用户体验
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (MyPlugin) 必需
  
  Events:
  - settings-changed: 配置变更时发出，传递新的设置对象
-->
<template>
  <div class="tag-wrapper-settings">
    <div class="module-header">
      <h3><LocalizedText en="Tag Wrapper Settings" zh="标签包装器设置" /></h3>
      <p class="module-description">
        <LocalizedText 
          en="Configure tag wrapper commands, wrap selected text with custom tags, drag to reorder"
          zh="配置标签包装器命令，将选中文本包装在自定义标签中，可拖拽排序"
        />
      </p>
    </div>

    <!-- 可拖拽的标签配置列表 -->
    <draggable
      v-model="settings.tags"
      item-key="id"
      class="tag-configs-list"
      ghost-class="ghost"
      @end="handleDragEnd()"
    >
      <template #item="{ element: tag, index }">
        <div 
          class="tag-item"
          :class="{ 'tag-enabled': tag.enabled, 'tag-disabled': !tag.enabled }"
          draggable="true"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-separator">-</span>
          <span class="tag-preview">
            <code>{{ tag.prefix }}</code>...<code>{{ tag.suffix }}</code>
          </span>
          <span class="tag-actions" @mousedown.stop @click.stop>
            <ToggleSwitch
              v-model="tag.enabled"
              @update:model-value="handleTagEnabledChange(index, $event)"
            />
            <Button
              variant="secondary"
              size="small"
              @click="openTagModal(index)"
              description="编辑此标签配置"
              class="icon-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </Button>
            <Button
              variant="secondary"
              size="small"
              @click="showDeleteConfirm(index)"
              :disabled="settings.tags.length <= 1"
              description="删除此标签配置"
              class="icon-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </Button>
          </span>
        </div>
      </template>
    </draggable>

    <!-- 标签编辑弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
      @update:visible="onModalVisibilityChange"
    >
      <div v-if="editingTag" class="tag-modal-form">
        <h2 class="modal-title">编辑标签配置: {{ editingTag.name }}</h2>
        <div class="form-group">
          <label>标签名称：</label>
          <TextInput
            v-model="editingTag.name"
            placeholder="输入标签名称..."
            @update:model-value="debouncedSave"
          />
        </div>

                 <div class="form-row">
           <div class="form-group">
             <label>开始标签：</label>
             <TextInput
               v-model="editingTag.prefix"
               placeholder="如: <div>、**、<!--"
               @update:model-value="debouncedSave"
             />
           </div>

           <div class="form-group">
             <label>结束标签：</label>
             <TextInput
               v-model="editingTag.suffix"
               placeholder="如: </div>、**、-->"
               @update:model-value="debouncedSave"
             />
           </div>
         </div>
        
        <div class="preview-section">
          <h4>预览</h4>
          <div class="tag-preview-display">
            <p><strong>效果：</strong></p>
                         <div class="preview-example">
               <code>{{ editingTag.prefix }}</code><span class="selected-text">选中的文本</span><code>{{ editingTag.suffix }}</code>
             </div>
          </div>
        </div>
      </div>
    </ObsidianVueModal>

    <!-- 添加新标签按钮 -->
    <div class="add-tag-section">
      <Button
        variant="primary"
        @click="addNewTag"
        class="add-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <LocalizedText en="Add Tag Configuration" zh="添加标签配置" />
      </Button>
    </div>

    <!-- 保存状态指示器 -->
    <div v-if="saveState.saving" class="save-indicator">
      <span class="loading-spinner"></span>
      正在保存配置...
    </div>
    <div v-if="saveState.error" class="error-indicator">
      保存失败：{{ saveState.error }}
    </div>

    <!-- 删除确认弹窗 -->
    <ObsidianVueModal
      v-model:visible="deleteConfirmVisible"
      :obsidian-app="plugin.app"
    >
      <div class="confirm-delete-form">
        <h2 class="modal-title"><LocalizedText en="Confirm Delete Tag Configuration" zh="确认删除标签配置" /></h2>
        <p><LocalizedText en="Are you sure you want to delete this tag configuration?" zh="确认要删除此标签配置吗？" /></p>
        <div class="form-actions">
          <Button
            variant="secondary"
            @click="deleteConfirmVisible = false"
          >
            <LocalizedText en="Cancel" zh="取消" />
          </Button>
          <Button
            variant="primary"
            @click="confirmDelete"
          >
            <LocalizedText en="Confirm Delete" zh="确认删除" />
          </Button>
        </div>
      </div>
    </ObsidianVueModal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import draggable from 'vuedraggable';
import type MyPlugin from '../../main';
import type { 
  TagConfig, 
  TagWrapperSettings
} from '../types';
import { 
  DEFAULT_TAG_WRAPPER_SETTINGS,
  createNewTagConfig
} from '../types';
import { debounce } from '../../vue/utils';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import ToggleSwitch from '../../vue/components/ToggleSwitch.vue';
import TextInput from '../../vue/components/TextInput.vue';
import Button from '../../vue/components/Button.vue';
import LocalizedText from '../../vue/components/LocalizedText.vue';

// 定义Props
interface TagWrapperSettingsProps {
  plugin: MyPlugin;
}

// 定义Events
interface TagWrapperSettingsEmits {
  (e: 'settings-changed', settings: TagWrapperSettings): void;
}

const props = defineProps<TagWrapperSettingsProps>();
const emit = defineEmits<TagWrapperSettingsEmits>();

// 保存状态
const saveState = reactive({
  saving: false,
  error: null as string | null
});

// 初始化设置
const settings = reactive<TagWrapperSettings>({
  tags: [...(props.plugin.settingList.tagWrapper as TagWrapperSettings || DEFAULT_TAG_WRAPPER_SETTINGS).tags]
});

// 弹窗状态
const modalVisible = ref(false);
const editingTag = ref<TagConfig | null>(null);
const deleteConfirmVisible = ref(false);
const deleteTagIndex = ref<number | null>(null);

/**
 * 保存设置到插件
 */
const saveSettings = async () => {
  try {
    saveState.saving = true;
    saveState.error = null;
    
    // 更新插件设置
    props.plugin.settingList.tagWrapper = { ...settings };
    
    // 保存到磁盘
    await props.plugin.saveData(props.plugin.settingList);
    
    // 发出设置变更事件
    emit('settings-changed', settings);
    
    console.log('✅ Tag wrapper settings saved successfully');
  } catch (error) {
    console.error('❌ Failed to save tag wrapper settings:', error);
    saveState.error = error instanceof Error ? error.message : 'Unknown error';
  } finally {
    saveState.saving = false;
  }
};

// 创建防抖保存函数
const debouncedSave = debounce(saveSettings, 500);

/**
 * 保存设置并处理拖拽结束
 */
const handleDragEnd = () => {
  console.log('🏁 拖拽结束，保存新顺序');
  // 拖拽结束后自动保存
  debouncedSave();
};

/**
 * 处理标签启用状态变更
 */
const handleTagEnabledChange = (index: number, enabled: boolean) => {
  console.log(`🔄 标签 ${index} 启用状态变更为: ${enabled}`);
  settings.tags[index].enabled = enabled;
  debouncedSave();
};

/**
 * 打开标签编辑弹窗
 */
const openTagModal = (index: number) => {
  editingTag.value = settings.tags[index];
  modalVisible.value = true;
};

/**
 * 显示删除确认弹窗
 */
const showDeleteConfirm = (index: number) => {
  if (settings.tags.length <= 1) {
    return;
  }
  deleteTagIndex.value = index;
  deleteConfirmVisible.value = true;
};

/**
 * 执行删除操作
 */
const confirmDelete = () => {
  if (deleteTagIndex.value === null) return;
  
  console.log(`🗑️ 删除标签配置: ${settings.tags[deleteTagIndex.value].name}`);
  settings.tags.splice(deleteTagIndex.value, 1);
  deleteConfirmVisible.value = false;
  deleteTagIndex.value = null;
  debouncedSave();
};

/**
 * 添加新标签配置
 */
const addNewTag = () => {
  const newTag = createNewTagConfig();
  
  console.log(`➕ 添加新标签配置: ${newTag.name}`);
  settings.tags.push(newTag);
  debouncedSave();
};

/**
 * 处理弹窗可见性变更
 */
const onModalVisibilityChange = (visible: boolean) => {
  if (!visible) {
    // 弹窗关闭时，清理状态
    editingTag.value = null;
    debouncedSave();
  }
};
</script>

<style scoped>
.tag-wrapper-settings {
  padding: 0;
}

.module-header {
  margin-bottom: 24px;
}

.module-header h3 {
  margin: 0 0 8px 0;
  color: var(--text-normal);
  font-size: 18px;
  font-weight: 600;
}

.module-description {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.4;
}

/* 拖拽列表样式 */
.tag-configs-list {
  margin-bottom: 24px;
}

/* 拖拽时的ghost效果 - 只改变边框颜色 */
.ghost {
  border-color: var(--interactive-accent) !important;
}

.tag-item {
  padding: 9px;
  margin-bottom: 9px;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.tag-enabled {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  opacity: 1;
}

.tag-disabled {
  background: #f9fafb;
  border: 2px solid #d1d5db;
  opacity: 0.6;
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal);
}

.tag-separator {
  color: var(--text-muted);
  margin: 0 4px;
}

.tag-preview {
  font-size: 13px;
  color: var(--text-muted);
  min-width: 150px;
  margin-left: auto;
}

.tag-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-left: auto;
}

.tag-preview code {
  background: var(--background-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-monospace);
  font-size: 12px;
  color: var(--text-accent);
}

/* 弹窗表单样式 */
.tag-modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-title {
  color: var(--text-normal);
  font-weight: 600;
  margin: 0 0 16px 0;
  font-size: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-normal);
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-section {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  position: relative;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-normal);
  font-size: 14px;
  font-weight: 600;
}

.tag-preview-display p {
  margin: 0 0 8px 0;
  font-size: 13px;
}

.preview-example {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  font-family: var(--font-monospace);
  font-size: 13px;
}

.preview-example code {
  background: var(--background-secondary);
  padding: 2px 4px;
  border-radius: 3px;
  color: var(--text-accent);
}

.selected-text {
  color: var(--text-normal);
  background: #e3f2fd;
  padding: 2px 4px;
  border-radius: 3px;
}

/* 添加按钮区域 */
.add-tag-section {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--background-modifier-border);
  display: flex;
  justify-content: center;
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

/* 状态指示器 */
.save-indicator, .error-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 16px;
}

.save-indicator {
  background: var(--background-modifier-success);
  color: var(--text-success);
}

.error-indicator {
  background: var(--background-modifier-error);
  color: var(--text-error);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-success);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .tag-item {
    padding: 12px;
  }
}

/* 图标按钮样式 */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px !important;
  min-width: 28px;
  height: 28px;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  color: var(--text-normal);
}

.icon-btn:hover svg {
  color: var(--text-accent);
}

/* 确认弹窗样式 */
.confirm-delete-form {
  padding: 16px;
}

.confirm-delete-form p {
  margin: 0 0 20px 0;
  color: var(--text-normal);
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 