<!--
  Extra Command模块设置面板 - Vuetify版本
-->
<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <div>
      <h3 class="my-2">{{ getLocalizedText({ en: "Extra Command Settings", zh: "额外命令设置" }) }}</h3>
      <p class="text-medium-emphasis my-2">
        {{ getLocalizedText({
          en: "Configure extra command shortcuts for quick access in the toolbar",
          zh: "配置额外的命令快捷方式，便于在工具栏中快速访问"
        }) }}
      </p>
    </div>

    <!-- 可拖拽的命令配置列表 -->
    <draggable
      v-model="configs.extraCommands"
      item-key="commandId"
      ghost-class="v-card--dragging"
      chosen-class="v-card--chosen"
      @end="handleDragEnd()"
    >
      <template #item="{ element: command, index }">
        <v-card 
          class="mb-3" 
          :class="{ 'opacity-60': !command.enabled }"
          elevation="1"
        >
          <v-card-text class="py-3">
            <v-row align="center" no-gutters>
              <!-- 命令名称和图标 -->
               <v-col cols="6">
                 <div class="d-flex align-center">
                   <IconSelectButton :app="props.plugin.app" :command="command" />
                   <div class="text-subtitle-2 font-weight-medium">{{ command.name }}</div>
                 </div>
               </v-col>

              <!-- 命令ID预览 -->
              <v-col cols="2">
                <div class="text-caption text-medium-emphasis">
                  <code style="background: var(--background-modifier-border); padding: 2px 4px; border-radius: 3px;">
                    {{ getCommandPreview(command.commandId) }}
                  </code>
                </div>
              </v-col>
              
              <!-- 操作按钮 -->
              <v-col cols="4">
                <div class="d-flex align-center justify-end">
                  <v-switch
                    v-model="command.enabled"
                    @update:model-value="handleCommandEnabledChange(index, $event)"
                    density="compact"
                    hide-details
                    class="me-3"
                  />
                  <v-btn
                    size="small"
                    @click="openCommandModal(index)"
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

    <!-- 添加新命令按钮 -->
    <div class="text-center mt-4">
      <v-btn
        @click="addNewCommand()"
      >
        <Icon name="plus" class="me-2" />
        {{ getLocalizedText({ en: "Add Command Configuration", zh: "添加命令配置" }) }}
      </v-btn>
    </div>

    <!-- 命令编辑对话框 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="props.plugin.app"
    >
      <div v-if="editingCommand">
        <h3 class="pt-0 mt-0">
          {{ getLocalizedText({ en: "Edit Command Configuration", zh: "编辑命令配置" }) }}: {{ editingCommand.name }}
        </h3>
        
        <v-form class="mt-4">
          <!-- 命令名称 -->
          <div class="mb-3">
            <v-text-field
              v-model="editingCommand.name"
              :label="getLocalizedText({ en: 'Command Name', zh: '命令名称' })"
              variant="outlined"
              density="compact"
            />
          </div>

          <PreviewPanel :title="getLocalizedText({ en: 'Command Original Name', zh: '命令原名' })">
            {{ findCommand(props.plugin.app, editingCommand.commandId)?.name || getLocalizedText({ en: 'Command not found', zh: '命令未找到' }) }}
          </PreviewPanel>
        </v-form>
      </div>
    </ObsidianVueModal>

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="deleteConfirmVisible"
      :obsidian-app="props.plugin.app"
      :title="getLocalizedText({ en: 'Delete Command', zh: '删除命令' })"
      :message="getLocalizedText({ 
        en: 'Are you sure you want to delete this command configuration?', 
        zh: '确定要删除这个命令配置吗？' 
      })"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import draggable from 'vuedraggable';
import type MyPlugin from '../../main';
import type { ExtraCommandConfig, GeneralSettings } from '../index';
import { debugLog } from '../../lib/debugUtils';
import { getLocalizedText } from '../../lib/textUtils';
import { generalInfo } from '../index';
import Icon from '../../vue/components/Icon.vue';
import IconSelectButton from '../../vue/components/IconSelectButton.vue';
import ObsidianVueModal from '../../vue/components/ObsidianVueModal.vue';
import PreviewPanel from '../../vue/components/PreviewPanel.vue';
import ConfirmDialog from '../../vue/components/ConfirmDialog.vue';
import { openCommandSelector, findCommand } from '../../lib/commandUtils';

interface ExtraCommandSettingsProps {
  plugin: MyPlugin;
}

const props = defineProps<ExtraCommandSettingsProps>();

// 初始化设置
const configs = props.plugin.settingList[generalInfo.name] as GeneralSettings;

// 弹窗状态
const modalVisible = ref(false);
const editingCommand = ref<ExtraCommandConfig | null>(null);
const deleteConfirmVisible = ref(false);
const deleteCommandIndex = ref<number | null>(null);

// 获取命令ID预览文本（简化显示） - 用于命令列表预览
const getCommandPreview = (commandId: string): string => {
    return commandId.length > 30 ? commandId.substring(0, 30) + '...' : commandId;
};

/**
 * 拖拽结束处理函数 - 预留空实现
 */
const handleDragEnd = () => {
    debugLog('Command drag ended, order saved');
  // TODO: 实现拖拽保存逻辑
};

/**
 * 命令启用状态变化处理函数 - 预留空实现
 */
const handleCommandEnabledChange = (index: number, enabled: boolean) => {
    debugLog(`Command ${index} enabled:`, enabled);
    configs.extraCommands[index].enabled = enabled;
  // TODO: 实现启用状态变化保存逻辑
};

/**
 * 打开命令编辑弹窗 - 预留空实现
 */
const openCommandModal = (index: number) => {
    editingCommand.value = configs.extraCommands[index]; // 直接引用原始对象，实时保存
    modalVisible.value = true;
  // TODO: 实现弹窗打开逻辑
};

// 图标选择逻辑已抽离为 IconSelectButton 组件

/**
 * 添加新命令 - 预留空实现
 */
 const addNewCommand = async () => {
    const result = await openCommandSelector(props.plugin.app);
    if (result) {
      props.plugin.generalManager.addExtraCommand(result);
    } else {
      console.log('用户取消了命令选择');
    }
};

/**
 * 选择 Obsidian 命令 - 预留空实现
 */
const selectObsidianCommand = async () => {
  // TODO: 调用 openCommandSelector 函数
  debugLog('Select Obsidian command clicked');
};

/**
 * 保存命令配置 - 预留空实现
 */
const saveCommand = () => {
  // TODO: 实现保存命令配置逻辑
  modalVisible.value = false;
  debugLog('Save command clicked');
};

/**
 * 显示删除确认对话框 - 预留空实现
 */
const showDeleteConfirm = (index: number) => {
  deleteCommandIndex.value = index;
  deleteConfirmVisible.value = true;
  // TODO: 实现删除确认逻辑
};

/**
 * 确认删除命令 - 预留空实现
 */
const confirmDelete = () => {
  if (deleteCommandIndex.value === null) return;
  configs.extraCommands.splice(deleteCommandIndex.value, 1);
  // TODO: 实现删除命令逻辑
  debugLog('Delete command confirmed for index:', deleteCommandIndex.value);
  deleteCommandIndex.value = null;
  deleteConfirmVisible.value = false;
};

/**
 * 取消删除 - 预留空实现
 */
const cancelDelete = () => {
  deleteCommandIndex.value = null;
  deleteConfirmVisible.value = false;
  // TODO: 实现取消删除逻辑
};

/**
 * 处理图标变化 - 预留空实现
 */
const handleIconChange = (iconName: string) => {
  debugLog('Command icon changed:', iconName);
  // TODO: 实现图标变化保存逻辑
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
