<template>
  <!-- 展开显示模式（横排）：直接递归渲染所有子项为同级按钮 -->
  <div v-if="item.unfolded && hasChildren && item.enabled" class="children-horizontal">
    <!-- 使用 v-for 将 children 中的每个子项传递给自身（ToolbarButton），实现递归渲染 -->
    <ToolbarButton
      v-for="(child, index) in item.children || []"
      :key="`${child.commandId || child.name}-${index}-${child.children?.length || 0}`"
      :item="child"
      :isInSubmenu="isInSubmenu"
    />
  </div>
  <!-- 有子菜单且启用的按钮 -->
  <SubMenu
    v-else-if="hasChildren && item.enabled"
    :items="item.children || []"
    @item-click="handleSubItemClick"
  >
    <template #activator="{ props: menuProps }">
      <!-- 带图标的菜单触发按钮 -->
      <div v-if="item.icon">
        <v-tooltip :text="item.name" location="top" :open-delay="200">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="{ ...tooltipProps, ...menuProps }"
              :class="[...buttonClasses, 'has-submenu']"
            >
              <Icon :name="item.icon" />
              <!-- 子菜单指示器：右下角的向下三角形 -->
              <div class="submenu-indicator">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
      <!-- 纯文本的菜单触发按钮 -->
      <div v-else>
        <v-btn
          v-bind="menuProps"
          :class="[...buttonClasses, 'has-submenu']"
        >
          <span class="button-text">{{ item.name }}</span>
          <!-- 子菜单指示器：右下角的向下三角形 -->
          <div class="submenu-indicator">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </v-btn>
      </div>
    </template>
  </SubMenu>

  <!-- 普通按钮（无子菜单且启用） -->
  <template v-else-if="item.enabled">
    <!-- 带图标的按钮 -->
    <div v-if="item.icon">
      <v-tooltip :text="item.name" location="top" :open-delay="500">
        <template #activator="{ props }"> 
          <v-btn
            v-bind="props"
            :class="buttonClasses"
            @click="handleClick"
          >
            <Icon :name="item.icon" />
          </v-btn>
        </template>
      </v-tooltip>
    </div>
    <!-- 纯文本按钮 -->
    <div v-else>
      <v-btn
        :class="buttonClasses"
        @click="handleClick"
      >
        <span class="button-text">{{ item.name }}</span>
      </v-btn>
    </div>
  </template>
</template>

<script setup lang="ts">
/**
 * ToolbarButton 工具栏按钮组件
 * 复现原版 Obsidian Editing Toolbar 的按钮样式和行为
 * 支持递归渲染子菜单
 */

import { computed, inject } from 'vue';
import Icon from '../../vue/components/Icon.vue';
import SubMenu from './SubMenu.vue';
import type { ToolbarItemConfig } from '../types';
import { debugLog } from '../../lib/debugUtils';
import type { DocWeaverInstance } from '../../main';

// 组件属性定义
interface Props {
  /** 单个工具栏条目 */
  item: ToolbarItemConfig;
  /** 是否位于子菜单中，仅影响样式 */
  isInSubmenu?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isInSubmenu: false
});

// 注入工具栏上下文
const toolbarContext = inject<DocWeaverInstance>('docWeaverInstance');

/**
 * 是否有子菜单
 */
const hasChildren = computed(() => props.item.children && props.item.children.length > 0);

/**
 * 按钮CSS类名
 */
const buttonClasses = computed(() => {
  const classes = ['editing-toolbar-command-item'];
  if (props.item.icon) classes.push('icon-btn-square');
  if (props.isInSubmenu) classes.push('submenu-item');
  return classes;
});

/**
 * 执行工具栏命令
 * @param commandId 命令ID
 */
const executeCommand = (commandId: string): void => {
  debugLog('Executing toolbar command:', commandId);
  try {
    // 执行 Obsidian 内置命令, 该命令不被包含在 Obsidian 的类型定义中, 使用 @ts-ignore 忽略类型检查
    // @ts-ignore
    const isSuccess = toolbarContext.plugin.app.commands.executeCommandById(commandId);
    if (!isSuccess) {
      console.error('Failed to execute command:', commandId);
    } else {
      debugLog('Command executed successfully:', commandId);
    }
  } catch (error) {
    console.error('Error executing command:', commandId, error);
  }
};

/**
 * 处理按钮点击，执行命令
 */
const handleClick = () => {
  const id = props.item.commandId;
  if (typeof id === 'string' && id.trim().length > 0) {
    executeCommand(id);
  } else {
    console.warn('无法执行命令：', {
      hasId: !!id,
      hasContext: !!toolbarContext,
      buttonName: props.item.name
    });
  }
};

/**
 * 处理子菜单项点击
 */
const handleSubItemClick = (id: string) => {
  // 子菜单项点击不再发射事件，交由子项目自己处理
};
</script>

<style scoped>
/* 子级容器（横排）：让子按钮与父级同一行参与布局 */
.children-horizontal { display: contents; }

/* 子级容器（竖排）：提供竖排布局的可选类 */
.children-vertical {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

/* 按钮文本样式 */
.button-text {
  font-size: 12px;
  color: var(--text-normal);
}

/* 有子菜单的按钮样式 */
.has-submenu {
  position: relative;
}

/**
 * 子菜单指示器样式：按钮右下角的向下三角形
 * 作用：提示用户此按钮有子菜单可以展开
 * 设计原则：
 * 1. 小巧不突兀，不干扰主按钮的视觉效果
 * 2. 位置固定在按钮右下角，便于用户识别
 * 3. 不影响按钮的点击交互
 */
.submenu-indicator {
  position: absolute;
  bottom: 2px;           /* 距离按钮底部8px，更靠近中心 */
  right: 2px;           /* 距离按钮右侧10px，更靠近中心 */
  width: 12px;            /* 指示器容器宽度，比之前更小 */
  height: 12px;           /* 指示器容器高度，比之前更小 */
  pointer-events: none;  /* 禁用鼠标事件，确保不阻止按钮点击 */
  z-index: 1;            /* 确保指示器显示在按钮内容之上 */
}

/**
 * 子菜单指示器SVG样式
 * 直接控制嵌入的SVG元素，避免Icon组件的样式干扰
 * 使用自定义SVG可以完全控制图标的大小和样式
 */
.submenu-indicator svg {
  width: 12px;                /* SVG宽度5px，非常小巧 */
  height: 12px;               /* SVG高度5px，非常小巧 */
  opacity: 1;              /* 透明度设为0.6，更加低调 */
  color: var(--text-normal);  /* 使用Obsidian主题的弱化文本颜色--text-muted */
  stroke: currentColor;      /* 确保路径使用当前文本颜色 */
}

/* 子菜单项样式 - 移除自定义样式，完全依赖全局 .editing-toolbar-command-item */

/* 移除Vuetify默认样式 */
:deep(.v-btn__content) {
  opacity: 1 !important;
}

:deep(.v-btn__overlay) {
  display: none !important;
}
</style>