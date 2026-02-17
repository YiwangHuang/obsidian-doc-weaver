<!--
  Tag Wrapper模块设置面板 - Vuetify版本
-->
<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <div class="my-2">
      <div class="text-subtitle-2 font-weight-medium">{{ getLocalizedText({ en: "Configure HTML Tags", zh: "配置HTML标签" }) }}</div>
      <p class="text-caption text-medium-emphasis">
        {{ getLocalizedText({
          en: "Extend Markdown with custom HTML tags mapped to corresponding Typst syntax; iframe tags are supported by default and will be converted into hyperlinks. Shortcut commands are also provided to wrap selected text in custom HTML tags.",
          zh: "通过自定义HTML标签扩展Markdown，并将其映射到对应的Typst语法；iframe标签已内置映射，将自动转换为超链接。支持使用快捷命令将选中文本包装进自定义HTML标签。"
          }) 
        }}
      </p>
      <!-- <v-divider class="border-opacity-100 my-2" />     -->
      <p class="text-caption text-medium-emphasis" style="color: var(--text-accent) !important;">
        {{ getLocalizedText({
          en: "Note: To ensure a valid Typst export, all HTML tags must be properly paired and configured here.",
          zh: "注意：为确保能够正确导出为Typst，请保证所有HTML标签成对出现，且相关标签已在此处完成配置。"
        }) }}
      </p>
    </div>

    <!-- 可拖拽的标签配置列表 -->
    <draggable
      v-model="configs.tags"
      item-key="id"
      ghost-class="v-card--dragging"
      chosen-class="v-card--chosen"
      @end="handleDragEnd()"
    >
      <template #item="{ element: tag, index }">
        <v-card 
          class="mb-3" 
          :class="{ 'opacity-60': !tag.enabled }"
          elevation="1"
        >
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <!-- 标签名称和图标 -->
              <v-col cols="3.5">
                <div class="d-flex align-center">
                  <v-chip class="me-2"
                    :color="tag.enabled ? OBSIDIAN_PRIMARY_COLOR : 'grey'" 
                    size="small" 
                    label
                  >
                    {{ tag.tagType }}
                  </v-chip>
                  <IconSelectButton :app="props.plugin.app" :command="tag" />
                  <div class="text-subtitle-2 font-weight-medium">{{ tag.name }}</div>
                </div>
              </v-col>

              <!-- 预览 -->
              <v-col cols="4.5">
                <div class="text-caption text-medium-emphasis d-flex align-center">
                  <span style="color: var(--text-accent);">{{ generateStartTagFromConfig(tag) }}</span>
                  <span>{{ getLocalizedText({ en: "Text", zh: "文本" }) }}</span>
                  <span style="color: var(--text-accent);">{{ generateEndTagFromConfig(tag) }}</span>
                </div>
              </v-col>
              
              <!-- 操作按钮 -->
              <v-col cols="5">
                <div class="d-flex align-center justify-end">
                  <v-switch
                    v-model="tag.enabled"
                    @update:model-value="handleTagEnabledChange(index, $event)"
                    density="compact"
                    hide-details
                    class="me-2"
                  />
                  <v-btn
                    size="small"
                    @click="openTagModal(index)"
                    class="me-1 icon-btn-square"
                  >
                    <Icon name="gear" />
                  </v-btn>
                  <v-tooltip :text="getLocalizedText({ en: 'Duplicate tag', zh: '复制标签' })" location="top" :open-delay="200">
                    <template #activator="{ props: tooltipProps }"> 
                      <v-btn
                        v-bind="tooltipProps"
                        size="small"
                        @click="props.plugin.tagWrapperManager.duplicateTagItem(index)"
                        class="me-1 icon-btn-square"
                      >
                        <Icon name="copy" />
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-btn
                    size="small"
                    @click="showDeleteConfirm(index)"
                    class="icon-btn-square"
                  >
                    <Icon name="trash-2" />
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </template>
    </draggable>

    <!-- 添加新标签按钮 -->
    <div class="text-center mt-4">
      <!-- prepend-icon="plus" -->

      <v-btn
        @click="props.plugin.tagWrapperManager.addTagItem()"
      >
        <Icon name="plus" class="me-1" />
        {{ getLocalizedText({ en: "Add Tag Configuration", zh: "添加标签配置" }) }}
      </v-btn>
    </div>

    <!-- 标签编辑对话框 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="props.plugin.app"
    >
      <div v-if="editingTag">
        <h3 class="pt-0 mt-0">
          {{ getLocalizedText({ en: "Edit Tag Configuration", zh: "编辑标签配置" }) }}
        </h3>
        
        <!-- 标签名称 -->
        <v-text-field
          v-model="editingTag.name"
          :label="getLocalizedText({ en: 'Tag Name', zh: '标签名称' })"
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <!-- 标签类型和类名 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <v-select
            v-model="editingTag.tagType"
            :label="getLocalizedText({ en: 'Tag Type', zh: '标签类型' })"
            :items="tagTypeOptions"
            variant="outlined"
            density="compact"
            class="mb-3"
            hide-details
          />
          <v-text-field
            v-model="editingTag.tagClass"
            :label="getLocalizedText({ en: 'CSS Class', zh: 'CSS类名' })"
            placeholder="e.g. highlight, underline. Leave empty to match tag type only."
            variant="outlined"
            density="compact"
            class="mb-3"
          />
        </div>
        
        <!-- Typst前缀 -->
        <v-text-field
          v-model="editingTag.typstPrefix"
          :label="getLocalizedText({ en: 'Typst Prefix', zh: 'Typst前缀' })"
          placeholder="e.g. #underline, #highlight"
          :hint="getLocalizedText({ en: 'Typst function name without brackets', zh: 'Typst函数名，不包含括号' })"
          variant="outlined"
          density="compact"
          class="mb-3"
          persistent-hint
        />
        
        <!-- CSS片段 -->
        <v-textarea
          v-model="editingTag.cssSnippet"
          :label="getLocalizedText({ en: 'CSS Snippet', zh: 'CSS 片段' })"
          :placeholder="getLocalizedText({ 
            en: 'Enter CSS styles...\nExample:\n.my-tag {\n  color: red;\n  font-weight: bold;\n}',
            zh: '输入CSS样式...\n示例：\n.my-tag {\n  color: red;\n  font-weight: bold;\n}'
          })"
          variant="outlined"
          rows="6"
          density="compact"
          class="mb-3"
        />

        <!-- 预览 -->
        <PreviewPanel
          v-if="editingTag"
          :title="getLocalizedText({ en: 'Live Preview', zh: '实时预览' })"
          content=" "
        >
          <!-- 带样式的HTML预览，通过插槽覆盖显示在预览面板上方 -->
          <!-- 标签结构预览 -->
          <div class="d-flex align-center">
                  <span>{{ generateStartTagFromConfig(editingTag) }}</span>
                  <span>{{ getLocalizedText({ en: "Text", zh: "文本" }) }}</span>
                  <span>{{ generateEndTagFromConfig(editingTag) }}</span>
          </div>
          <!-- 推导符号 -->
          <span class="mx-2" style="font-size: 1.2em; color: var(--text-accent);">⟹</span>
          <!-- CSS 样式渲染预览 -->
          <div v-html="styledPreviewHtml"></div>
        </PreviewPanel>
      </div>
    </ObsidianVueModal>

    <!-- 删除确认对话框 -->
    <!-- <v-dialog v-model="deleteConfirmVisible" max-width="400">
      <v-card>
        <v-card-title>
          {{ getLocalizedText({ en: "Confirm Delete", zh: "确认删除" }) }}
        </v-card-title>
        <v-card-text>
          {{ getLocalizedText({ en: "Are you sure you want to delete this tag configuration?", zh: "确认要删除此标签配置吗？" }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="cancelDelete">
            {{ getLocalizedText({ en: "Cancel", zh: "取消" }) }}
          </v-btn>
          <v-btn color="error" @click="confirmDelete">
            {{ getLocalizedText({ en: "Delete", zh: "删除" }) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog> -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';
import type MyPlugin from '../../main';
import type { TagConfig, TagWrapperSettings } from '../types';
import { generateStartTagFromConfig, generateEndTagFromConfig } from '../types';
import { debugLog } from '../../lib/debugUtils';
import { getLocalizedText } from '../../lib/textUtils';
import { tagWrapperInfo } from '../index';
import Icon from '../../vue/components/Icon.vue';
import IconSelectButton from '../../vue/components/IconSelectButton.vue';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import PreviewPanel from '../../vue/components/PreviewPanel.vue';
import { OBSIDIAN_PRIMARY_COLOR } from '../../vue/plugins/vuetify';
import { ConfirmModal } from '../../lib/modalUtils';

interface TagWrapperSettingsProps {
  plugin: MyPlugin;
}

const props = defineProps<TagWrapperSettingsProps>();

// 初始化设置
const configs = props.plugin.settingList[tagWrapperInfo.name] as TagWrapperSettings;

// 弹窗状态
const modalVisible = ref(false);
const editingTag = ref<TagConfig | null>(null);
const deleteTagIndex = ref<number | null>(null);

// 标签类型选项
const tagTypeOptions = [
  { title: 'span', value: 'span' },
  { title: 'font', value: 'font' },
  { title: 'u (underline)', value: 'u' },
  { title: 'i (italic)', value: 'i' },
  { title: 's (strikethrough)', value: 's' }
];

// 固定的示例文本
const sampleText = getLocalizedText({ en: "Sample text", zh: "示例文本" });

// 计算带样式的预览HTML内容
const styledPreviewHtml = computed(() => {
  if (!editingTag.value) return '';
  
  // 根据tagType和tagClass生成HTML标签
  const startTag = generateStartTagFromConfig(editingTag.value);
  const endTag = generateEndTagFromConfig(editingTag.value);
  const wrappedHtml = `${startTag}${sampleText}${endTag}`;
  
  // 如果有CSS片段，将其作为内联样式应用
  if (editingTag.value.cssSnippet) {
    return `
      <style scoped>
        ${editingTag.value.cssSnippet}
      </style>
      ${wrappedHtml}
    `;
  }
  
  return wrappedHtml;
});

const handleDragEnd = () => {
  debugLog('Drag ended, order saved');
};

const handleTagEnabledChange = (index: number, enabled: boolean) => {
  debugLog(`Tag ${index} enabled:`, enabled);
  configs.tags[index].enabled = enabled;
};

const openTagModal = (index: number) => {
  editingTag.value = configs.tags[index];
  modalVisible.value = true;
};

const showDeleteConfirm = (index: number) => {
  deleteTagIndex.value = index;
  const confirmMessage = getLocalizedText({ en: "Confirm Delete Tag Configuration: ", zh: "确认删除标签配置: " }) + configs.tags[index].name;
  new ConfirmModal(
                    props.plugin.app,
                    confirmMessage,
                    async () => await confirmDelete()
                    , () => cancelDelete()
                    ).open();
};

const confirmDelete = () => {
  if (deleteTagIndex.value === null) return;
  props.plugin.tagWrapperManager.deleteTagItem(deleteTagIndex.value);
  deleteTagIndex.value = null;
};

const cancelDelete = () => {
  deleteTagIndex.value = null;
};

</script>

<style scoped>
/* 拖拽状态样式 */
.v-card--dragging {
  border: 2px solid var(--interactive-accent) !important;
  transform: rotate(2deg);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
}

.v-card--chosen {
  cursor: grabbing !important;
}

/* 标签类型芯片样式 - 规定尺寸和外观，与导出格式设置保持一致 */
.v-chip {
  width: 39px !important;
  height: 25px !important;
  font-size: 0.75rem !important;
  font-weight: 500;
  border-radius: 9px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style> 