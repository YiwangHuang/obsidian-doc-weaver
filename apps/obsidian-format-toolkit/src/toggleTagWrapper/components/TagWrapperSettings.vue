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
        <h3>{{ getLocalizedText({ en: "Tag Wrapper Settings", zh: "标签包装器设置" }) }}</h3>
        <p class="module-description">
          {{ getLocalizedText({
            en: "Configure tag wrapper commands, wrap selected text with custom tags",
            zh: "配置标签包装器命令，将选中文本包装在自定义标签中"
          }) }}
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
                  <span class="tag-separator">{{ getLocalizedText({ en: "Text", zh: "文本" }) }}</span>
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
          {{ getLocalizedText({ en: "Edit Tag Configuration", zh: "编辑标签配置" }) }}: {{ editingTag.name }}
        </h2>
        <div class="form-group">
          <label>{{ getLocalizedText({ en: "Tag Name", zh: "标签名称" }) }}：</label>
          <TextInput
            v-model="editingTag.name"
            placeholder="Enter tag name..."
            @update:model-value="debouncedSave"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ getLocalizedText({ en: "Start Tag", zh: "开始标签" }) }}：</label>
            <TextInput
              v-model="editingTag.prefix"
              placeholder="e.g. <div>, **, <!--"
              @update:model-value="debouncedSave"
            />
          </div>

          <div class="form-group">
            <label>{{ getLocalizedText({ en: "End Tag", zh: "结束标签" }) }}：</label>
            <TextInput
              v-model="editingTag.suffix"
              placeholder="e.g. </div>, **, -->"
              @update:model-value="debouncedSave"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>{{ getLocalizedText({ en: "CSS Snippet", zh: "CSS 片段" }) }}：</label>
          <TextArea
            v-model="editingTag.cssSnippet"
            :placeholder="getLocalizedText({ 
              en: 'Enter CSS styles that will be injected when this tag is enabled...\nExample:\n.my-tag {\n  color: red;\n  font-weight: bold;\n}',
              zh: '输入启用此标签时将注入的 CSS 样式...\n示例：\n.my-tag {\n  color: red;\n  font-weight: bold;\n}'
            })"
            :rows="8"
            @update:model-value="debouncedSave"
          />
          <div class="css-help-text">
            {{ getLocalizedText({ 
              en: "💡 This CSS will be automatically injected when the tag is enabled and removed when disabled.",
              zh: "💡 这些 CSS 样式将在标签启用时自动注入，禁用时移除。"
            }) }}
          </div>
        </div>
        
        <div class="live-preview-section">
          <h4>{{ getLocalizedText({ en: "Live Preview", zh: "实时预览" }) }}</h4>
          <div class="live-preview-container">
            <div class="source-code-section">
              <div class="section-label">
                {{ getLocalizedText({ en: "Source Code", zh: "源码" }) }}
              </div>
              <div class="source-code-content">
                <code v-if="previewSourceCode">
                  <span class="tag-highlight">{{ previewSourceCode.prefix }}</span><span class="text-content">{{ previewSourceCode.text }}</span><span class="tag-highlight">{{ previewSourceCode.suffix }}</span>
                </code>
              </div>
            </div>
            
            <div class="preview-arrow">
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 1l6 7-6 7M2 8h18"/>
              </svg>
            </div>
            
            <div class="rendered-result-section">
              <div class="section-label">
                {{ getLocalizedText({ en: "Rendered Result", zh: "渲染样式" }) }}
              </div>
              <div class="rendered-result-content" ref="livePreviewRef">
                <span 
                  class="live-preview-text"
                  :style="previewTextStyle"
                  v-html="previewHtml"
                ></span>
              </div>
            </div>
          </div>
          <div class="live-preview-note">
            {{ getLocalizedText({ 
              en: "Shows source code and how it renders with applied CSS styles",
              zh: "显示源码以及应用CSS样式后的渲染效果"
            }) }}
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
        {{ getLocalizedText({ en: "Add Tag Configuration", zh: "添加标签配置" }) }}
      </Button>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model:visible="deleteConfirmVisible"
      :obsidian-app="plugin.app"
      :onConfirm="confirmDelete"
      :onCancel="cancelDelete"
    >
      <h2 class="modal-title">{{ getLocalizedText({ en: "Confirm Delete Tag Configuration", zh: "确认删除标签配置" }) }}</h2>
      <p>{{ getLocalizedText({ en: "Are you sure you want to delete this tag configuration?", zh: "确认要删除此标签配置吗？" }) }}</p>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, nextTick } from 'vue';
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
import TextArea from '../../vue/components/TextArea.vue';
import Button from '../../vue/components/Button.vue';
  import MultiColumn from '../../vue/components/MultiColumn.vue';
  import ConfirmDialog from '../../vue/components/ConfirmDialog.vue';
  import { debugLog } from '../../lib/testUtils';
  import { getLocalizedText } from '../../lib/textUtils';
  import { tagWrapperSetting } from '../index';

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

// 实时预览相关
const livePreviewRef = ref<HTMLElement | null>(null);
const previewStyleElement = ref<HTMLStyleElement | null>(null);

// 固定的示例文本
const sampleText = getLocalizedText({ 
  en: "Sample text", 
  zh: "示例文本" 
});

// 计算源码内容（标签包装后的原始文本，带标签高亮）
const previewSourceCode = computed(() => {
  if (!editingTag.value) return '';
  return {
    prefix: editingTag.value.prefix,
    text: sampleText,
    suffix: editingTag.value.suffix
  };
});

// 计算预览HTML内容（用于渲染）
const previewHtml = computed(() => {
  if (!editingTag.value) return '';
  return `${editingTag.value.prefix}${sampleText}${editingTag.value.suffix}`;
});

// 预览文本样式
const previewTextStyle = computed(() => {
  return {
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '8px',
    minHeight: '40px',
    display: 'inline-block',
    wordBreak: 'break-word' as const
  };
});

/**
 * 保存设置到插件并触发动态命令更新
 */
const saveSettings = async () => {
  try {
    // 调用主插件的设置变更方法，这会触发动态命令更新
    await props.plugin.onSettingsChange(tagWrapperSetting.name, { ...settings });
    
    // 发出设置变更事件（向后兼容）
    emit('settings-changed', settings);
    
    debugLog('Tag wrapper settings saved and commands updated');
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
 * 更新实时预览CSS
 */
const updatePreviewCSS = () => {
  if (!editingTag.value || !editingTag.value.cssSnippet?.trim()) {
    // 移除预览样式
    if (previewStyleElement.value) {
      previewStyleElement.value.remove();
      previewStyleElement.value = null;
    }
    return;
  }

  // 创建或更新预览样式
  if (!previewStyleElement.value) {
    previewStyleElement.value = document.createElement('style');
    previewStyleElement.value.id = 'tag-wrapper-live-preview-style';
    document.head.appendChild(previewStyleElement.value);
  }

  // 应用CSS到预览容器
  const cssContent = `
    /* Live Preview CSS for Tag Wrapper */
    .live-preview-content ${editingTag.value.cssSnippet}
  `;
  
  previewStyleElement.value.textContent = cssContent;
  debugLog('Preview CSS updated:', editingTag.value.name);
};

/**
 * 处理弹窗可见性变更
 */
const onModalVisibilityChange = (visible: boolean) => {
  if (!visible) {
    // 弹窗关闭时，清理状态和预览样式
    editingTag.value = null;
    if (previewStyleElement.value) {
      previewStyleElement.value.remove();
      previewStyleElement.value = null;
    }
    debouncedSave();
  } else {
    // 弹窗打开时，初始化预览
    nextTick(() => {
      updatePreviewCSS();
    });
  }
};

// 监听editingTag的CSS变化，实时更新预览
watch(() => editingTag.value?.cssSnippet, () => {
  if (modalVisible.value && editingTag.value) {
    nextTick(() => {
      updatePreviewCSS();
    });
  }
}, { deep: true });

// 监听前缀和后缀变化，触发预览更新
watch(() => [editingTag.value?.prefix, editingTag.value?.suffix], () => {
  if (modalVisible.value && editingTag.value) {
    // 前缀后缀变化时，预览HTML会自动更新（computed属性）
    // 这里只需要确保CSS是最新的
    nextTick(() => {
      updatePreviewCSS();
    });
  }
}, { deep: true });
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



/* CSS 帮助文本样式 */
.css-help-text {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 实时预览样式 */
.live-preview-section {
  margin-top: 20px;
  border-top: 1px solid var(--background-modifier-border);
  padding-top: 20px;
}

.live-preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal);
}

.live-preview-container {
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

.source-code-section,
.rendered-result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-label {
  padding: 8px 12px;
  background: var(--background-secondary);
  border-bottom: 1px solid var(--background-modifier-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-align: center;
}

.source-code-content {
  padding: 16px;
  background: var(--background-primary);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-monospace);
  font-size: 13px;
  color: var(--text-normal);
  word-break: break-all;
}

.source-code-content code {
  background: none;
  padding: 0;
  border: none;
  font-size: inherit;
  color: inherit;
}

.tag-highlight {
  color: var(--text-accent);
  opacity: 0.7;
  font-weight: 500;
}

.text-content {
  color: var(--text-normal);
}

.rendered-result-content {
  padding: 16px;
  background: var(--background-primary);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  background: var(--background-secondary);
  border-left: 1px solid var(--background-modifier-border);
  border-right: 1px solid var(--background-modifier-border);
  color: var(--text-accent);
}

.live-preview-text {
  max-width: 100%;
  text-align: center;
}

.live-preview-note {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
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