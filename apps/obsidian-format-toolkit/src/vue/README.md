# Vue 设置面板

## 目录结构

```
src/vue/
├── components/                # Vue 组件
│   ├── SettingsApp.vue        # 设置应用根组件
│   ├── ObsidianVueModal.vue   # Obsidian 原生 Modal 的 Vue 适配器（Teleport 方式）
│   ├── RailSidebar.vue        # Rail 侧栏导航（模拟 Vuetify rail + expand-on-hover）
│   ├── PreviewPanel.vue       # 路径预览面板
│   ├── InputWithPlaceholders.vue  # 带占位符插入的输入组件
│   ├── IconSelectButton.vue   # 图标选择按钮
│   ├── Icon.vue               # 图标渲染组件
│   ├── DemoModalComponent.vue # 弹窗演示组件（DEBUG 模式）
│   └── ConfirmDialog.vue      # 确认对话框
├── plugins/
│   └── vuetify.ts             # Vuetify 插件配置
├── types/
│   └── index.ts               # Vue 组件相关类型
├── shared-styles.css          # 全局共享样式
└── README.md
```

## 技术架构

### 状态管理

使用 Vue 3 Composition API + 响应式系统：

- `reactive()` 管理设置状态
- `watch()` 深度监听设置变更，配合 `debounce`（500ms）自动保存
- 各功能模块通过 Manager 类注册设置并管理命令

### 与 Obsidian 集成

- 使用 Obsidian CSS 变量确保主题一致性
- 设置面板通过 `PluginSettingTab` 挂载 Vue 应用
- 弹窗使用 Obsidian 原生 `Modal` API + Vue `<Teleport>` 适配

## 样式覆盖机制

### 问题背景

Obsidian 内置样式对 `textarea`、`input` 等原生表单元素设置了 `border`：

```css
textarea, input[type='text'], input[type='search'], ... {
  border: var(--input-border-width) solid var(--background-modifier-border);
}
```

这会与 Vuetify 的 `v-text-field`、`v-textarea`、`v-select` 等组件产生冲突，
导致输入框出现多余的边框。

### 解决方案

使用 Vue `<style scoped>` + `:deep()` 进行覆盖：

```css
:deep(.v-text-field textarea),
:deep(.v-text-field input),
:deep(.v-textarea textarea),
:deep(.v-select input) {
  border: none !important;
}
```

#### 为什么必须用 `scoped` + `:deep()`

Vue 的 `<style scoped>` 会为选择器添加 `[data-v-xxxxx]` 属性选择器，
提升 CSS 优先级。仅靠 `!important` + 类选择器的全局 CSS 无法稳定覆盖
Obsidian 的内置样式（可能与 Obsidian 动态样式注入/刷新机制有关）。

#### 为什么需要在两个组件中分别声明

| 组件 | 覆盖范围 |
|------|----------|
| `SettingsApp.vue` | 设置页面中的 Vuetify 输入组件（正常 DOM 树） |
| `ObsidianVueModal.vue` | 弹窗中的 Vuetify 输入组件 |

`ObsidianVueModal` 使用 `<Teleport to="body">` 将弹窗内容移出了
`SettingsApp` 的 DOM 层级。`scoped` 样式依赖 `[data-v-xxx]` 后代选择器，
弹窗内容不再是 `SettingsApp` 的 DOM 后代，因此 `SettingsApp` 的覆盖规则
无法匹配到弹窗中的元素。需要在 `ObsidianVueModal` 中单独声明。

### 新增覆盖规则

如需覆盖其他 Obsidian 与 Vuetify 的样式冲突，请同时在以上两个组件中添加，
确保正常页面和弹窗内均生效。
