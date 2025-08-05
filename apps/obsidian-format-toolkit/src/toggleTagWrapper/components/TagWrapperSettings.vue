<!--
  Tag Wrapper模块设置面板 - Vuetify版本
-->
<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <div>
      <h3 class="my-2">{{ getLocalizedText({ en: "Tag Wrapper Settings", zh: "标签包装器设置" }) }}</h3>
      <p class="text-medium-emphasis my-2">
        {{ getLocalizedText({
          en: "Configure tag wrapper commands, wrap selected text with custom tags",
          zh: "配置标签包装器命令，将选中文本包装在自定义标签中"
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
              <!-- 标签名称 -->
              <v-col cols="3.5">
                <div class="text-subtitle-2 font-weight-medium">{{ tag.name }}</div>
              </v-col>

              <!-- 预览 -->
              <v-col cols="4.5">
                <div class="text-caption text-medium-emphasis d-flex align-center">
                  <span style="color: var(--text-accent);">{{ tag.prefix }}</span>
                  <span>{{ getLocalizedText({ en: "Text", zh: "文本" }) }}</span>
                  <span style="color: var(--text-accent);">{{ tag.suffix }}</span>
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
          {{ getLocalizedText({ en: "Edit Tag Configuration", zh: "编辑标签配置" }) }}: {{ editingTag.name }}
        </h3>
        
        <!-- 标签名称 -->
        <v-text-field
          v-model="editingTag.name"
          :label="getLocalizedText({ en: 'Tag Name', zh: '标签名称' })"
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <!-- 开始和结束标签 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <v-text-field
            v-model="editingTag.prefix"
            :label="getLocalizedText({ en: 'Start Tag', zh: '开始标签' })"
            placeholder="e.g. <div>, **, <!--"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="editingTag.suffix"
            :label="getLocalizedText({ en: 'End Tag', zh: '结束标签' })"
            placeholder="e.g. </div>, **, -->"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
        </div>
        
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
        >
          <!-- 带样式的HTML预览 -->
          <div v-html="styledPreviewHtml"></div>
        </PreviewPanel>
      </div>
    </ObsidianVueModal>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteConfirmVisible" max-width="400">
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
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';
import type MyPlugin from '../../main';
import type { TagConfig, TagWrapperSettings } from '../types';
import { debugLog } from '../../lib/debugUtils';
import { getLocalizedText } from '../../lib/textUtils';
import { tagWrapperInfo } from '../index';
import Icon from '../../vue/components/Icon.vue';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import PreviewPanel from '../../vue/components/PreviewPanel.vue';

interface TagWrapperSettingsProps {
  plugin: MyPlugin;
}

const props = defineProps<TagWrapperSettingsProps>();

// 初始化设置
const configs = props.plugin.settingList[tagWrapperInfo.name] as TagWrapperSettings;

// 弹窗状态
const modalVisible = ref(false);
const editingTag = ref<TagConfig | null>(null);
const deleteConfirmVisible = ref(false);
const deleteTagIndex = ref<number | null>(null);

// 固定的示例文本
const sampleText = getLocalizedText({ en: "Sample text", zh: "示例文本" });

// 计算带样式的预览HTML内容
const styledPreviewHtml = computed(() => {
  if (!editingTag.value) return '';
  
  // 生成包装后的HTML
  const wrappedHtml = `${editingTag.value.prefix}${sampleText}${editingTag.value.suffix}`;
  
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
  deleteConfirmVisible.value = true;
};

const confirmDelete = () => {
  if (deleteTagIndex.value === null) return;
  props.plugin.tagWrapperManager.deleteTagItem(deleteTagIndex.value);
  deleteTagIndex.value = null;
  deleteConfirmVisible.value = false;
};

const cancelDelete = () => {
  deleteTagIndex.value = null;
  deleteConfirmVisible.value = false;
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
</style> 