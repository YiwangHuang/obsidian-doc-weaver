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
    <div class="module-section no-border">
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
        ghost-class="ghost"
        @end="handleDragEnd()"
      >
        <template #item="{ element: tag, index }">
          <div 
            class="tag-item"
            :class="{ 'tag-enabled': tag.enabled, 'tag-disabled': !tag.enabled }"
            draggable="true"
          >
            <MultiColumn :columns="[
              { width: 2, align: 'left' },   // 标签名称栏
              { width: 3, align: 'left' },   // 预览栏
              { width: 2, align: 'right' }   // 操作按钮栏
            ]">
              <!-- 标签名称栏 -->
              <template #column-0>
                <span class="tag-name">{{ tag.name }}</span>
              </template>

              <!-- 预览栏 -->
              <template #column-1>
                <span class="tag-preview">
                  <code>{{ tag.prefix }}</code>
                  <span class="tag-separator">...</span>
                  <code>{{ tag.suffix }}</code>
                </span>
              </template>

              <!-- 操作按钮栏 -->
              <template #column-2>
                <span class="horizontal-stack" @mousedown.stop @click.stop>
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
                    description="删除此标签配置"
                    class="icon-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </Button>
                </span>
              </template>
            </MultiColumn>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 标签编辑弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
      @update:visible="onModalVisibilityChange"
    >
      <div v-if="editingTag" class="tag-modal-form">
        <h2 class="modal-title">
          <LocalizedText en="Edit Tag Configuration" zh="编辑标签配置" />: {{ editingTag.name }}
        </h2>
        <div class="form-group">
          <label><LocalizedText en="Tag Name" zh="标签名称" />：</label>
          <TextInput
            v-model="editingTag.name"
            placeholder="Enter tag name..."
            @update:model-value="debouncedSave"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label><LocalizedText en="Start Tag" zh="开始标签" />：</label>
            <TextInput
              v-model="editingTag.prefix"
              placeholder="e.g. <div>, **, <!--"
              @update:model-value="debouncedSave"
            />
          </div>

          <div class="form-group">
            <label><LocalizedText en="End Tag" zh="结束标签" />：</label>
            <TextInput
              v-model="editingTag.suffix"
              placeholder="e.g. </div>, **, -->"
              @update:model-value="debouncedSave"
            />
          </div>
        </div>
        
        <div class="preview-section">
          <h4><LocalizedText en="Preview" zh="预览" /></h4>
          <div class="preview-example">
            <code>{{ editingTag.prefix }}</code>
            <span class="selected-text"><LocalizedText en="Selected Text" zh="选中的文本" /></span>
            <code>{{ editingTag.suffix }}</code>
          </div>
        </div>
      </div>
    </ObsidianVueModal>

    <!-- 添加新标签按钮 -->
    <div class="module-section" style="display: flex; justify-content: center;">
      <Button
        variant="primary"
        @click="addNewTag"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <LocalizedText en="Add Tag Configuration" zh="添加标签配置" />
      </Button>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model:visible="deleteConfirmVisible"
      :obsidian-app="plugin.app"
      :onConfirm="confirmDelete"
      :onCancel="cancelDelete"
    >
      <h2 class="modal-title"><LocalizedText en="Confirm Delete Tag Configuration" zh="确认删除标签配置" /></h2>
      <p><LocalizedText en="Are you sure you want to delete this tag configuration?" zh="确认要删除此标签配置吗？" /></p>
    </ConfirmDialog>
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
import MultiColumn from '../../vue/components/MultiColumn.vue';
import ConfirmDialog from '../../vue/components/ConfirmDialog.vue';
import { debugLog } from '../../lib/testUtils';
// TODO: 目前启用禁用标签，需要重启obsidian应用后才能生效，需要改为实时生效
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
    // 更新插件设置
    props.plugin.settingList.tagWrapper = { ...settings };
    
    // 保存到磁盘
    await props.plugin.saveData(props.plugin.settingList);
    
    // 发出设置变更事件
    emit('settings-changed', settings);
    
    debugLog('Tag wrapper settings saved');
  } catch (error) {
    debugLog('Failed to save tag wrapper settings:', error);
  }
};

// 创建防抖保存函数
const debouncedSave = debounce(saveSettings, 500);

/**
 * 保存设置并处理拖拽结束
 */
const handleDragEnd = () => {
  debugLog('Drag ended, order saved');
  // 拖拽结束后自动保存
  debouncedSave();
};

/**
 * 处理标签启用状态变更
 */
const handleTagEnabledChange = (index: number, enabled: boolean) => {
  debugLog(`Tag ${index} enabled:`, enabled);
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
  deleteTagIndex.value = index;
  deleteConfirmVisible.value = true;
};

/**
 * 执行删除操作
 */
const confirmDelete = () => {
  if (deleteTagIndex.value === null) return;
  
  debugLog('Tag deleted:', settings.tags[deleteTagIndex.value].name);
  settings.tags.splice(deleteTagIndex.value, 1);
  deleteTagIndex.value = null;
  debouncedSave();
};

/**
 * 取消删除操作
 */
const cancelDelete = () => {
  deleteTagIndex.value = null;
};

/**
 * 添加新标签配置
 */
const addNewTag = () => {
  const newTag = createNewTagConfig();
  
  debugLog('New tag added:', newTag.name);
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
@import '../../vue/shared-styles.css';

.tag-wrapper-settings {
  padding: 0;
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
  margin: 0 8px;
}

.tag-preview {
  font-size: 13px;
  color: var(--text-muted);
}

.tag-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

/* 弹窗表单样式 */
.tag-modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.selected-text {
  color: var(--text-normal);
  background: #e3f2fd;
  padding: 2px 4px;
  border-radius: 3px;
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
</style> 