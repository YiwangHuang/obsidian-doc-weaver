# Vue组件测试指南

## 测试环境设置

### 1. 构建项目
```bash
pnpm run build
```

### 2. 在Obsidian中测试

#### 方法一：直接在当前插件目录测试
1. 确保你的Obsidian库已经加载了这个插件
2. 构建完成后，插件会自动更新
3. 重启Obsidian或重新加载插件

#### 方法二：复制到标准插件目录测试
```bash
# 复制插件到标准Obsidian插件目录
cp -r ../../ ~/.obsidian/plugins/obsidian-format-toolkit-test/
```

### 3. 测试步骤

#### 启用Vue模式测试
1. 打开Obsidian
2. 进入设置 → 社区插件 → obsidian-doc-weaver
3. 你应该看到Vue设置面板而不是原来的原生界面

#### 预期结果
- ✅ 看到标题"Vue Settings Panel"
- ✅ 看到标签页按钮（exportFormats、tagWrapper）
- ✅ 点击标签页可以切换
- ✅ 显示占位符内容，包含当前活跃标签页信息
- ✅ 如果有设置变更，会显示"Saving..."状态

#### 如果需要切换回原生模式
修改 `src/main.ts` 中的测试开关：
```typescript
private readonly useVueMode: boolean = false; // 改为false
```
然后重新构建。

## 验证要点

### 功能验证
- [ ] Vue组件正确渲染
- [ ] 标签页切换功能正常
- [ ] 保存状态显示正常
- [ ] 错误处理机制正常
- [ ] Obsidian主题样式应用正确

### 技术验证
- [ ] 构建无错误
- [ ] TypeScript类型检查通过
- [ ] Vue组件挂载/卸载正常
- [ ] 内存无泄漏（打开/关闭设置面板多次）

### 样式验证
- [ ] 与Obsidian主题颜色一致
- [ ] 响应式布局正常
- [ ] 暗色/亮色主题切换正常
- [ ] 按钮交互状态正常

## 调试技巧

### 1. 浏览器开发者工具
- 打开Obsidian后按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (Mac)
- 在Console中查看Vue组件的错误信息
- 在Elements中检查Vue组件的DOM结构

### 2. Vue Devtools
如果需要深度调试Vue组件：
1. 安装Vue Devtools浏览器扩展
2. 在构建配置中启用开发模式
3. 重新构建和加载插件

### 3. 日志调试
在Vue组件中添加console.log：
```typescript
// 在SettingsApp.vue的script部分
console.log('Vue component mounted', props);
console.log('Settings state:', settings);
```

## 常见问题

### Q: 看不到Vue组件界面
A: 检查以下几点
1. 确保`useVueMode`设置为`true`
2. 构建是否成功
3. 浏览器控制台是否有错误信息

### Q: 设置保存不生效
A: 当前是测试阶段，设置保存机制已实现但需要验证

### Q: 样式显示异常
A: 检查Obsidian CSS变量是否正确应用，可能需要调整CSS样式

### Q: 插件加载失败
A: 检查manifest.json是否正确复制，版本号是否匹配

## 性能测试

### 包大小对比
- 原生版本: ~474 kB
- Vue版本: ~573 kB  
- 增加约: ~99 kB (Vue运行时)

### 加载时间测试
记录以下时间：
- 插件加载时间
- 设置面板打开时间
- 标签页切换响应时间

## 下一步测试计划

当基础功能验证通过后，将进行：
1. 第二阶段Vue基础组件测试
2. 具体设置模块的Vue化测试
3. 复杂交互和性能优化测试 