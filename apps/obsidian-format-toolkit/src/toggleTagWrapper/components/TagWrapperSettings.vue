<!--
  Tag Wrapper模块设置面板
  
  功能说明：
  - 管理标签包装器的配置列表
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
        配置文本包装标签的命令，支持自定义开始和结束标签
      </p>
    </div>

    <!-- 标签配置列表 -->
    <div class="tag-configs-list">
      <ConfigurationItem
        v-for="(tag, index) in settings.tags"
        :key="tag.id"
        :title="`标签配置 ${index + 1}`"
        :description="`命令: ${tag.name} | 标签: ${tag.prefix}...${tag.suffix}`"
      >
        <template #control>
          <div class="tag-controls">
            <ToggleSwitch
              v-model="tag.enabled"
              @update:model-value="handleTagEnabledChange(index, $event)"
            />
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
        </template>

        <template #details v-if="tag.enabled">
          <div class="tag-details">
            <div class="form-group">
              <label>命令名称：</label>
              <TextInput
                v-model="tag.name"
                placeholder="输入命令名称..."
                @update:model-value="handleTagChange(index, 'name', $event)"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>开始标签：</label>
                <TextInput
                  v-model="tag.prefix"
                  placeholder="如: <u> 或 **"
                  @update:model-value="handleTagChange(index, 'prefix', $event)"
                />
              </div>

              <div class="form-group">
                <label>结束标签：</label>
                <TextInput
                  v-model="tag.suffix"
                  placeholder="如: </u> 或 **"
                  @update:model-value="handleTagChange(index, 'suffix', $event)"
                />
              </div>
            </div>

            <div class="tag-preview">
              <strong>预览效果：</strong>
              <code>{{ tag.prefix }}文本内容{{ tag.suffix }}</code>
            </div>
          </div>
        </template>
      </ConfigurationItem>
    </div>

    <!-- 添加新标签按钮 -->
    <div class="add-tag-section">
      <ConfigurationItem
        title="添加新标签配置"
        description="创建一个新的标签包装器命令"
      >
        <template #control>
          <Button
            variant="primary"
            @click="addNewTag"
          >
            添加标签
          </Button>
        </template>
      </ConfigurationItem>
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
import { reactive } from 'vue';
import type MyPlugin from '../../main';
import type { TagConfig, TagWrapperSettings } from '../settings';
import { DEFAULT_TAG_WRAPPER_SETTINGS } from '../settings';
import { debounce } from '../../vue/utils';
import ConfigurationItem from '../../vue/components/ConfigurationItem.vue';
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

/**
 * 生成5位16进制随机ID
 * @returns string 格式如：'a1b2c'
 */
function generateHexId(): string {
  return Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
}

/**
 * 保存设置到插件
 */
const saveSettings = async () => {
  try {
    saveState.saving = true;
    saveState.error = null;
    
    // 更新插件设置
    props.plugin.settingList.tagWrapper = { ...settings };
    
    // 保存到文件
    await props.plugin.saveData(props.plugin.settingList);
    
    // 发出变更事件
    emit('settings-changed', { ...settings });
    
    console.log('Tag wrapper settings saved successfully');
  } catch (error) {
    saveState.error = error instanceof Error ? error.message : '未知错误';
    console.error('Failed to save tag wrapper settings:', error);
  } finally {
    saveState.saving = false;
  }
};

// 创建防抖保存函数
const debouncedSave = debounce(saveSettings, 500);

/**
 * 处理标签启用状态变更
 */
const handleTagEnabledChange = (index: number, enabled: boolean) => {
  settings.tags[index].enabled = enabled;
  debouncedSave();
};

/**
 * 处理标签属性变更
 */
const handleTagChange = (index: number, field: keyof TagConfig, value: string) => {
  if (field === 'enabled') return; // enabled用专门的处理函数
  
  (settings.tags[index] as any)[field] = value;
  debouncedSave();
};

/**
 * 添加新标签配置
 */
const addNewTag = () => {
  const hexId = generateHexId();
  const newTag: TagConfig = {
    id: `tag-${hexId}`,
    name: `标签 ${hexId}`,
    prefix: '<tag>',
    suffix: '</tag>',
    enabled: true
  };
  
  settings.tags.push(newTag);
  debouncedSave();
};

/**
 * 删除标签配置
 */
const deleteTag = (index: number) => {
  if (settings.tags.length <= 1) {
    return; // 至少保留一个标签配置
  }
  
  if (confirm(`确定要删除标签配置"${settings.tags[index].name}"吗？`)) {
    settings.tags.splice(index, 1);
    debouncedSave();
  }
};
</script>

<style scoped>
.tag-wrapper-settings {
  padding: 16px 0;
}

.module-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--background-modifier-border);
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

.tag-configs-list {
  margin-bottom: 24px;
}

.tag-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-details {
  padding: 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-normal);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tag-preview {
  margin-top: 12px;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 4px;
  border-left: 3px solid var(--interactive-accent);
}

.tag-preview strong {
  color: var(--text-normal);
  margin-right: 8px;
}

.tag-preview code {
  background: var(--background-primary);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: var(--font-monospace);
  color: var(--text-accent);
}

.add-tag-section {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--background-modifier-border);
}

.save-indicator, .error-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 16px;
}

.save-indicator {
  background: var(--background-secondary);
  color: var(--text-accent);
  border-left: 3px solid var(--interactive-accent);
}

.error-indicator {
  background: var(--background-secondary);
  color: var(--text-error);
  border-left: 3px solid var(--text-error);
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--background-modifier-border);
  border-top: 2px solid var(--interactive-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .tag-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 