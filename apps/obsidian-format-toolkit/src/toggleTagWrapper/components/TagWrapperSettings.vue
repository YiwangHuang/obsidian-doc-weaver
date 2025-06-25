<!--
  Tag Wrapper模块设置面板
  
  功能说明：
  - 管理标签包装器的配置列表
  - 支持拖拽排序标签配置
  - 支持启用/禁用每个标签配置
  - 支持编辑标签的名称、开始标签、结束标签
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
      <h3>标签包装器设置</h3>
      <p class="module-description">
        配置文本包装标签的命令，支持自定义开始和结束标签，可拖拽排序
      </p>
    </div>

    <!-- 可拖拽的标签配置列表 -->
    <draggable
      v-model="settings.tags"
      item-key="id"
      class="tag-configs-list"
      @start="onDragStart"
      @end="onDragEnd"
    >
      <template #item="{ element: tag, index }">
        <div class="tag-item" :class="{ disabled: !tag.enabled }" draggable="true">
          <div class="tag-main-content">
            <div class="tag-info">
              <h4 class="tag-name">{{ tag.name || '(未命名)' }}</h4>
              <div class="tag-preview">
                <code>{{ tag.prefix || '(空)' }}</code>文本内容<code>{{ tag.suffix || '(空)' }}</code>
              </div>
            </div>
            <div class="tag-actions" @mousedown.stop @click.stop>
              <ToggleSwitch
                v-model="tag.enabled"
                @update:model-value="handleTagEnabledChange(index, $event)"
              />
              <Button
                variant="secondary"
                size="small"
                @click="openTagModal(index)"
              >
                编辑
              </Button>
              <Button
                variant="danger"
                size="small"
                @click="deleteTag(index)"
                :disabled="settings.tags.length <= 1"
                title="删除此标签配置"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- 标签编辑弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
      :title="`编辑标签配置: ${currentTag?.name || '未命名'}`"
    >
      <div v-if="currentTag" class="tag-modal-form">
        <div class="form-group">
          <label>命令名称：</label>
          <TextInput
            v-model="currentTag.name"
            placeholder="输入命令名称..."
            @update:model-value="debouncedSave"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>开始标签：</label>
            <TextInput
              v-model="currentTag.prefix"
              placeholder="如: **, <u>, =="
              @update:model-value="debouncedSave"
            />
          </div>

          <div class="form-group">
            <label>结束标签：</label>
            <TextInput
              v-model="currentTag.suffix"
              placeholder="如: **, </u>, =="
              @update:model-value="debouncedSave"
            />
          </div>
        </div>

        <div class="form-group">
          <label>启用状态：</label>
          <ToggleSwitch
            v-model="currentTag.enabled"
            @update:model-value="debouncedSave"
          />
        </div>

        <div class="preview-section">
          <h4>预览</h4>
          <div class="tag-preview">
            <p><strong>命令：</strong>Toggle {{ currentTag.name || '(未命名)' }}</p>
            <p><strong>效果：</strong><code>{{ currentTag.prefix }}选中文本{{ currentTag.suffix }}</code></p>
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
        添加新标签配置
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
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import draggable from 'vuedraggable';
import type MyPlugin from '../../main';
import type { TagConfig, TagWrapperSettings } from '../settings';
import { DEFAULT_TAG_WRAPPER_SETTINGS } from '../settings';
import { debounce } from '../../vue/utils';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import ToggleSwitch from '../../vue/components/ToggleSwitch.vue';
import TextInput from '../../vue/components/TextInput.vue';
import Button from '../../vue/components/Button.vue';

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
const currentTag = ref<TagConfig | null>(null);

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
 * 拖拽开始事件
 */
const onDragStart = () => {
  console.log('🚀 开始拖拽标签配置');
};

/**
 * 拖拽结束事件
 */
const onDragEnd = () => {
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
  currentTag.value = { ...settings.tags[index] };
  modalVisible.value = true;
};

/**
 * 删除标签配置
 */
const deleteTag = (index: number) => {
  if (settings.tags.length <= 1) {
    console.warn('⚠️ 至少需要保留一个标签配置');
    return;
  }
  
  console.log(`🗑️ 删除标签配置: ${settings.tags[index].name}`);
  settings.tags.splice(index, 1);
  debouncedSave();
};

/**
 * 添加新标签配置
 */
const addNewTag = () => {
  const hexId = Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
  const newTag: TagConfig = {
    id: `tag-${hexId}`,
    name: `新标签 ${hexId}`,
    prefix: '<tag>',
    suffix: '</tag>',
    enabled: true
  };
  
  console.log(`➕ 添加新标签配置: ${newTag.name}`);
  settings.tags.push(newTag);
  debouncedSave();
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

.tag-item {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.tag-item:hover {
  background: var(--background-modifier-hover);
  border-color: var(--background-modifier-border-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-item:active {
  cursor: grabbing;
}

.tag-item.disabled {
  opacity: 0.6;
}

.tag-main-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tag-info {
  flex: 1;
  min-width: 0;
}

.tag-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-normal);
  line-height: 1.3;
}

.tag-preview {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.tag-preview code {
  background: var(--background-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-monospace);
  font-size: 12px;
  color: var(--text-accent);
}

.tag-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
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

.preview-section {
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 6px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-normal);
  font-size: 14px;
  font-weight: 600;
}

.tag-preview p {
  margin: 0 0 8px 0;
  font-size: 13px;
}

.tag-preview p:last-child {
  margin: 0;
}

.tag-preview code {
  background: var(--background-primary);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: var(--font-monospace);
  color: var(--text-accent);
}

/* 添加按钮区域 */
.add-tag-section {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--background-modifier-border);
  text-align: center;
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
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

/* 拖拽时的样式 */
.sortable-ghost {
  opacity: 0.5;
  background: var(--background-modifier-hover);
}

.sortable-chosen {
  background: var(--background-modifier-hover);
}

.sortable-drag {
  background: var(--background-primary);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transform: rotate(2deg);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .tag-main-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .tag-actions {
    justify-content: flex-start;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .tag-item {
    padding: 12px;
  }
}
</style> 