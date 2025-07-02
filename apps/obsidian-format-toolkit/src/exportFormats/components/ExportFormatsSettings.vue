<!--
  Export Formats模块设置面板
  
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
  <div class="export-formats-settings">
    <div class="module-section no-border">
      <div class="module-header">
        <h3>{{ getLocalizedText({ en: "Export Formats Settings", zh: "导出格式设置" }) }}</h3>
        <p class="module-description">
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
        ghost-class="ghost"
        @end="handleDragEnd()"
      >
        <template #item="{ element: config, index }">
          <div 
            class="export-item"
            :class="{ 'export-enabled': config.enabled, 'export-disabled': !config.enabled }"
            draggable="true"
          >
            <MultiColumn :columns="[
              { width: 1, align: 'left' },   // 格式名称栏
              { width: 9, align: 'left' },   // 预览栏
              { width: 1, align: 'right' }   // 操作按钮栏
            ]">

              <!-- 预览栏 -->
              <template #column-0>
                  <span class="format-tag">
                    {{ config.format }}
                  </span>
              </template>

              <!-- 格式名称栏 -->
              <template #column-1>
                <span class="export-name">{{ config.name }}</span>
              </template>

              <!-- 操作按钮栏 -->
              <template #column-2>
                <span class="horizontal-stack" @mousedown.stop @click.stop>
                  <ToggleSwitch
                    v-model="config.enabled"
                    @update:model-value="handleExportEnabledChange(index, $event)"
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    @click="openExportModal(index)"
                    description="编辑此导出格式配置"
                    class="icon-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    @click="showDeleteConfirm(index)"
                    description="删除此导出格式配置"
                    class="icon-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    @click="openAssetsFolder(config)"
                    description="打开资源文件夹"
                    class="icon-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-folder"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path></svg>
                  </Button>
                </span>
              </template>
            </MultiColumn>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 导出格式编辑弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
      @update:visible="onModalVisibilityChange"
    >
      <div v-if="editingConfig" class="export-modal-form">
        <h2 class="modal-title">
          {{ getLocalizedText({ en: "Edit Export Format", zh: "编辑导出格式" }) }}: {{ editingConfig.name }}
        </h2>
        <div class="form-group">
          <label>{{ getLocalizedText({ en: "Format Name", zh: "格式名称" }) }}：</label>
          <TextInput
            v-model="editingConfig.name"
            placeholder="Enter format name..."
            @update:model-value="debouncedSave"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ getLocalizedText({ en: "Output Directory", zh: "输出目录" }) }}：</label>
            <TextInput
              v-model="editingConfig.output_dir"
              :placeholder="EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR"
              @update:model-value="debouncedSave"
            />
          </div>

          <div class="form-group">
            <label>{{ getLocalizedText({ en: "Output Filename", zh: "输出文件名" }) }}：</label>
            <TextInput
              v-model="editingConfig.output_base_name"
              :placeholder="EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME"
              @update:model-value="debouncedSave"
            />
          </div>
        </div>

        <div class="form-group">
          <label>{{ getLocalizedText({ en: "YAML Configuration", zh: "YAML配置" }) }}：</label>
          <TextArea
            v-model="editingConfig.yaml"
            placeholder="Enter export format YAML configuration..."
            :rows="8"
            @update:model-value="debouncedSave"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ getLocalizedText({ en: "Excalidraw Export Type", zh: "Excalidraw导出类型" }) }}：</label>
            <Dropdown
              v-model="editingConfig.excalidraw_export_type"
              :options="excalidrawExportOptions"
              @update:model-value="handleExcalidrawTypeChange"
            />
          </div>

          <div v-if="editingConfig.excalidraw_export_type === 'png'" class="form-group">
            <label>{{ getLocalizedText({ en: "PNG Scale", zh: "PNG缩放比例" }) }}：{{ editingConfig.excalidraw_png_scale }}</label>
            <input
              type="range"
              v-model="editingConfig.excalidraw_png_scale"
              min="1"
              max="9"
              step="1"
              class="png-scale-slider"
              @input="debouncedSave"
            />
          </div>
        </div>
        
        <div class="preview-section">
          <h4>{{ getLocalizedText({ en: "Preview", zh: "预览" }) }}</h4>
          <div class="export-preview">
            <p><strong>{{ getLocalizedText({ en: "Format", zh: "格式" }) }}：</strong>{{ editingConfig.format }}</p>
            <p><strong>{{ getLocalizedText({ en: "Output Path", zh: "输出路径" }) }}：</strong><code>{{ getPreviewPath(editingConfig) }}</code></p>
            <p><strong>Excalidraw：</strong>{{ editingConfig.excalidraw_export_type }} 
              <span v-if="editingConfig.excalidraw_export_type === 'png'">({{ editingConfig.excalidraw_png_scale }}x)</span>
            </p>
          </div>
        </div>
      </div>
    </ObsidianVueModal>

    <!-- 添加新导出格式按钮 -->
    <div class="module-section" style="display: flex; justify-content: center;">
      <div class="horizontal-stack">
        <Dropdown
          v-model="selectedFormat"
          :options="formatOptions"
          placeholder="Select export format..."
        />
        <Button
          variant="primary"
          @click="addNewExportConfig"
          class="add-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {{ getLocalizedText({ en: "Add Export Format", zh: "添加导出格式" }) }}
        </Button>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model:visible="deleteConfirmVisible"
      :obsidian-app="plugin.app"
      :onConfirm="confirmDelete"
      :onCancel="cancelDelete"
    >
      <h2 class="modal-title">{{ getLocalizedText({ en: "Confirm Delete Export Format", zh: "确认删除导出格式" }) }}</h2>
      <p>{{ getLocalizedText({ en: "Are you sure you want to delete this export format?", zh: "确认要删除此导出格式吗？" }) }}</p>
    </ConfirmDialog>
  </div>
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
import ToggleSwitch from '../../vue/components/ToggleSwitch.vue';
import TextInput from '../../vue/components/TextInput.vue';
import TextArea from '../../vue/components/TextArea.vue';
import Button from '../../vue/components/Button.vue';
import Dropdown from '../../vue/components/Dropdown.vue';
  import MultiColumn from '../../vue/components/MultiColumn.vue';
  import ConfirmDialog from '../../vue/components/ConfirmDialog.vue';
  import { debugLog } from '../../lib/testUtils';
  import { getLocalizedText } from '../../lib/textUtils';

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
const settings = reactive<ExportManagerSetting>({
  exportConfigs: [...(props.plugin.settingList.exportFormats as ExportManagerSetting || DEFAULT_EXPORT_FORMATS_SETTINGS).exportConfigs]
});

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
 * 获取预览路径
 */
const getPreviewPath = (config: ExportConfig): string => {
  const outputDir = config.output_dir || EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR;
  const outputName = config.output_base_name || EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME;
  return `${outputDir}/${outputName}.${getExtensionByFormat(config.format)}`;
};

/**
 * 根据格式获取文件扩展名
 */
const getExtensionByFormat = (format: OutputFormat): string => {
  return EXTENSION_MAP[format] || 'txt';
};

/**
 * 保存设置到插件
 */
const saveSettings = async () => {
  try {
    // 更新插件设置
    props.plugin.settingList.exportFormats = { ...settings };
    
    // 保存到磁盘
    await props.plugin.saveData(props.plugin.settingList);
    
    // 发出设置变更事件
    emit('settings-changed', settings);
    
    debugLog('Export formats settings saved');
  } catch (error) {
    debugLog('Failed to save export formats settings:', error);
  }
};

// 创建防抖保存函数
const debouncedSave = debounce(saveSettings, 500);

/**
 * 保存设置并处理拖拽结束
 */
const handleDragEnd = () => {
  debugLog('Drag ended, order saved');
  debouncedSave();
};

/**
 * 处理导出格式启用状态变更
 */
const handleExportEnabledChange = (index: number, enabled: boolean) => {
  debugLog(`Export format ${index} enabled:`, enabled);
  settings.exportConfigs[index].enabled = enabled;
  debouncedSave();
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
  debouncedSave();
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
  const command = process.platform === 'win32'
    ? `explorer "${formatStylesPath}"`
    : process.platform === 'darwin'
      ? `open "${formatStylesPath}"`
      : `xdg-open "${formatStylesPath}"`;
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
  
  const config = settings.exportConfigs[deleteConfigIndex.value];
  debugLog('Export config deleted:', config.name);
  
  // 删除对应的资源文件夹
  const formatStylesPath = path.posix.join(
    props.plugin.PLUGIN_ABS_PATH,
    config.style_dir
  );
  if (fs.existsSync(formatStylesPath)) {
    fs.rmSync(formatStylesPath, { recursive: true, force: true });
  }
  
  settings.exportConfigs.splice(deleteConfigIndex.value, 1);
  deleteConfigIndex.value = null;
  debouncedSave();
};

/**
 * 取消删除操作
 */
const cancelDelete = () => {
  deleteConfigIndex.value = null;
};

/**
 * 添加新导出格式配置
 */
const addNewExportConfig = async () => {
  const hexId = generateTimestamp("hex");
  const newConfig: ExportConfig = {
    id: hexId,
    style_dir: path.posix.join('styles', hexId),
    name: `${hexId}`,
    output_dir: EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR,
    output_base_name: EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME + '_' + hexId,
    yaml: getDefaultYAML(selectedFormat.value) || '',
    enabled: true,
    format: selectedFormat.value,
    excalidraw_export_type: EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_EXPORT_TYPE,
    excalidraw_png_scale: EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_PNG_SCALE
  };

  // 创建对应的资源文件夹
  const styleDirAbs = path.posix.join(
    props.plugin.PLUGIN_ABS_PATH,
    newConfig.style_dir
  );
  if (!fs.existsSync(styleDirAbs)) {
    fs.mkdirSync(styleDirAbs, { recursive: true });
  }
  createFormatAssetStructure(styleDirAbs, selectedFormat.value);
  
  debugLog('New export config added:', newConfig.name);
  settings.exportConfigs.push(newConfig);
  debouncedSave();
};

/**
 * 处理弹窗可见性变更
 */
const onModalVisibilityChange = (visible: boolean) => {
  if (!visible) {
    // 弹窗关闭时，清理状态
    editingConfig.value = null;
    debouncedSave();
  }
};
</script>

<style scoped>
@import '../../vue/shared-styles.css';

.export-formats-settings {
  padding: 0;
}

/* 拖拽时的ghost效果 - 只改变边框颜色 */
.ghost {
  border-color: var(--interactive-accent) !important;
}

.export-item {
  padding: 9px;
  margin-bottom: 9px;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.export-enabled {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  opacity: 1;
}

.export-disabled {
  background: #f9fafb;
  border: 2px solid #d1d5db;
  opacity: 0.6;
}

.export-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal);
}

.export-separator {
  color: var(--text-muted);
  margin: 0 8px;
}

.export-preview {
  font-size: 13px;
  color: var(--text-muted);
}

.output-path {
  font-family: var(--font-monospace);
  font-size: 12px;
}

.export-actions {
  display: flex;
  align-items: center;
  gap: 9px;
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

/* 弹窗表单样式 */
.export-modal-form {
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

.png-scale-slider {
  width: 100%;
  height: 6px;
  background: var(--background-modifier-border);
  outline: none;
  border-radius: 3px;
}

.png-scale-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--interactive-accent);
  cursor: pointer;
  border-radius: 50%;
}

.png-scale-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--interactive-accent);
  cursor: pointer;
  border-radius: 50%;
  border: none;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style> 