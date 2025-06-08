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

## 其他注意事项

*此处可继续添加其他开发相关的重要注意事项...* 