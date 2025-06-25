<!--
  简化演示组件
  
  功能说明：
  - 简单的响应式输入框演示
  - 边框样式展示
  - 色块渲染显示
  - 实时预览效果
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (MyPlugin) 必需
-->
<template>
  <div class="demo-container">
    <div class="demo-header">
      <h3>简化演示组件</h3>
      <p class="demo-description">
        演示响应式输入、边框样式和色块渲染效果。
      </p>
    </div>

    <!-- 基础输入演示 -->
    <ConfigurationItem
      title="基础输入演示"
      description="输入文字查看实时更新效果"
    >
      <template #control>
        <div class="demo-status">
          <span class="current-text">当前: {{ inputText || '(空)' }}</span>
        </div>
      </template>
      
      <template #details>
        <div class="demo-form">
          <div class="form-group">
            <label>输入框：</label>
            <TextInput
              v-model="inputText"
              placeholder="输入文字查看效果..."
            />
          </div>
          
          <div class="preview-section">
            <h4>实时预览</h4>
            <div class="preview-box">
              <p><strong>内容：</strong>"{{ inputText }}"</p>
              <p><strong>长度：</strong>{{ inputText.length }}</p>
              <p><strong>更新：</strong>{{ lastUpdate }}</p>
            </div>
          </div>
        </div>
      </template>
    </ConfigurationItem>

    <!-- 边框样式演示 -->
    <ConfigurationItem
      title="边框样式演示"
      description="不同边框样式的展示效果"
    >
      <template #control>
        <div class="demo-status">
          <span class="current-text">样式: {{ selectedBorderStyle }}</span>
        </div>
      </template>
      
      <template #details>
        <div class="demo-form">
          <div class="form-group">
            <label>选择边框样式：</label>
            <Dropdown
              v-model="selectedBorderStyle"
              :options="borderOptions"
            />
          </div>
          
          <div class="border-showcase">
            <div 
              class="border-sample"
              :style="getBorderStyle(selectedBorderStyle, selectedColor)"
            >
              <p>{{ inputText || '示例文本内容' }}</p>
            </div>
          </div>
        </div>
      </template>
    </ConfigurationItem>

    <!-- 色块渲染演示 -->
    <ConfigurationItem
      title="色块渲染演示"
      description="颜色选择和色块显示效果"
    >
      <template #control>
        <div class="demo-status">
          <div class="color-preview" :style="{ backgroundColor: selectedColor }"></div>
          <span class="current-text">颜色: {{ selectedColor }}</span>
        </div>
      </template>
      
      <template #details>
        <div class="demo-form">
          <div class="form-group">
            <label>选择主题色：</label>
            <div class="color-palette">
              <div 
                v-for="color in colorOptions" 
                :key="color.value"
                class="color-option"
                :class="{ active: selectedColor === color.value }"
                :style="{ backgroundColor: color.value }"
                :title="color.label"
                @click="selectedColor = color.value"
              ></div>
            </div>
          </div>

          <div class="form-group">
            <label>自定义颜色：</label>
            <TextInput
              v-model="selectedColor"
              placeholder="#ffffff 或 rgb(255,255,255)"
            />
          </div>
          
          <div class="color-showcase">
            <div class="color-blocks">
              <div 
                class="color-block large"
                :style="{ backgroundColor: selectedColor }"
              >
                <span class="color-text">主色块</span>
              </div>
              <div 
                class="color-block medium"
                :style="{ backgroundColor: lightenColor(selectedColor, 20) }"
              >
                <span class="color-text">浅色</span>
              </div>
              <div 
                class="color-block medium"
                :style="{ backgroundColor: darkenColor(selectedColor, 20) }"
              >
                <span class="color-text">深色</span>
              </div>
              <div 
                class="color-block small"
                :style="{ backgroundColor: selectedColor, opacity: 0.7 }"
              >
                <span class="color-text">透明</span>
              </div>
              <div 
                class="color-block small gradient"
                :style="{ 
                  background: `linear-gradient(45deg, ${selectedColor}, ${lightenColor(selectedColor, 30)})` 
                }"
              >
                <span class="color-text">渐变</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ConfigurationItem>

    <!-- 固定边框样式展示 -->
    <ConfigurationItem
      title="固定边框样式展示"
      description="预设的边框样式组合，展示各种边框效果"
    >
      <template #control>
        <div class="demo-status">
          <span class="current-text">固定样式演示</span>
        </div>
      </template>
      
      <template #details>
        <div class="demo-form">
          <div class="fixed-borders-grid">
            <div 
              v-for="fixedBorder in fixedBorderExamples" 
              :key="fixedBorder.name"
              class="fixed-border-item"
              :style="fixedBorder.style"
            >
              <div class="border-info">
                <h4>{{ fixedBorder.name }}</h4>
                <p>{{ fixedBorder.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ConfigurationItem>

    <!-- 组合效果演示 -->
    <ConfigurationItemWithObsidianModal
      title="组合效果演示"
      description="在弹窗中展示边框和色块的组合效果"
      modal-title="组合效果演示"
      modal-button-text="打开预览"
      modal-button-tooltip="查看组合效果"
      :obsidian-app="plugin.app"
    >
      <template #control>
        <div class="demo-status">
          <div class="color-preview" :style="{ backgroundColor: selectedColor }"></div>
          <span class="current-text">{{ inputText || '默认文本' }} | {{ selectedBorderStyle }}</span>
        </div>
      </template>
      
      <template #details>
        <div class="combination-preview">
          <div 
            class="combo-box"
            :style="{ 
              ...getBorderStyle(selectedBorderStyle, selectedColor),
              backgroundColor: lightenColor(selectedColor, 40)
            }"
          >
            <p>{{ inputText || '这是一个组合效果的演示文本' }}</p>
          </div>
        </div>
      </template>

      <template #modal-content>
        <div class="modal-showcase">
          <div class="showcase-grid">
            <div 
              v-for="border in borderOptions.slice(1)" 
              :key="border.value"
              class="showcase-item"
              :style="{ 
                ...getBorderStyle(border.value as string, selectedColor),
                backgroundColor: lightenColor(selectedColor, 45)
              }"
            >
              <h4>{{ border.label }}</h4>
              <p>{{ inputText || '示例文本' }}</p>
            </div>
          </div>

          <div class="color-grid">
            <div 
              v-for="color in colorOptions" 
              :key="color.value"
              class="color-sample"
              :style="{ backgroundColor: color.value }"
            >
              <span class="color-label">{{ color.label }}</span>
            </div>
          </div>

          <div class="form-group">
            <Button
              variant="primary"
              size="small"
              @click="randomizeStyles"
            >
              随机样式
            </Button>
            <Button
              variant="secondary"
              size="small"
              @click="resetStyles"
            >
              重置样式
            </Button>
          </div>
        </div>
      </template>
    </ConfigurationItemWithObsidianModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type MyPlugin from '../../main';
import ConfigurationItem from './ConfigurationItem.vue';
import ConfigurationItemWithObsidianModal from './ConfigurationItemWithObsidianModal.vue';
import TextInput from './TextInput.vue';
import Dropdown from './Dropdown.vue';
import Button from './Button.vue';
import type { DropdownOption } from './Dropdown.vue';

// 组件属性接口定义
interface DemoModalProps {
  /** Obsidian插件实例，用于访问app等核心功能 */
  plugin: MyPlugin;
}

// 接收props
const props = defineProps<DemoModalProps>();

// 响应式数据
const inputText = ref('');
const lastUpdate = ref('');
const selectedBorderStyle = ref('solid');
const selectedColor = ref('#6366f1');

// 边框样式选项
const borderOptions: DropdownOption[] = [
  { value: 'none', label: '无边框' },
  { value: 'solid', label: '实线边框' },
  { value: 'dashed', label: '虚线边框' },
  { value: 'dotted', label: '点线边框' },
  { value: 'double', label: '双线边框' },
  { value: 'groove', label: '凹槽边框' },
  { value: 'ridge', label: '脊状边框' },
  { value: 'rounded', label: '圆角边框' }
];

// 颜色选项
const colorOptions = [
  { value: '#6366f1', label: '靛蓝' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#06b6d4', label: '青色' },
  { value: '#10b981', label: '绿色' },
  { value: '#f59e0b', label: '橙色' },
  { value: '#ef4444', label: '红色' },
  { value: '#6b7280', label: '灰色' },
  { value: '#1f2937', label: '深灰' }
];

// 固定边框样式示例
const fixedBorderExamples = [
  {
    name: '经典实线',
    description: '2px 蓝色实线边框',
    style: {
      border: '2px solid #2563eb',
      backgroundColor: '#eff6ff',
      color: '#1e40af'
    }
  },
  {
    name: '虚线提示',
    description: '1px 灰色虚线边框',
    style: {
      border: '1px dashed #6b7280',
      backgroundColor: '#f9fafb',
      color: '#374151'
    }
  },
  {
    name: '错误边框',
    description: '2px 红色实线边框',
    style: {
      border: '2px solid #dc2626',
      backgroundColor: '#fef2f2',
      color: '#991b1b'
    }
  },
  {
    name: '成功状态',
    description: '2px 绿色实线边框',
    style: {
      border: '2px solid #16a34a',
      backgroundColor: '#f0fdf4',
      color: '#166534'
    }
  },
  {
    name: '警告样式',
    description: '2px 橙色虚线边框',
    style: {
      border: '2px dashed #ea580c',
      backgroundColor: '#fff7ed',
      color: '#c2410c'
    }
  },
  {
    name: '双线边框',
    description: '4px 紫色双线边框',
    style: {
      border: '4px double #7c3aed',
      backgroundColor: '#faf5ff',
      color: '#6b21a8'
    }
  },
  {
    name: '圆角卡片',
    description: '1px 实线圆角边框',
    style: {
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      color: '#374151',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }
  },
  {
    name: '点线装饰',
    description: '3px 青色点线边框',
    style: {
      border: '3px dotted #0891b2',
      backgroundColor: '#ecfeff',
      color: '#0e7490'
    }
  },
  {
    name: '凹槽效果',
    description: '4px 深灰凹槽边框',
    style: {
      border: '4px groove #374151',
      backgroundColor: '#f3f4f6',
      color: '#1f2937'
    }
  },
  {
    name: '脊状边框',
    description: '4px 棕色脊状边框',
    style: {
      border: '4px ridge #92400e',
      backgroundColor: '#fef3c7',
      color: '#78350f'
    }
  },
  {
    name: '渐变边框',
    description: '3px 渐变色实线边框',
    style: {
      border: '3px solid',
      borderImage: 'linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6) 1',
      backgroundColor: '#fefbf7',
      color: '#7c2d12'
    }
  },
  {
    name: '阴影边框',
    description: '1px 边框配合阴影效果',
    style: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      color: '#111827',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
    }
  }
];

// 监听输入变化
watch(inputText, () => {
  lastUpdate.value = new Date().toLocaleTimeString();
});

// 颜色处理工具函数
const lightenColor = (color: string, percent: number): string => {
  if (color.startsWith('#')) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent / 100)));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + ((255 - ((num >> 8) & 0x00FF)) * percent / 100)));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + ((255 - (num & 0x0000FF)) * percent / 100)));
    const hexValue = ((r << 16) | (g << 8) | b);
    const hex = hexValue.toString(16);
    return `#${hex.padStart(6, '0')}`;
  }
  return color;
};

const darkenColor = (color: string, percent: number): string => {
  if (color.startsWith('#')) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)));
    const hexValue = ((r << 16) | (g << 8) | b);
    const hex = hexValue.toString(16);
    return `#${hex.padStart(6, '0')}`;
  }
  return color;
};

// 操作方法
const randomizeStyles = () => {
  const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
  const randomBorder = borderOptions[Math.floor(Math.random() * borderOptions.length)];
  selectedColor.value = randomColor.value;
  selectedBorderStyle.value = randomBorder.value as string;
  if (!inputText.value) {
    inputText.value = '随机生成的样式演示';
  }
};

const resetStyles = () => {
  selectedColor.value = '#6366f1';
  selectedBorderStyle.value = 'solid';
  inputText.value = '';
};

// 边框样式生成函数
const getBorderStyle = (borderType: string, color: string) => {
  const baseStyle = {
    color: color
  };
  
  switch (borderType) {
    case 'none':
      return { ...baseStyle, border: 'none' };
    case 'solid':
      return { ...baseStyle, border: `3px solid ${color}` };
    case 'dashed':
      return { ...baseStyle, border: `3px dashed ${color}` };
    case 'dotted':
      return { ...baseStyle, border: `3px dotted ${color}` };
    case 'double':
      return { ...baseStyle, border: `6px double ${color}` };
    case 'groove':
      return { ...baseStyle, border: `4px groove ${color}` };
    case 'ridge':
      return { ...baseStyle, border: `4px ridge ${color}` };
    case 'rounded':
      return { ...baseStyle, border: `3px solid ${color}`, borderRadius: '12px' };
    default:
      return { ...baseStyle, border: `3px solid ${color}` };
  }
};
</script>

<style scoped>
.demo-container {
  padding: 16px 0;
}

.demo-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--interactive-accent);
}

.demo-header h3 {
  margin: 0 0 8px 0;
  color: var(--text-normal);
  font-size: 18px;
  font-weight: 600;
}

.demo-description {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.demo-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-text {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--background-modifier-border);
  flex-shrink: 0;
}

.demo-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal);
}

.preview-section {
  margin-top: 16px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-normal);
  font-size: 14px;
  font-weight: 600;
}

.preview-box {
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 6px;
  border-left: 4px solid var(--interactive-accent);
}

.preview-box p {
  margin: 0 0 8px 0;
  color: var(--text-normal);
  font-size: 13px;
}

.preview-box p:last-child {
  margin-bottom: 0;
}

/* 边框样式 */
.border-showcase {
  margin-top: 16px;
}

.border-sample {
  padding: 20px;
  background: var(--background-primary);
  margin: 16px 0;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-sample p {
  margin: 0;
  color: var(--text-normal);
  font-weight: 500;
}

.border-sample.border-none { 
  border: none !important; 
}
.border-sample.border-solid { 
  border: 3px solid currentColor !important; 
}
.border-sample.border-dashed { 
  border: 3px dashed currentColor !important; 
}
.border-sample.border-dotted { 
  border: 3px dotted currentColor !important; 
}
.border-sample.border-double { 
  border: 6px double currentColor !important; 
}
.border-sample.border-groove { 
  border: 4px groove currentColor !important; 
}
.border-sample.border-ridge { 
  border: 4px ridge currentColor !important; 
}
.border-sample.border-rounded { 
  border: 3px solid currentColor !important; 
  border-radius: 12px; 
}

/* 色块样式 */
.color-palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: var(--text-muted);
}

.color-option.active {
  border-color: var(--text-normal);
  box-shadow: 0 0 0 2px var(--background-primary);
}

.color-showcase {
  margin-top: 16px;
}

.color-blocks {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.color-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.color-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-block.large {
  width: 80px;
  height: 80px;
}

.color-block.medium {
  width: 60px;
  height: 60px;
}

.color-block.small {
  width: 40px;
  height: 40px;
}

.color-text {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.color-block.small .color-text {
  font-size: 10px;
}

.gradient {
  position: relative;
  overflow: hidden;
}

.gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2));
}

/* 组合效果 */
.combination-preview {
  margin-top: 16px;
}

.combo-box {
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.combo-box p {
  margin: 0;
  color: var(--text-normal);
  font-weight: 500;
}

/* 弹窗展示 */
.modal-showcase {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.showcase-item {
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

/* 弹窗中的边框样式 */
.showcase-item.border-none { 
  border: none !important; 
}
.showcase-item.border-solid { 
  border: 3px solid currentColor !important; 
}
.showcase-item.border-dashed { 
  border: 3px dashed currentColor !important; 
}
.showcase-item.border-dotted { 
  border: 3px dotted currentColor !important; 
}
.showcase-item.border-double { 
  border: 6px double currentColor !important; 
}
.showcase-item.border-groove { 
  border: 4px groove currentColor !important; 
}
.showcase-item.border-ridge { 
  border: 4px ridge currentColor !important; 
}
.showcase-item.border-rounded { 
  border: 3px solid currentColor !important; 
  border-radius: 12px; 
}

/* 组合效果边框样式 */
.combo-box.border-none { 
  border: none !important; 
}
.combo-box.border-solid { 
  border: 3px solid currentColor !important; 
}
.combo-box.border-dashed { 
  border: 3px dashed currentColor !important; 
}
.combo-box.border-dotted { 
  border: 3px dotted currentColor !important; 
}
.combo-box.border-double { 
  border: 6px double currentColor !important; 
}
.combo-box.border-groove { 
  border: 4px groove currentColor !important; 
}
.combo-box.border-ridge { 
  border: 4px ridge currentColor !important; 
}
.combo-box.border-rounded { 
  border: 3px solid currentColor !important; 
  border-radius: 12px; 
}

.showcase-item h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--text-normal);
}

.showcase-item p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.color-sample {
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.color-label {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.form-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* 固定边框样式展示 */
.fixed-borders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.fixed-border-item {
  padding: 20px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.fixed-border-item:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.border-info {
  text-align: center;
}

.border-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.border-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
}
</style> 