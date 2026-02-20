# Obsidian 命令选择器和图标选择器使用说明

本文档说明如何在Vue项目中使用从Obsidian Editing Toolbar项目提取的命令选择器和图标选择器。

## 🎯 功能特点

### 命令选择器 (`commandSelector.ts`)
- ✅ 继承 `FuzzySuggestModal<Command>`，保持原版实现
- ✅ 支持模糊搜索所有Obsidian命令
- ✅ 返回 `commandId` 和 `name`
- ✅ Promise-based API，易于集成

### 图标选择器 (`iconSelector.ts`)
- ✅ 继承 `FuzzySuggestModal<string>`，保持原版实现
- ✅ 支持模糊搜索1000+内置图标
- ✅ 支持自定义SVG图标输入
- ✅ 图标预览功能
- ✅ 返回图标名称或SVG代码

## 📁 文件结构

```
├── commandSelector.ts     # 命令选择器实现
├── iconSelector.ts        # 图标选择器实现
├── vue-usage-example.vue  # Vue使用示例
└── README-选择器使用说明.md # 本文档
```

## 🚀 快速开始

### 1. 在Vue应用中提供Obsidian App实例

```typescript
// main.ts 或 setup 文件中
import { createApp } from 'vue';
import { App } from 'obsidian';

const app = createApp(YourComponent);

// 假设你已经获得了Obsidian的app实例
const obsidianApp: App = getObsidianAppInstance();

// 提供给所有子组件
app.provide('obsidian-app', obsidianApp);
```

### 2. 在Vue组件中使用

```vue
<template>
  <div>
    <button @click="selectCommand">选择命令</button>
    <button @click="selectIcon">选择图标</button>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { App } from 'obsidian';
import { openCommandSelector } from './commandSelector';
import { openIconSelector } from './iconSelector';

const app = inject<App>('obsidian-app');

const selectCommand = async () => {
  const result = await openCommandSelector(app!);
  if (result) {
    console.log('命令ID:', result.commandId);
    console.log('命令名称:', result.name);
  }
};

const selectIcon = async () => {
  const iconName = await openIconSelector(app!);
  if (iconName) {
    console.log('图标名称:', iconName);
  }
};
</script>
```

## 📝 API 详细说明

### 命令选择器

#### `openCommandSelector(app: App): Promise<CommandSelectResult | null>`

**参数:**
- `app`: Obsidian App 实例

**返回值:**
```typescript
interface CommandSelectResult {
  commandId: string;  // 命令的唯一标识符
  name: string;       // 命令的显示名称
}
```

**示例:**
```typescript
const result = await openCommandSelector(app);
// result: { commandId: "editor:toggle-bold", name: "切换粗体" }
```

### 图标选择器

#### `openIconSelector(app: App): Promise<string | null>`

**参数:**
- `app`: Obsidian App 实例

**返回值:**
- `string`: 图标名称（内置图标）或SVG代码（自定义图标）
- `null`: 用户取消选择

**示例:**
```typescript
const iconName = await openIconSelector(app);
// 内置图标: "star"
// 自定义图标: "<svg>...</svg>"
```

## 🎨 图标使用

选择图标后，可以使用Obsidian的`setIcon`函数渲染：

```typescript
import { setIcon } from 'obsidian';

const renderIcon = (iconName: string, element: HTMLElement) => {
  if (iconName.startsWith('<svg')) {
    // 自定义SVG图标
    element.innerHTML = iconName;
  } else {
    // 内置图标
    setIcon(element, iconName);
  }
};
```

## 🔧 高级用法

### 错误处理

```typescript
const selectCommandSafely = async () => {
  try {
    const result = await openCommandSelector(app);
    if (result) {
      // 处理选择结果
      handleCommand(result);
    } else {
      // 用户取消了选择
      console.log('用户取消选择');
    }
  } catch (error) {
    console.error('命令选择失败:', error);
  }
};
```

### 预设图标过滤

如果需要限制可选图标，可以修改`iconSelector.ts`中的`appIcons`数组：

```typescript
// 只显示常用图标
const commonIcons = [
  "star", "heart", "home", "settings", "search", 
  "plus", "minus", "edit", "trash", "save"
];
```

### 组合使用

```typescript
const createToolbarItem = async () => {
  // 先选择命令
  const command = await openCommandSelector(app);
  if (!command) return;
  
  // 再选择图标
  const icon = await openIconSelector(app);
  if (!icon) return;
  
  // 创建工具栏项
  const toolbarItem = {
    commandId: command.commandId,
    name: command.name,
    icon: icon
  };
  
  console.log('创建的工具栏项:', toolbarItem);
};
```

## 📋 完整示例

参考 `vue-usage-example.vue` 文件，它展示了：

1. ✅ 如何在Vue组件中inject Obsidian app实例
2. ✅ 如何调用两个选择器
3. ✅ 如何处理选择结果
4. ✅ 如何显示图标预览
5. ✅ 错误处理和用户体验优化

## 🔍 技术实现细节

### 继承关系
```
CommandPickerModal extends FuzzySuggestModal<Command>
IconPickerModal extends FuzzySuggestModal<string>
CustomIconModal extends Modal
```

### 关键特性
1. **模糊搜索**: 继承`FuzzySuggestModal`获得强大的搜索能力
2. **图标预览**: 使用`setIcon`和`renderSuggestion`实现实时预览
3. **Promise包装**: 将模态框操作包装成Promise，便于异步调用
4. **类型安全**: 完整的TypeScript类型定义

### 与原项目的兼容性
- ✅ 保持所有原版UI和交互逻辑
- ✅ 复用原版图标数组和格式化函数
- ✅ 支持所有原版功能（包括自定义SVG）
- ✅ 保持原版的样式类名

## 🚨 注意事项

1. **App实例**: 必须确保Obsidian App实例正确传递给选择器
2. **异步处理**: 所有选择器都是异步的，需要使用await
3. **取消处理**: 用户可能取消选择，需要处理null返回值
4. **样式依赖**: 确保Obsidian的CSS样式可用
5. **图标渲染**: 自定义SVG和内置图标的渲染方式不同

## 📚 扩展建议

1. **缓存优化**: 缓存命令列表提高性能
2. **分类过滤**: 为图标添加分类标签
3. **快捷键**: 添加键盘快捷键支持
4. **历史记录**: 记住最近选择的命令和图标
5. **主题适配**: 适配不同的Obsidian主题
