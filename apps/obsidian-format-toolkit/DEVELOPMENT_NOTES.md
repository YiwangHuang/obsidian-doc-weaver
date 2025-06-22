# 开发注意事项

## 依赖管理

### Typst 包跨平台兼容性

**重要提醒：** 如果项目中使用了 Typst 相关功能，请注意以下事项：

#### 问题描述
- Typst npm包使用平台特定的二进制包分发（如 `@typst-community/typst-darwin-arm64`、`@typst-community/typst-win32-x64` 等）
- npm会在安装时根据当前平台自动选择对应的包
- 如果只安装特定平台的包，会导致跨平台部署失败

#### 影响场景
- **Docker部署**: 本地Mac开发，但Docker容器基于Linux
- **CI/CD构建**: GitHub Actions等通常运行在Linux环境
- **用户分发**: 用户可能在Windows/Linux上安装应用
- **团队协作**: 团队成员使用不同操作系统

#### 推荐做法
```json
// ✅ 推荐：使用官方包，自动处理平台适配
{
  "dependencies": {
    "typst": "^0.10.0-8"
  }
}

// ❌ 避免：只指定特定平台的包
{
  "optionalDependencies": {
    "@typst-community/typst-darwin-arm64": "0.10.0-8"  // 仅Mac ARM64
  }
}
```

#### 验证方法
在不同平台或Docker环境中测试应用是否能正常运行，确保所有平台都能找到对应的Typst二进制文件。

---

## 设置面板Vue重构任务计划

### 当前设置系统分析

#### 现有架构概述
- **主要文件**: `src/main.ts` - 包含`AlternativeSettingTab`, `initSettingTab`, `SettingsRegistry`接口
- **设置模块**: 
  - `exportFormats/settings.ts` - 导出格式设置（复杂UI，包含折叠面板、动态表单）
  - `toggleTagWrapper/settings.ts` - 标签包装器设置（简单UI）
- **架构特点**:
  - 模块化设计，通过`SettingsRegistry`接口注册设置模块
  - 标签页切换系统（`.setting-tabs`, `.setting-tab-content`）
  - 基于Obsidian原生`Setting`组件构建UI
  - 每个设置变更都触发重新渲染整个面板

#### 当前存在的问题
1. **性能问题**: 每次设置变更都完整重新渲染DOM
2. **维护困难**: UI逻辑与业务逻辑耦合严重
3. **用户体验差**: 重新渲染导致UI状态丢失（如折叠状态）
4. **代码复杂**: 手动DOM操作，样式通过字符串注入
5. **类型安全**: 缺乏完整的类型检查和智能提示

### Vue重构任务计划

#### 第一阶段：基础设施搭建
- [ ] **依赖安装**
  - 安装Vue 3相关依赖：`vue`, `@vitejs/plugin-vue`
  - 安装类型支持：`@vue/typescript`
  - 更新vite配置支持Vue单文件组件
- [ ] **构建配置**
  - 修改`vite.config.ts`添加Vue插件支持
  - 配置Vue组件的TypeScript类型检查
  - 确保打包后仍为单文件输出（保持Obsidian插件兼容性）
- [ ] **类型定义**
  - 完善现有接口定义（`ExportConfig`, `TagConfig`等）
  - 创建Vue组件专用的Props类型定义
  - 创建设置状态管理的类型定义

#### 第二阶段：Vue基础组件开发
- [ ] **核心组件架构**
  - 创建`SettingsApp.vue` - 根组件
  - 创建`SettingsTabs.vue` - 标签页导航组件
  - 创建`SettingsPanel.vue` - 设置面板容器组件
- [ ] **通用UI组件**
  - `ToggleSwitch.vue` - 开关组件（基于Obsidian样式）
  - `TextInput.vue` - 文本输入框组件
  - `TextArea.vue` - 多行文本框组件
  - `Dropdown.vue` - 下拉选择组件
  - `Slider.vue` - 滑动条组件
  - `Button.vue` - 按钮组件
- [ ] **高级UI组件**
  - `CollapsibleSection.vue` - 可折叠区域组件
  - `ConfigurationItem.vue` - 配置项容器组件
  - `ActionButtons.vue` - 操作按钮组件

#### 第三阶段：设置模块Vue化
- [ ] **TagWrapper设置模块**
  - 创建`TagWrapperSettings.vue`
  - 实现标签配置列表的响应式更新
  - 保持与现有数据结构的兼容性
- [ ] **ExportFormats设置模块**
  - 创建`ExportFormatsSettings.vue`
  - 创建`FormatConfigItem.vue` - 单个格式配置组件
  - 实现复杂的动态表单逻辑
  - 实现条件显示逻辑（如PNG Scale的显示/隐藏）
- [ ] **设置状态管理**
  - 使用Vue的`ref`/`reactive`管理设置状态
  - 实现设置变更的防抖保存
  - 确保状态变更的响应式更新

#### 第四阶段：集成与兼容性
- [ ] **与Obsidian集成**
  - 修改`AlternativeSettingTab`类以支持Vue组件渲染
  - 保持`SettingsRegistry`接口的向后兼容
  - 确保Vue组件正确接收Obsidian的主题样式
- [ ] **数据层兼容**
  - 确保Vue组件能正确读取/保存现有设置格式
  - 实现设置迁移机制（如果需要格式变更）
  - 保持与`plugin.settingList`的完全兼容
- [ ] **样式系统**
  - 创建Vue专用的样式文件（`.vue`组件内的`<style scoped>`）
  - 移除现有的字符串注入样式系统
  - 确保与Obsidian主题的一致性

#### 第五阶段：优化与测试
- [ ] **性能优化**
  - 实现虚拟滚动（如果配置项很多）
  - 优化大量配置项的渲染性能
  - 实现设置变更的批量保存
- [ ] **用户体验提升**
  - 添加设置变更的视觉反馈
  - 实现设置项的搜索/过滤功能
  - 添加配置导入/导出功能
- [ ] **错误处理**
  - 添加完整的错误边界处理
  - 实现设置验证和错误提示
  - 添加设置重置功能
- [ ] **测试**
  - 单元测试Vue组件
  - 集成测试设置保存/加载
  - 跨主题兼容性测试

### 技术要点

#### Vue与Obsidian集成策略
```typescript
// 在AlternativeSettingTab中集成Vue
import { createApp } from 'vue'
import SettingsApp from './components/SettingsApp.vue'

class AlternativeSettingTab extends PluginSettingTab {
    private vueApp?: App
    
    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        
        // 创建Vue应用挂载点
        const mountPoint = containerEl.createDiv('vue-settings-container');
        
        // 创建Vue应用实例
        this.vueApp = createApp(SettingsApp, {
            plugin: this.plugin,
            moduleSettings: this.moduleSettings
        });
        
        // 挂载Vue应用
        this.vueApp.mount(mountPoint);
    }
    
    hide(): void {
        // 清理Vue应用
        if (this.vueApp) {
            this.vueApp.unmount();
            this.vueApp = undefined;
        }
    }
}
```

#### 状态管理设计
```typescript
// 使用Vue 3的Composition API管理状态
import { ref, reactive, watch } from 'vue'

export function useSettingsState(plugin: MyPlugin) {
    const settings = reactive(plugin.settingList)
    const saving = ref(false)
    
    // 防抖保存
    const saveSettings = debounce(async () => {
        saving.value = true
        try {
            await plugin.saveData(settings)
        } finally {
            saving.value = false
        }
    }, 500)
    
    // 监听设置变更
    watch(settings, saveSettings, { deep: true })
    
    return {
        settings,
        saving,
        saveSettings
    }
}
```

### 风险评估与备选方案

#### 主要风险
1. **构建复杂性**: Vue单文件组件可能增加构建配置复杂度
2. **包大小**: Vue运行时可能显著增加插件大小
3. **兼容性**: 与Obsidian主题系统的兼容性问题

#### 备选方案
1. **轻量级方案**: 仅使用Vue的响应式系统，不使用单文件组件
2. **渐进式迁移**: 先迁移简单的TagWrapper设置，后迁移复杂的ExportFormats设置
3. **原生优化**: 如果Vue方案过于复杂，考虑优化现有原生实现

---

## 其他注意事项

*此处可继续添加其他开发相关的重要注意事项...* 