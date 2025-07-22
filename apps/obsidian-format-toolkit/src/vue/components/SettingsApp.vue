<!--
  Vue设置应用根组件 (简化版)
-->
<template>
  <div>
    <h1 class="mt-0 pt-0">Doc Weaver</h1>
    <!-- TODO: 使用CSS变量来设置颜色 -->
      <v-tabs 
        v-model="activeTab" 
        density="compact"
      >
        <v-tab
          v-for="tab in allTabs"
          :key="tab.name"
          :value="tab.name"
        >
          {{ tab.settingTabName }}
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">
        <v-tabs-window-item 
          v-for="tab in allTabs" 
          :key="tab.name" 
          :value="tab.name"
        >
          <v-container fluid class="pa-2">
            <component 
              v-if="tab.component"
              :is="tab.component"
              :plugin="plugin"
            />
            <div v-else class="text-center pa-8">
              <h3>{{ tab.name }}</h3>
              <p>No component found for this tab</p>
            </div>
          </v-container>
        </v-tabs-window-item>
      </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SettingsRegistry } from '../../main';
import type { SettingsAppProps } from '../types';
import DemoModalComponent from './DemoModalComponent.vue';
import { DEBUG, debugLog } from '../../lib/testUtils';

const props = defineProps<SettingsAppProps>();

const demoTab: SettingsRegistry = {
  name: 'modalDemo',
  settingTabName: 'Demo',
  description: 'Vue弹窗组件演示',
  defaultConfigs: {},
  component: DemoModalComponent
};

const allTabs = computed(() => [
  ...props.moduleSettings,
  ...(DEBUG ? [demoTab] : [])
]);

const activeTab = ref(allTabs.value[0]?.name || 'tagWrapper');

</script> 

<!-- <style scoped>   -->
<style>
.v-btn {
  /* background-color: var(--interactive-accent) !important; */
}

.v-btn:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
  color: var(--text-accent) !important;
}
</style>