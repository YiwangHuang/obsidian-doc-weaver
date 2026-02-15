<!--
  RailSidebar - 模拟 Vuetify Navigation Drawer 的 rail + expand-on-hover 行为。

  适用于 Obsidian 弹窗等无法使用 v-navigation-drawer 的场景
  （因 Teleport/DOM 移动会导致 drawer 脱离弹窗容器）。

  Props:
  - sections: 分组列表，每项需包含 { id, icon, title }
  - modelValue: 当前激活分组 ID（支持 v-model）

  Slots:
  - default: 右侧内容区，通过 v-model 获取当前激活分组 ID 来条件渲染
-->
<template>
  <div class="rail-sidebar-layout">
    <!-- 左侧导航：收起仅图标，hover 覆盖展开显示文字 -->
    <div class="rail-sidebar-nav">
      <v-list nav density="compact" class="py-2">
        <v-list-item
          v-for="section in sections"
          :key="section.id"
          :active="modelValue === section.id"
          :value="section.id"
          @click="$emit('update:modelValue', section.id)"
        >
          <template #prepend>
            <Icon :name="section.icon" class="rail-sidebar-icon" />
          </template>
          <v-list-item-title class="rail-sidebar-text">{{ section.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>

    <!-- 右侧内容区：通过默认插槽由父组件填充 -->
    <div class="rail-sidebar-content pa-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';

/** 分组项接口 */
interface SidebarSection {
  id: string;
  icon: string;
  title: string;
}

defineProps<{
  /** 分组列表 */
  sections: SidebarSection[];
  /** 当前激活分组 ID */
  modelValue: string;
}>();

defineEmits<{
  (e: 'update:modelValue', id: string): void;
}>();
</script>

<style scoped>
/* 整体布局：横向 flex。 */
.rail-sidebar-layout {
  display: flex;
  min-height: 360px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

/* 左侧导航槽位：固定 56px，为绝对定位的列表提供定位上下文。 */
.rail-sidebar-nav {
  position: relative;
  width: 56px;
  min-width: 56px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  z-index: 2;
}

/* 导航列表：绝对定位，hover 时覆盖展开，不挤压右侧。 */
.rail-sidebar-nav > .v-list {
  position: absolute;
  inset: 0 auto 0 0;
  width: 56px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  transition: width 0.2s ease;
}
.rail-sidebar-nav:hover > .v-list {
  width: max-content;  /* 根据文字内容自适应宽度 */
  min-width: 56px;     /* 不小于收起宽度 */
  overflow: visible;   /* 展开时取消裁剪 */
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

/* 展开时确保列表项及标题不截断文字 */
.rail-sidebar-nav:hover .v-list-item {
  overflow: visible;
}
.rail-sidebar-nav:hover :deep(.v-list-item-title) {
  overflow: visible;
  text-overflow: unset;
}

/* 导航文字：收起时隐藏，展开时渐显。 */
.rail-sidebar-text {
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}
.rail-sidebar-nav:hover .rail-sidebar-text {
  opacity: 1;
}

/* 右侧内容区：自适应剩余宽度。 */
.rail-sidebar-content {
  flex: 1;
  min-width: 0;
}

/* 导航图标：统一尺寸，增加右侧间距与文字拉开距离。 */
.rail-sidebar-icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
}
</style>
