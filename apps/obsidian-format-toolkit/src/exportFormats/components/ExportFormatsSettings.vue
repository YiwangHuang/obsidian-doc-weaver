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
    <!-- 批量导出设置 -->
    <div class="d-flex align-center my-2">
      <div class="flex-grow-1">
        <div class="text-subtitle-2 font-weight-medium">
          {{ getLocalizedText({ en: 'Enable Batch Export Confirmation', zh: '启用批量导出' }) }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ getLocalizedText({ 
            en: 'Enable Doc Weaver export option in the right-click menu of the file list', 
            zh: '在文件列表的右键菜单中启用 Doc Weaver 导出选项' 
          }) }}
        </div>
      </div>
      <v-switch
        v-model="settings.batchExportEnabled"
        @update:model-value="handleBatchExportEnabledChange"
        hide-details
        density="compact"
      />
    </div>

    <!-- 分割线 -->
    <v-divider class="border-opacity-100 my-2" />
  
    <div class="my-2">
      <div class="text-subtitle-2 font-weight-medium">{{ getLocalizedText({ en: "Configure Export Presets", zh: "配置导出预设" }) }}</div>
      <p class="text-caption text-medium-emphasis">
        {{ getLocalizedText({
          en: "Configure export presets, support various output formats",
          zh: "配置导出预设，支持多种输出格式"
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
              <v-col cols="6">
                <div class="d-flex align-center">
                  <v-chip class="me-2"
                    :color="config.enabled ? OBSIDIAN_PRIMARY_COLOR : 'grey'" 
                    size="small" 
                    label
                  >
                    {{ config.format }}
                  </v-chip>
                
  
                <!-- 格式名称和图标 -->
                  <IconSelectButton :app="props.plugin.app" :command="config" />
                  <div class="text-subtitle-2 font-weight-medium">{{ config.name }}</div>
                </div>
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
                  <v-btn
                    size="small"
                    @click="openExportModal(index)"
                    class="me-1 icon-btn-square"
                  >
                    <Icon name="gear" />
                  </v-btn>
                  <v-tooltip :text="getLocalizedText({ en: 'Duplicate preset', zh: '复制预设' })" location="top" :open-delay="200">
                    <template #activator="{ props: tooltipProps }"> 
                      <v-btn
                        v-bind="tooltipProps"
                        size="small"
                        @click="props.plugin.exportFormatsManager.duplicateExportFormatItem(index)"
                        class="me-1 icon-btn-square"
                      >
                        <Icon name="copy" />
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-btn
                    size="small"
                    @click="showDeleteConfirm(index)"
                    class="me-1 icon-btn-square"
                  >
                    <Icon name="trash-2" />
                  </v-btn>
                  <v-tooltip :text="getLocalizedText({ en: 'Open the style folder to customize export style', zh: '打开样式文件夹，自定义导出样式' })" location="top" :open-delay="200">
                    <template #activator="{ props }"> 
                      <v-btn
                        v-bind="props"
                        size="small"
                        @click="openAssetsFolder(config)"
                        class="icon-btn-square"
                      >
                        <Icon name="folder" />
                      </v-btn>
                    </template>
                  </v-tooltip>
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
          :label="getLocalizedText({ en: 'Export Format', zh: '导出格式' })"
          :items="formatOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          style="max-width: 200px;"
          hide-details
        />
        <v-btn
          @click="props.plugin.exportFormatsManager.addExportFormatItem(selectedFormat)"
          :disabled="!selectedFormat"
        >
          <Icon name="plus" class="me-1" />
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
      <div class="export-modal-wrapper">
        <div v-if="editingConfig" class="export-modal-form">
        <h3 class="mt-0 pt-0">
          {{ getLocalizedText({ en: "Edit Export Preset", zh: "编辑导出预设" }) }}
        </h3>
        
        <!-- 侧栏导航布局：基本设置 + 附件设置 -->
        <RailSidebar v-model="activeSectionId" :sections="modalSectionsLocalized">

          <!-- 基本设置：格式名称、内容模板、输出路径 -->
          <template v-if="activeSectionId === 'basic'">
            <!-- 格式名称 -->
            <v-text-field
              v-model="editingConfig.name"
              :label="getLocalizedText({ en: 'Format Name', zh: '格式名称' })"
              variant="outlined"
              density="compact"
              class="mb-3"
            />

            <!-- 内容模板 -->
            <InputWithPlaceholders :placeholders="templatePlaceholders">
              <v-textarea
                v-model="editingConfig.contentTemplate"
                :label="getLocalizedText({ en: 'Template Configuration', zh: '模板配置' })"
                placeholder="Enter export format template..."
                variant="outlined"
                rows="8"
                density="compact"
                class="mb-3"
              />
            </InputWithPlaceholders>

            <!-- 输出目录和文件名 -->
            <v-row class="mb-3">
              <v-col cols="6" class="pb-0">
                <InputWithPlaceholders :placeholders="pathPlaceholders">
                  <v-text-field
                    v-model="editingConfig.outputDirAbsTemplate"
                    :label="getLocalizedText({ en: 'Output Directory', zh: '输出目录' })"
                    :placeholder="getExportConfigIO(editingConfig).getDefaults().outputDirAbsTemplate"
                    variant="outlined"
                    density="compact"
                  />
                </InputWithPlaceholders>
              </v-col>
              <v-col cols="6" class="pb-0">
                <InputWithPlaceholders :placeholders="pathPlaceholders">
                  <v-text-field
                    v-model="editingConfig.outputBasenameTemplate"
                    :label="getLocalizedText({ en: 'Output Filename', zh: '输出文件名' })"
                    :placeholder="getExportConfigIO(editingConfig).getDefaults().outputBasenameTemplate"
                    variant="outlined"
                    density="compact"
                  />
                </InputWithPlaceholders>
              </v-col>
            </v-row>

            <!-- 输出路径预览 -->
            <PreviewPanel
              :title="getLocalizedText({ en: 'Output Path Preview', zh: '输出路径预览' })"
              :content="getPreviewPath(editingConfig)"
            />
          </template>

          <!-- 附件设置：分为图片附件和视频附件两个分类 -->
          <template v-else-if="activeSectionId === 'attachment'">

            <!-- ========== 第一类：图片附件设置（含 Excalidraw） ========== -->
            <div class="text-subtitle-1 font-weight-bold mb-3">
              {{ getLocalizedText({ en: 'Image Attachment Settings', zh: '图片附件设置' }) }}
            </div>

            <!-- 图片导出目录和嵌入链接 -->
            <v-row class="mb-3">
              <v-col cols="6" class="pb-0">
                <InputWithPlaceholders :placeholders="attachmentDirPlaceholders">
                  <v-text-field
                    v-model="editingConfig.imageDirAbsTemplate"
                    :label="getLocalizedText({ en: 'Image Export Directory', zh: '图片导出目录' })"
                    :placeholder="getExportConfigIO(editingConfig).getDefaults().imageDirAbsTemplate"
                    variant="outlined"
                    density="compact"
                    class="mb-3"
                  />
                </InputWithPlaceholders>
              </v-col>
              <v-col cols="6" class="pb-0">
                <InputWithPlaceholders :placeholders="attachmentRefPlaceholders">
                  <v-text-field
                    v-model="editingConfig.imageLinkTemplate"
                    :label="getLocalizedText({ en: 'Image Embed Link', zh: '图片嵌入链接' })"
                    :placeholder="getExportConfigIO(editingConfig).getDefaults().imageLinkTemplate"
                    variant="outlined"
                    density="compact"
                    class="mb-3"
                  />
                </InputWithPlaceholders>
              </v-col>
            </v-row>
            <!-- 图片导出目录预览 -->
            <PreviewPanel
              :title="getLocalizedText({ en: 'Image Export Directory Preview', zh: '图片导出目录预览' })"
              :content="getAttachmentDirPreview(editingConfig)"
            />

            <!-- Excalidraw 导出设置（归属图片附件分类） -->
            <v-divider class="border-opacity-100 my-3" />
            <div class="text-subtitle-2 font-weight-medium mb-5">
              {{ getLocalizedText({ en: 'Excalidraw Export Settings', zh: 'Excalidraw 导出设置' }) }}
            </div>
            <v-row class="mb-3">
              <v-col cols="5">
                <v-select
                  v-model="editingConfig.excalidrawExportType"
                  :items="excalidrawExportOptions"
                  item-title="label"
                  item-value="value"
                  :label="getLocalizedText({ en: 'Export Type', zh: '导出类型' })"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="getExportConfigIO(editingConfig).sanitize(editingConfig)"
                />
              </v-col>
              <v-col cols="2" />
              <v-col cols="5" v-if="editingConfig.excalidrawExportType === 'png'">
                <div style="display:flex; align-items:center; gap:12px">
                  <span>{{ getLocalizedText({ en: "PNG Scale", zh: "PNG缩放比例" }) }}</span>
                  <v-slider
                    v-model="editingConfig.excalidrawPngScale"
                    min="0.1"
                    max="9"
                    step="0.1"
                    density="compact"
                    thumb-label="always"
                    hide-details
                    style="transform: translateY(-3px)"
                  />
                </div>
              </v-col>
            </v-row>

            <!-- ========== 第二类：视频附件导出设置 ========== -->
            <v-divider class="border-opacity-100 my-4" />
            <div class="d-flex align-center mb-3">
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-bold">
                  {{ getLocalizedText({ en: 'Video Attachment Settings', zh: '视频附件导出设置' }) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ getLocalizedText({ en: 'Enable processing of video attachments during export', zh: '导出时启用视频附件的处理功能' }) }}
                </div>
              </div>
              <!-- 视频附件导出总开关 -->
              <v-tooltip :text="getLocalizedText({ en: 'Please ensure your publishing platform supports video files before enabling this feature', zh: '启用前请确保您的发布平台支持视频文件' })" location="top" :open-delay="200">
                <template #activator="{ props }">
                  <v-switch
                    v-bind="props"
                    :model-value="!!editingConfig.processVideo"
                    @update:model-value="editingConfig.processVideo = $event || undefined"
                    density="compact"
                    hide-details
                    class="me-3"
                  />
                </template>
              </v-tooltip>
            </div>

            <!-- 视频附件具体设置项：未启用时灰色不可编辑，始终可见 -->
            <div :class="{ 'video-settings-disabled': !editingConfig.processVideo }">
              <v-row class="mb-3">
                <v-col cols="6" class="pb-0">
                  <InputWithPlaceholders :placeholders="attachmentDirPlaceholders">
                    <v-text-field
                      v-model="editingConfig.videoDirAbsTemplate"
                      :label="getLocalizedText({ en: 'Video Export Directory', zh: '视频导出目录' })"
                      :placeholder="getExportConfigIO(editingConfig).getDefaults().videoDirAbsTemplate"
                      variant="outlined"
                      density="compact"
                      class="mb-3"
                      :disabled="!editingConfig.processVideo"
                    />
                  </InputWithPlaceholders>
                </v-col>
                <v-col cols="6" class="pb-0">
                  <InputWithPlaceholders :placeholders="attachmentRefPlaceholders">
                    <v-text-field
                      v-model="editingConfig.videoLinkTemplate"
                      :label="getLocalizedText({ en: 'Video Reference Template', zh: '视频引用模板' })"
                      :placeholder="editingConfig.imageLinkTemplate"
                      variant="outlined"
                      density="compact"
                      class="mb-3"
                      :disabled="!editingConfig.processVideo"
                    />
                  </InputWithPlaceholders>
                </v-col>
              </v-row>
              <!-- 视频导出目录预览 -->
              <PreviewPanel
                :title="getLocalizedText({ en: 'Video Export Directory Preview', zh: '视频导出目录预览' })"
                :content="getMediaDirPreview(editingConfig)"
              />
            </div>
          </template>

        </RailSidebar>
        </div>
      </div>
    </ObsidianVueModal>

  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import draggable from 'vuedraggable';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import type MyPlugin from '../../main';
import { ConfirmModal } from '../../lib/modalUtils';
import type { 
  ExportConfig, 
  ExportManagerSettings
} from '../types';
import { 
  getExportConfigIO,
  FORMAT_OPTIONS,
  EXCALIDRAW_EXPORT_OPTIONS,
  EXTENSION_MAP
} from '../types';
import type { OutputFormat } from '../textConvert/textConverter';
import IconSelectButton from '../../vue/components/IconSelectButton.vue';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import Icon from '../../vue/components/Icon.vue';
import PreviewPanel from '../../vue/components/PreviewPanel.vue';
import { debugLog } from '../../lib/debugUtils';
import { getLocalizedText } from '../../lib/textUtils';
// 路径预览功能
import { TextConverter } from '../textConvert';
import InputWithPlaceholders from '../../vue/components/InputWithPlaceholders.vue';
import RailSidebar from '../../vue/components/RailSidebar.vue';
import { OBSIDIAN_PRIMARY_COLOR } from '../../vue/plugins/vuetify';
// 导入占位符常量
import * as placeholders from '../../lib/constant';

// 定义Props
interface ExportFormatsSettingsProps {
  plugin: MyPlugin;
}

// 定义Events
interface ExportFormatsSettingsEmits {
  (e: 'settings-changed', settings: ExportManagerSettings): void;
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

// 侧栏分组数据：基本设置 + 附件设置。
const modalSections = [
  { id: 'basic',      icon: 'file-text',  title: { en: 'Basic Settings',       zh: '基本设置' } },
  { id: 'attachment', icon: 'paperclip',  title: { en: 'Attachments Settings', zh: '附件设置' } },
];
// 翻译后的分组列表，传给 RailSidebar 组件。
const modalSectionsLocalized = computed(() =>
  modalSections.map(s => ({ id: s.id, icon: s.icon, title: getLocalizedText(s.title) }))
);
// 当前激活的设置分组 ID。
const activeSectionId = ref('basic');

// 表单选项
const selectedFormat = ref<OutputFormat>('typst');
const formatOptions = FORMAT_OPTIONS;
const excalidrawExportOptions = EXCALIDRAW_EXPORT_OPTIONS;

/**
 * 获取输出路径预览（支持占位符替换）
 * @param config 当前编辑的导出配置
 * @returns 输出路径预览字符串
 */
const getPreviewPath = (config: ExportConfig): string => {
  const pathTemplate = `${config.outputDirAbsTemplate}/${config.outputBasenameTemplate}.${EXTENSION_MAP[config.format] || 'txt'}`;
  
  // 获取当前活动文件
  const activeFile = props.plugin.app.workspace.getActiveFile();
  if (!activeFile) {
    return pathTemplate;
  }
  
  try {
    const converter = new TextConverter(props.plugin, activeFile, config);
    return converter.replacePlaceholders(pathTemplate);
  } catch (error) {
    debugLog('Error replacing placeholders in preview path:', error);
    return pathTemplate;
  }
};

/**
 * 保存设置并处理拖拽结束
 */
const handleDragEnd = () => {
  debugLog('Drag ended, order saved');
};

/**
 * 处理批量导出确认功能启用状态变更
 */
const handleBatchExportEnabledChange = (enabled: boolean) => {
  debugLog(`Batch export confirmation enabled:`, enabled);
  settings.batchExportEnabled = enabled;
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
 * 打开资源文件夹
 */
const openAssetsFolder = (config: ExportConfig) => {
  const formatStylesPath = path.posix.join(
    props.plugin.PLUGIN_ABS_PATH,
    config.styleDirRel
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
  const confirmMessage = getLocalizedText({ en: "Confirm Delete Export Preset: ", zh: "确认删除导出预设: " }) + settings.exportConfigs[index].name;
  // new ConfirmModal(props.plugin.app, getLocalizedText({ en: "Confirm Delete Export Preset: ", zh: "确认删除导出预设: " }) + settings.exportConfigs[index].name, confirmDelete, cancelDelete).open();
  new ConfirmModal(
                    props.plugin.app,
                    confirmMessage,
                    async () => await confirmDelete()
                    , () => cancelDelete()
                    ).open();
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

// 占位符配置
// 路径相关的占位符
const pathPlaceholders = [
  { value: placeholders.VAR_VAULT_DIR, description: getLocalizedText({ en: 'Vault directory', zh: '库目录' }) },
  { value: placeholders.VAR_NOTE_NAME, description: getLocalizedText({ en: 'Note name', zh: '笔记名称' }) },
  { value: placeholders.VAR_DATE, description: getLocalizedText({ en: 'Current date', zh: '当前日期' }) },
];

// 附件目录模板占位符
const attachmentDirPlaceholders = [
  { value: placeholders.VAR_OUTPUT_DIR, description: getLocalizedText({ en: 'Output directory', zh: '输出目录' }) },
  { value: placeholders.VAR_VAULT_DIR, description: getLocalizedText({ en: 'Vault directory', zh: '库目录' }) },
  { value: placeholders.VAR_NOTE_DIR, description: getLocalizedText({ en: 'Note directory', zh: '笔记所在目录' }) },
  { value: placeholders.VAR_NOTE_NAME, description: getLocalizedText({ en: 'Note name', zh: '笔记名称' }) },
  { value: placeholders.VAR_DATE, description: getLocalizedText({ en: 'Current date', zh: '当前日期' }) },
];

// 附件引用模板占位符
const attachmentRefPlaceholders = [
  { value: placeholders.VAR_ATTACHMENT_FILE_NAME, description: getLocalizedText({ en: 'Attachment filename (required)', zh: '附件文件名（必需）' }) },
];

// 模板相关的占位符
const templatePlaceholders = [
  { value: placeholders.VAR_NOTE_NAME, description: getLocalizedText({ en: 'Note name', zh: '笔记名称' }) },
  { value: placeholders.VAR_CONTENT, description: getLocalizedText({ en: 'Note content', zh: '笔记内容' }) },
  // { value: '{{title}}', description: getLocalizedText({ en: 'Note title', zh: '笔记标题' }) },
  { value: placeholders.VAR_DATE, description: getLocalizedText({ en: 'Current date', zh: '当前日期，支持自定义' }) },
  // { value: '{{date:HH:mm}}', description: getLocalizedText({ en: 'Current time', zh: '当前时间' }) },
];

/**
 * 获取附件目录预览（支持占位符替换，包括 {{outputDir}}）
 * @param config 当前编辑的导出配置
 * @returns 附件目录预览字符串
 */
const getAttachmentDirPreview = (config: ExportConfig): string => {
  const attachmentDirTemplate = config.imageDirAbsTemplate;
  
  // 获取当前活动文件
  const activeFile = props.plugin.app.workspace.getActiveFile();
  if (!activeFile) {
    return attachmentDirTemplate;
  }
  
  try {
    const converter = new TextConverter(props.plugin, activeFile, config);
    
    // 先获取并替换输出目录路径（用于替换 {{outputDir}}）
    const outputDirResolved = converter.replacePlaceholders(config.outputDirAbsTemplate);
    
    // 替换附件目录模板中的 {{outputDir}} 占位符
    // let dirPreview = attachmentDirTemplate.replace(placeholders.VAR_OUTPUT_DIR, outputDirResolved);
    
    // 替换其他占位符
    const attachmentDirPreview = converter.replacePlaceholders(attachmentDirTemplate).replace(placeholders.VAR_OUTPUT_DIR, outputDirResolved);
    
    return path.posix.resolve(attachmentDirPreview);
  } catch (error) {
    debugLog('Error replacing placeholders in attachment directory preview:', error);
    return attachmentDirTemplate;
  }
};

/**
 * 获取媒体附件目录预览（支持占位符替换，包括 {{outputDir}}）
 * 若未配置媒体附件目录模板，则回退到附件目录模板
 * @param config 当前编辑的导出配置
 * @returns 媒体附件目录预览字符串
 */
const getMediaDirPreview = (config: ExportConfig): string => {
  // 若未配置媒体附件目录，回退使用附件目录模板
  const mediaDirTemplate = config.videoDirAbsTemplate || config.imageDirAbsTemplate;
  
  // 获取当前活动文件
  const activeFile = props.plugin.app.workspace.getActiveFile();
  if (!activeFile) {
    return mediaDirTemplate;
  }
  
  try {
    const converter = new TextConverter(props.plugin, activeFile, config);
    
    // 先获取并替换输出目录路径（用于替换 {{outputDir}}）
    const outputDirResolved = converter.replacePlaceholders(config.outputDirAbsTemplate);
    
    // 替换媒体附件目录模板中的占位符
    const mediaDirPreview = converter.replacePlaceholders(mediaDirTemplate).replace(placeholders.VAR_OUTPUT_DIR, outputDirResolved);
    
    return path.posix.resolve(mediaDirPreview);
  } catch (error) {
    debugLog('Error replacing placeholders in media directory preview:', error);
    return mediaDirTemplate;
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

/* Modal 外层包装器 */
.export-modal-wrapper {
  width: 900px;
  max-width: 90vw;
  min-width: 0;
  box-sizing: border-box;
}

/* 弹窗表单区域 */
.export-modal-form {
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
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

/* 格式标签芯片样式 - 规定尺寸和外观 */
.v-chip {
  width: 52px !important;
  height: 25px !important;
  font-size: 0.75rem !important;
  font-weight: 500;
  border-radius: 9px;
  /* box-sizing: border-box !important; */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 视频设置禁用态：整体降低透明度，禁止交互 */
.video-settings-disabled {
  opacity: 0.7;
  pointer-events: none;
}
</style> 