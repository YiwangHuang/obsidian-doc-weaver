<template>
  <!-- 图标选择演示区域 -->
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <h3>图标选择演示</h3>
        <IconSelect v-model="selectedIcon" @change="onIconChange" />
        <p class="mt-2 text-caption">当前选中: {{ selectedIcon || '(无)' }}</p>
      </v-col>
    </v-row>
  </v-container>

  <v-divider class="my-4" />

  <!-- 原有的标签页内容 -->
  <v-tabs v-model="tab" align-tabs="end" color="deep-purple-accent-4">
    <v-tab :value="1">Landscape</v-tab>
    <v-tab :value="2">City</v-tab>
    <v-tab :value="3">Abstract</v-tab>
  </v-tabs>

  <v-tabs-window v-model="tab">
    <v-tabs-window-item v-for="n in 3" :key="n" :value="n">
      <v-container fluid>
        <v-row>
          <v-col v-for="i in 6" :key="i" cols="12" md="4">
            <v-img
              :lazy-src="`https://picsum.photos/10/6?image=${i * n * 5 + 10}`"
              :src="`https://picsum.photos/500/300?image=${i * n * 5 + 10}`"
              height="205"
              cover
            ></v-img>
          </v-col>
        </v-row>
      </v-container>
    </v-tabs-window-item>
  </v-tabs-window>

</template>

<script setup>
/**
 * DemoModalComponent 演示组件
 * 简化版本，专注于展示图标选择组件的基本功能
 */

import { ref } from 'vue';
import IconSelect from './IconSelect.vue';

// 原有的标签页状态
const tab = ref(null);

// 图标选择相关状态
const selectedIcon = ref('');

/**
 * 处理图标选择变化
 */
const onIconChange = (value) => {
  console.log('图标选择变化:', value);
};
</script>
