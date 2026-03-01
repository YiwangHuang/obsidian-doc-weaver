<template>
  <div class="selector-demo">
    <h2>Obsidian 选择器使用示例</h2>
    
    <div class="button-group">
      <button @click="handleSelectCommand" class="selector-button">
        选择命令
      </button>
      <button @click="handleSelectIcon" class="selector-button">
        选择图标
      </button>
    </div>

    <div v-if="selectedCommand" class="result-display">
      <h3>选择的命令:</h3>
      <p><strong>命令ID:</strong> {{ selectedCommand.id }}</p>
      <p><strong>命令名称:</strong> {{ selectedCommand.name }}</p>
    </div>

    <div v-if="selectedIcon" class="result-display">
      <h3>选择的图标:</h3>
      <p><strong>图标名称:</strong> {{ selectedIcon }}</p>
      <div class="icon-preview" ref="iconPreview"></div>
    </div>

    <!-- 测试 findCommand：输入命令ID，查询并显示命令信息 -->
    <div class="result-display">
      <h3>findCommand 测试</h3>
      <input v-model="testCommandId" placeholder="输入命令ID，如 editor:toggle-bold" class="selector-input" />
      <button class="selector-button" @click="handleFindCommand">查找命令</button>
      <div v-if="foundCommand" class="found-command">
        <p><strong>命令ID:</strong> {{ foundCommand.id }}</p>
        <p><strong>命令名称:</strong> {{ foundCommand.name }}</p>
      </div>
      <div v-else-if="findTried">
        <p>未找到该命令</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, nextTick } from 'vue';
import { App, Command, setIcon } from 'obsidian';
import { openCommandSelector, findCommand } from '../../lib/commandUtils';
import { openIconSelector } from '../../lib/iconUtils';
import { logger } from '../../lib/debugUtils';
import type { DocWeaverInstance } from '../../main';

// 通过inject获取Obsidian App实例
// 需要在Vue应用启动时提供这个实例
const app = inject<DocWeaverInstance>('docWeaverInstance')?.app

// 响应式数据
const selectedCommand = ref<Command | null>(null);
const selectedIcon = ref<string | null>(null);
const iconPreview = ref<HTMLElement | null>(null);

// findCommand 测试相关状态
const testCommandId = ref('');
const foundCommand = ref<Command | null>(null);
const findTried = ref(false);

/**
 * 处理命令选择
 */
const handleSelectCommand = async () => {
  if (!app) {
    logger.error('Obsidian app instance not found');
    return;
  }

  try {
    const result = await openCommandSelector(app);
    if (result) {
      selectedCommand.value = result;
      logger.debug('selected command:', result);
    } else {
      logger.debug('user cancelled command selection');
    }
  } catch (error) {
    logger.error('command selector error:', error);
  }
};

// 测试：根据输入的命令ID查找命令
const handleFindCommand = () => {
  if (!app) {
    logger.error('Obsidian app instance not found');
    return;
  }
  findTried.value = true;
  foundCommand.value = testCommandId.value ? findCommand(app, testCommandId.value) : null;
};

/**
 * 处理图标选择
 */
const handleSelectIcon = async () => {
  if (!app) {
    logger.error('Obsidian app instance not found');
    return;
  }

  try {
    const iconName = await openIconSelector(app);
    if (iconName) {
      selectedIcon.value = iconName;
      logger.debug('selected icon:', iconName);
      
      // 使用 Obsidian 的 setIcon 渲染图标预览
      await nextTick();
      if (iconPreview.value) {
        iconPreview.value.innerHTML = ''; // 清空之前的内容
        if (iconName.startsWith('<svg')) {
          // 自定义SVG图标
          iconPreview.value.innerHTML = iconName;
        } else {
          // 内置图标
          setIcon(iconPreview.value, iconName);
        }
      }
    } else {
      logger.debug('user cancelled icon selection');
    }
  } catch (error) {
    logger.error('icon selector error:', error);
  }
};
</script>

<style scoped>
.selector-demo {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.button-group {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.selector-button {
  padding: 10px 20px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.selector-button:hover {
  background-color: #005999;
}

.result-display {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
  border-left: 4px solid #007acc;
}

.result-display h3 {
  margin-top: 0;
  color: #333;
}

.result-display p {
  margin: 5px 0;
  color: #666;
}

.selector-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 8px 0;
}

.icon-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  text-align: center;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-preview svg {
  width: 24px;
  height: 24px;
}
</style>
