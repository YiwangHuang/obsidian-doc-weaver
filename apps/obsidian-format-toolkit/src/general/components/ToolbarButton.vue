<template>
  <!-- 有子菜单的按钮 -->
  <SubMenu
    v-if="hasChildren"
    :items="children || []"
    @item-click="handleSubItemClick"
  >
    <template #activator="{ props: menuProps }">
      <!-- 带图标的菜单触发按钮 -->
      <div v-if="icon">
        <v-tooltip :text="name" location="top" :open-delay="500">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="{ ...tooltipProps, ...menuProps }"
              :class="[...buttonClasses, 'has-submenu']"
            >
              <Icon :name="icon" />
              <Icon name="chevron-right" class="submenu-indicator" />
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
          <span class="button-text">{{ name }}</span>
          <Icon name="chevron-right" class="submenu-indicator" />
        </v-btn>
      </div>
    </template>
  </SubMenu>

  <!-- 普通按钮（无子菜单） -->
  <template v-else>
    <!-- 带图标的按钮 -->
    <div v-if="icon">
      <v-tooltip :text="name" location="top" :open-delay="500">
        <template #activator="{ props }"> 
          <v-btn
            v-bind="props"
            :class="buttonClasses"
            @click="handleClick"
          >
            <Icon :name="icon" />
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
        <span class="button-text">{{ name }}</span>
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

import { computed } from 'vue';
import Icon from '../../vue/components/Icon.vue';
import SubMenu from './SubMenu.vue';
import type { ToolbarItem } from '../types';

// 组件属性定义
interface Props {
  id: string;
  name: string;
  icon?: string;
  children?: ToolbarItem[];
  enabled?: boolean;
  action?: () => void;
  index?: number;
  isSecondRow?: boolean;
  isInSubmenu?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  index: 0,
  isSecondRow: false,
  isInSubmenu: false
});

// 组件事件
const emit = defineEmits<{
  click: [id: string];
}>();

/**
 * 是否有子菜单
 */
const hasChildren = computed(() => {
  return props.children && props.children.length > 0;
});

/**
 * 按钮CSS类名
 */
const buttonClasses = computed(() => {
  const classes = ['editing-toolbar-command-item'];

  if (props.icon) {
    classes.push('icon-btn-square');
  }

  if (props.isSecondRow) {
    classes.push('editing-toolbar-second');
  }

  if (props.isInSubmenu) {
    classes.push('submenu-item');
  }
  
  return classes;
});

/**
 * 处理按钮点击（叶子节点）
 */
const handleClick = () => {
  if (props.action) {
    props.action();
  } else {
    emit('click', props.id);
  }
};

/**
 * 处理子菜单项点击
 */
const handleSubItemClick = (id: string) => {
  emit('click', id);
};
</script>

<style scoped>

/* 按钮文本样式 */
.button-text {
  font-size: 12px;
  color: var(--text-normal);
}

/* 子菜单指示器样式 */
.submenu-indicator {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

/* 有子菜单的按钮样式 */
.has-submenu {
  position: relative;
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