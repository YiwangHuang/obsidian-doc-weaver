<!--
  Quick Template模块设置面板 - Vuetify版本
-->
<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <div>
      <h3 class="my-2">{{ getLocalizedText({ en: "Quick Template Settings", zh: "快捷模板设置" }) }}</h3>
      <p class="text-medium-emphasis my-2">
        {{ getLocalizedText({
          en: "Configure quick template commands, insert templates with placeholders for selected text",
          zh: "配置快捷模板命令，为选中文本插入带占位符的模板"
        }) }}
      </p>
    </div>

    <!-- 可拖拽的模板配置列表 -->
    <draggable
      v-model="configs.templates"
      item-key="id"
      ghost-class="v-card--dragging"
      chosen-class="v-card--chosen"
      @end="handleDragEnd()"
    >
      <template #item="{ element: template, index }">
        <v-card 
          class="mb-3" 
          :class="{ 'opacity-60': !template.enabled }"
          elevation="1"
        >
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <!-- 模板名称 -->
               <v-col cols="6">
                 <div class="text-subtitle-2 font-weight-medium">{{ template.name }}</div>
               </v-col>

              <!-- 模板预览 -->
              <!-- <v-col cols="4">
                <div class="text-caption text-medium-emphasis">
                  <code style="background: var(--background-modifier-border); padding: 2px 4px; border-radius: 3px;">
                    {{ getTemplatePreview(template.template) }}
                  </code>
                </div>
              </v-col> -->
              
              <!-- 操作按钮 -->
              <v-col cols="6">
                <div class="d-flex align-center justify-end">
                  <v-switch
                    v-model="template.enabled"
                    @update:model-value="handleTemplateEnabledChange(index, $event)"
                    density="compact"
                    hide-details
                    class="me-3"
                  />
                  <VBtnObsidianIcon 
                    icon="gear"
                    size="small"
                    @click="openTemplateModal(index)"
                    class="me-1"
                  />
                  <VBtnObsidianIcon 
                    icon="trash-2"
                    size="small"
                    @click="showDeleteConfirm(index)"
                  />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </template>
    </draggable>

    <!-- 添加新模板按钮 -->
    <div class="text-center mt-4">
      <v-btn
        @click="addNewTemplate()"
      >
        {{ getLocalizedText({ en: "Add Template Configuration", zh: "添加模板配置" }) }}
      </v-btn>
    </div>

    <!-- 模板编辑对话框 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="props.plugin.app"
    >
      <div v-if="editingTemplate">
        <h3 class="pt-0 mt-0">
          {{ getLocalizedText({ en: "Edit Template Configuration", zh: "编辑模板配置" }) }}: {{ editingTemplate.name }}
        </h3>
        
        <!-- 模板名称 -->
        <v-text-field
          v-model="editingTemplate.name"
          :label="getLocalizedText({ en: 'Template Name', zh: '模板名称' })"
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        

        <!-- 模板编辑器组件 -->
        <TemplateEditor
          :placeholders="templatePlaceholders"
        >
          <v-textarea
            v-model="editingTemplate.template"
            :label="getLocalizedText({ en: 'Template Content', zh: '模板内容' })"
            :placeholder="getLocalizedText({ 
              en: 'Enter template content with placeholders...\nExample: > [!{{type}}] {{title}}\\n> {{selectedText}}',
              zh: '输入带占位符的模板内容...\n示例：> [!{{type}}] {{title}}\\n> {{selectedText}}'
            })"
            variant="outlined"
            rows="6"
            density="compact"
          />
        </TemplateEditor>
      </div>
    </ObsidianVueModal>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteConfirmVisible" max-width="400">
      <v-card>
        <v-card-title>
          {{ getLocalizedText({ en: "Confirm Delete", zh: "确认删除" }) }}
        </v-card-title>
        <v-card-text>
          {{ getLocalizedText({ en: "Are you sure you want to delete this template configuration?", zh: "确认要删除此模板配置吗？" }) }}
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
import type { TemplateConfig, QuickTemplateSettings } from '../index';
import { debugLog } from '../../lib/debugUtils';
import { getLocalizedText } from '../../lib/textUtils';
import { quickTemplateInfo } from '../index';
import VBtnObsidianIcon from '../../vue/components/VBtnObsidianIcon.vue';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import TemplateEditor from '../../vue/components/TemplateEditor.vue';

interface QuickTemplateSettingsProps {
  plugin: MyPlugin;
}

const props = defineProps<QuickTemplateSettingsProps>();

// 初始化设置
const configs = props.plugin.settingList[quickTemplateInfo.name] as QuickTemplateSettings;

// 弹窗状态
const modalVisible = ref(false);
const editingTemplate = ref<TemplateConfig | null>(null);
const deleteConfirmVisible = ref(false);
const deleteTemplateIndex = ref<number | null>(null);

// 模板占位符配置
const templatePlaceholders = [
  { value: '{{selectedText}}', description: getLocalizedText({en:'Selected text content', zh:'选中文本'}) },
  { value: '{{date: YYYY-MM-DD}}', description: getLocalizedText({en:'Current time with format YYYY-MM-DD', zh:'当前时间，可编辑格式'}) },
];

// 获取模板预览文本（简化显示） - 用于模板列表预览
const getTemplatePreview = (template: string): string => {
  return template
    .replace(/\{\{selectedText\}\}/g, 'Selected Text')
    .replace(/\{\{(\w+)\}\}/g, '$1')
    .substring(0, 50) + (template.length > 50 ? '...' : '');
};

const handleDragEnd = () => {
  debugLog('Template drag ended, order saved');
};

const handleTemplateEnabledChange = (index: number, enabled: boolean) => {
  debugLog(`Template ${index} enabled:`, enabled);
  configs.templates[index].enabled = enabled;
};

const openTemplateModal = (index: number) => {
  editingTemplate.value = configs.templates[index]; // 直接引用原始对象，实时保存
  modalVisible.value = true;
};

const addNewTemplate = () => {
  props.plugin.quickTemplateManager.addTemplateItem();
};

const showDeleteConfirm = (index: number) => {
  deleteTemplateIndex.value = index;
  deleteConfirmVisible.value = true;
};

const confirmDelete = () => {
  if (deleteTemplateIndex.value === null) return;
  props.plugin.quickTemplateManager.deleteTemplateItem(deleteTemplateIndex.value);
  deleteTemplateIndex.value = null;
  deleteConfirmVisible.value = false;
};

const cancelDelete = () => {
  deleteTemplateIndex.value = null;
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

code {
  font-family: var(--font-monospace);
  font-size: 0.9em;
}
</style> 