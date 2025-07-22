<!--
  Export Formats模块设置面板 - Vuetify版本
  
  功能说明：
  - 管理导出格式的配置列表
  - 支持拖拽排序导出格式配置
  - 支持启用/禁用每个导出格式配置
  - 支持编辑导出格式的名称、输出目录、YAML配置等
  - 支持添加新的导出格式配置和删除现有配置
  - 自动保存配置到插件设置
  - 响应式设计，优化的用户体验
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (MyPlugin) 必需
  
  Events:
  - settings-changed: 配置变更时发出，传递新的设置对象
-->
<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <div>
      <h3 class="my-2">{{ getLocalizedText({ en: "Export Formats Settings", zh: "导出格式设置" }) }}</h3>
      <p class="text-medium-emphasis my-2">
        {{ getLocalizedText({
          en: "Configure export format commands, support various output formats",
          zh: "配置导出格式命令，支持多种输出格式"
        }) }}
      </p>
    </div>

    <!-- 可拖拽的导出格式配置列表 -->
    <draggable
      v-model="settings.exportConfigs"
      item-key="id"
      ghost-class="v-card--dragging"
      chosen-class="v-card--chosen"
      @end="handleDragEnd()"
    >
      <template #item="{ element: config, index }">
        <v-card 
          class="mb-3" 
          :class="{ 'opacity-60': !config.enabled }"
          elevation="1"
        >
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <!-- 格式标签 -->
              <v-col cols="2">
                <v-chip 
                  :color="config.enabled ? 'primary' : 'grey'" 
                  size="small" 
                  label
                >
                  {{ config.format }}
                </v-chip>
              </v-col>

              <!-- 格式名称 -->
              <v-col cols="4">
                <div class="text-subtitle-2 font-weight-medium">{{ config.name }}</div>
              </v-col>
              
              <!-- 操作按钮 -->
              <v-col cols="6">
                <div class="d-flex align-center justify-end">
                  <v-switch
                    v-model="config.enabled"
                    @update:model-value="handleExportEnabledChange(index, $event)"
                    density="compact"
                    hide-details
                    class="me-2"
                  />
                  <VBtnObsidianIcon 
                    icon="gear"
                    size="small"
                    @click="openExportModal(index)"
                    class="me-1"
                  />
                  <VBtnObsidianIcon 
                    icon="trash-2"
                    size="small"
                    @click="showDeleteConfirm(index)"
                    class="me-1"
                  />
                  <VBtnObsidianIcon 
                    icon="folder"
                    size="small"
                    @click="openAssetsFolder(config)"
                  />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </template>
    </draggable>

    <!-- 添加新导出格式按钮 -->
    <div class="text-center mt-4">
      <div class="d-flex align-center justify-center ga-3">
        <v-select
          v-model="selectedFormat"
          :items="formatOptions"
          item-title="label"
          item-value="value"
          :placeholder="getLocalizedText({ en: 'Select export format...', zh: '选择导出格式...' })"
          variant="outlined"
          density="compact"
          style="max-width: 200px;"
          hide-details
        />
        <v-btn
          @click="props.plugin.exportFormatsManager.addExportFormatItem(selectedFormat)"
          :disabled="!selectedFormat"
        >
          <!-- <v-icon start>mdi-plus</v-icon> -->
          {{ getLocalizedText({ en: "Add Export Format", zh: "添加导出格式" }) }}
        </v-btn>
      </div>
    </div>

    <!-- 导出格式编辑弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
      @update:visible="onModalVisibilityChange"
    >
      <div v-if="editingConfig" class="export-modal-form">
        <h3 class="mt-0 pt-0">
          {{ getLocalizedText({ en: "Edit Export Format", zh: "编辑导出格式" }) }}: {{ editingConfig.name }}
        </h3>
        
        <!-- 格式名称 -->
        <v-text-field
          v-model="editingConfig.name"
          :label="getLocalizedText({ en: 'Format Name', zh: '格式名称' })"
          variant="outlined"
          density="compact"
          class="mb-3"
        />

        <!-- 输出目录和文件名 -->
        <v-row class="mb-3">
          <v-col cols="6">
            <v-text-field
              v-model="editingConfig.output_dir"
              :label="getLocalizedText({ en: 'Output Directory', zh: '输出目录' })"
              :placeholder="EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="editingConfig.output_base_name"
              :label="getLocalizedText({ en: 'Output Filename', zh: '输出文件名' })"
              :placeholder="EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- 路径预览 -->
        <PreviewPanel
          :title="getLocalizedText({ en: 'Preview', zh: '预览' })"
          :content="getPreviewPath(editingConfig)"
        />

        <!-- YAML配置 -->
        <v-textarea
          v-model="editingConfig.yaml"
          :label="getLocalizedText({ en: 'YAML Configuration', zh: 'YAML配置' })"
          placeholder="Enter export format YAML configuration..."
          variant="outlined"
          rows="8"
          density="compact"
          class="mb-3"
        />

        <!-- Excalidraw设置 -->
        <v-row class="mb-3">
          <v-col cols="6">
            <v-select
              v-model="editingConfig.excalidraw_export_type"
              :items="excalidrawExportOptions"
              item-title="label"
              item-value="value"
              :label="getLocalizedText({ en: 'Excalidraw Export Type', zh: 'Excalidraw导出类型' })"
              variant="outlined"
              density="compact"
              @update:model-value="handleExcalidrawTypeChange"
            />
          </v-col>
          <v-col cols="6" v-if="editingConfig.excalidraw_export_type === 'png'">
            <div>
              <label class="text-caption text-medium-emphasis mb-2 d-block">
                {{ getLocalizedText({ en: "PNG Scale", zh: "PNG缩放比例" }) }}: {{ editingConfig.excalidraw_png_scale }}
              </label>
              <v-slider
                v-model="editingConfig.excalidraw_png_scale"
                min="1"
                max="9"
                step="1"
                show-ticks="always"
                tick-size="2"
                density="compact"
                hide-details
              />
            </div>
          </v-col>
        </v-row>
      </div>
    </ObsidianVueModal>

    <!-- 删除确认弹窗 -->
    <v-dialog v-model="deleteConfirmVisible" max-width="400">
      <v-card>
        <v-card-title>
          {{ getLocalizedText({ en: "Confirm Delete Export Format", zh: "确认删除导出格式" }) }}
        </v-card-title>
        <v-card-text>
          {{ getLocalizedText({ en: "Are you sure you want to delete this export format?", zh: "确认要删除此导出格式吗？" }) }}
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
import { reactive, ref } from 'vue';
import draggable from 'vuedraggable';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import type MyPlugin from '../../main';
import type { 
  ExportConfig, 
  ExportManagerSetting
} from '../types';
import { 
  DEFAULT_EXPORT_FORMATS_SETTINGS,
  EXPORT_FORMATS_CONSTANTS,
  FORMAT_OPTIONS,
  EXCALIDRAW_EXPORT_OPTIONS,
  EXTENSION_MAP
} from '../types';
import type { OutputFormat } from '../textConvert/textConverter';
import { debounce } from '../../vue/utils';
import { generateTimestamp } from '../../lib/idGenerator';
import { getDefaultYAML, createFormatAssetStructure } from '../textConvert/defaultStyleConfig/styleConfigs';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import VBtnObsidianIcon from '../../vue/components/VBtnObsidianIcon.vue';
import PreviewPanel from '../../vue/components/PreviewPanel.vue';
import { debugLog } from '../../lib/testUtils';
import { getLocalizedText } from '../../lib/textUtils';
// 路径预览功能
import { TextConverter } from '../textConvert';

// 定义Props
interface ExportFormatsSettingsProps {
  plugin: MyPlugin;
}

// 定义Events
interface ExportFormatsSettingsEmits {
  (e: 'settings-changed', settings: ExportManagerSetting): void;
}

const props = defineProps<ExportFormatsSettingsProps>();
const emit = defineEmits<ExportFormatsSettingsEmits>();

// 初始化设置
const settings = props.plugin.exportFormatsManager.config;

// 弹窗状态
const modalVisible = ref(false);
const editingConfig = ref<ExportConfig | null>(null);
const deleteConfirmVisible = ref(false);
const deleteConfigIndex = ref<number | null>(null);

// 表单选项
const selectedFormat = ref<OutputFormat>('typst');
const formatOptions = FORMAT_OPTIONS;
const excalidrawExportOptions = EXCALIDRAW_EXPORT_OPTIONS;

/**
 * 获取预览路径（支持占位符替换）
 */
const getPreviewPath = (config: ExportConfig): string => {
  const outputDir = config.output_dir || EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR;
  const outputName = config.output_base_name || EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME;
  const pathTemplate = `${outputDir}/${outputName}.${getExtensionByFormat(config.format)}`;
  
  // 获取当前活动文件
  const activeFile = props.plugin.app.workspace.getActiveFile();
  
  // 如果没有活动文件，返回原始模板（显示占位符）
  if (!activeFile) {
    return pathTemplate;
  }
  
  try {
    // 创建TextConverter实例并使用replacePlaceholders方法
    const converter = new TextConverter(props.plugin, activeFile); //考虑在打开弹窗时创建实例，提升性能
    return converter.replacePlaceholders(pathTemplate);
  } catch (error) {
    debugLog('Error replacing placeholders in preview path:', error);
    // 如果出现错误，返回原始模板
    return pathTemplate;
  }
};

/**
 * 根据格式获取文件扩展名
 */
const getExtensionByFormat = (format: OutputFormat): string => {
  return EXTENSION_MAP[format] || 'txt';
};

/**
 * 保存设置并处理拖拽结束
 */
const handleDragEnd = () => {
  debugLog('Drag ended, order saved');
};

/**
 * 处理导出格式启用状态变更
 */
const handleExportEnabledChange = (index: number, enabled: boolean) => {
  debugLog(`Export format ${index} enabled:`, enabled);
  settings.exportConfigs[index].enabled = enabled;
};

/**
 * 打开导出格式编辑弹窗
 */
const openExportModal = (index: number) => {
  editingConfig.value = settings.exportConfigs[index];
  modalVisible.value = true;
};

/**
 * 处理Excalidraw导出类型变更
 */
const handleExcalidrawTypeChange = () => {
  // 当切换到PNG时，确保有默认的缩放值
  if (editingConfig.value?.excalidraw_export_type === 'png' && !editingConfig.value.excalidraw_png_scale) {
    editingConfig.value.excalidraw_png_scale = EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_PNG_SCALE;
  }
};

/**
 * 打开资源文件夹
 */
const openAssetsFolder = (config: ExportConfig) => {
  const formatStylesPath = path.posix.join(
    props.plugin.PLUGIN_ABS_PATH,
    config.style_dir
  );

  // 如果文件夹不存在，先创建它
  if (!fs.existsSync(formatStylesPath)) {
    fs.mkdirSync(formatStylesPath, { recursive: true });
  }
  
  // 使用系统默认程序打开文件夹
  // 在Windows下需要将路径转换为Windows格式（使用反斜杠）
  let command: string;
  if (process.platform === 'win32') {
    const windowsPath = path.win32.normalize(formatStylesPath.replace(/\//g, '\\'));
    command = `explorer "${windowsPath}"`;
  } else if (process.platform === 'darwin') {
    command = `open "${formatStylesPath}"`;
  } else {
    command = `xdg-open "${formatStylesPath}"`;
  }
  
  debugLog('Opening folder with command:', command);
  child_process.exec(command);
};

/**
 * 显示删除确认弹窗
 */
const showDeleteConfirm = (index: number) => {
  deleteConfigIndex.value = index;
  deleteConfirmVisible.value = true;
};

/**
 * 执行删除操作
 */
const confirmDelete = async () => {
  if (deleteConfigIndex.value === null) return;
  props.plugin.exportFormatsManager.deleteExportFormatItem(deleteConfigIndex.value);
  deleteConfigIndex.value = null;
  deleteConfirmVisible.value = false;
};

/**
 * 取消删除操作
 */
const cancelDelete = () => {
  deleteConfigIndex.value = null;
  deleteConfirmVisible.value = false;
};

/**
 * 处理弹窗可见性变更
 */
const onModalVisibilityChange = (visible: boolean) => {
  if (!visible) {
    // 弹窗关闭时，清理状态
    editingConfig.value = null;
  }
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

/* 自定义样式 */
.export-modal-form {
  padding: 0;
}

/* 路径预览代码样式 */
code {
  font-family: var(--font-monospace);
  font-size: 0.9em;
  word-break: break-all;
}

/* 让路径预览在小屏幕上也能正常显示 */
.v-alert .text-caption {
  word-break: break-all;
  overflow-wrap: anywhere;
}

/* 确保滑块在小屏幕上显示正常 */
.v-slider {
  margin-top: 8px;
}
</style> 