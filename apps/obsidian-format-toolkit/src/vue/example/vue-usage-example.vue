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
      <p><strong>命令ID:</strong> {{ selectedCommand.commandId }}</p>
      <p><strong>命令名称:</strong> {{ selectedCommand.name }}</p>
    </div>

    <div v-if="selectedIcon" class="result-display">
      <h3>选择的图标:</h3>
      <p><strong>图标名称:</strong> {{ selectedIcon }}</p>
      <div class="icon-preview" ref="iconPreview"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, nextTick } from 'vue';
import { App, setIcon } from 'obsidian';
import { openCommandSelector, CommandSelectResult } from './commandSelector';
import { openIconSelector } from './iconSelector';
import type { DocWeaverInstance } from '../../main';

// 通过inject获取Obsidian App实例
// 需要在Vue应用启动时提供这个实例
const app = inject<DocWeaverInstance>('docWeaverInstance')?.app

// 响应式数据
const selectedCommand = ref<CommandSelectResult | null>(null);
const selectedIcon = ref<string | null>(null);
const iconPreview = ref<HTMLElement | null>(null);

/**
 * 处理命令选择
 */
const handleSelectCommand = async () => {
  if (!app) {
    console.error('Obsidian app 实例未找到');
    return;
  }

  try {
    const result = await openCommandSelector(app);
    if (result) {
      selectedCommand.value = result;
      console.log('选择的命令:', result);
    } else {
      console.log('用户取消了命令选择');
    }
  } catch (error) {
    console.error('命令选择出错:', error);
  }
};

/**
 * 处理图标选择
 */
const handleSelectIcon = async () => {
  if (!app) {
    console.error('Obsidian app 实例未找到');
    return;
  }

  try {
    const iconName = await openIconSelector(app);
    if (iconName) {
      selectedIcon.value = iconName;
      console.log('选择的图标:', iconName);
      
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
      console.log('用户取消了图标选择');
    }
  } catch (error) {
    console.error('图标选择出错:', error);
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
