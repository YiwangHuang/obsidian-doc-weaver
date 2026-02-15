<!--
  DemoModalComponent
  演示 Navigation Drawer（rail + expand-on-hover）设置面板布局。
  
  结构严格遵循 Vuetify 官方示例：v-card > v-layout > v-navigation-drawer + v-main。
  rail 模式下 Vuetify 会自动通过 overflow:hidden 裁剪文字，只保留 prepend 区域图标。
  悬浮展开后文字自动恢复显示。
-->
<template>
  <v-card flat class="demo-shell">
    <v-layout>
      <!-- 左侧抽屉导航：rail + expand-on-hover + permanent -->
      <v-navigation-drawer
        expand-on-hover
        permanent
        rail
      >
        <!-- 抽屉头部 -->
        <v-list>
          <v-list-item
            title="设置分组"
            subtitle="Export Formats"
          >
            <template #prepend>
              <Icon name="layout-dashboard" class="nav-icon mx-2" />
            </template>
          </v-list-item>
        </v-list>

        <v-divider />

        <!-- 分组导航列表：使用 title/subtitle props，rail 模式自动裁剪文字。 -->
        <v-list nav density="compact">
          <v-list-item
            v-for="section in sections"
            :key="section.id"
            :title="section.title"
            :subtitle="section.desc"
            :active="activeSectionId === section.id"
            :value="section.id"
            @click="activeSectionId = section.id"
          >
            <template #prepend>
              <Icon :name="section.icon" class="nav-icon me-5" />
            </template>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- 右侧设置区：宽度不随抽屉展开/收起变化（expand-on-hover 的默认行为）。 -->
      <v-main>
        <v-container fluid class="pa-4">
          <!-- 当前分组标题 -->
          <div class="d-flex align-center mb-4">
            <Icon :name="activeSection.icon" class="nav-icon me-2" />
            <div class="text-h6">{{ activeSection.title }}</div>
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">{{ activeSection.desc }}</div>

          <!-- 模拟设置表单 -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="demoForm.outputDir"
                label="输出目录模板"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="demoForm.fileName"
                label="输出文件名模板"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-switch
                v-model="demoForm.processVideo"
                color="primary"
                density="compact"
                hide-details
                label="启用媒体附件处理"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                :items="['png', 'svg', 'both']"
                model-value="png"
                label="Excalidraw 导出类型"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="demoForm.templateContent"
            label="内容模板"
            variant="outlined"
            rows="5"
            density="compact"
            class="mt-4"
          />

          <!-- 当前分组字段标签 -->
          <div class="text-caption text-medium-emphasis mt-4 mb-2">当前分组典型字段</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="field in activeSection.fields"
              :key="field"
              size="small"
              variant="tonal"
            >
              {{ field }}
            </v-chip>
          </div>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
/**
 * DemoModalComponent
 * 演示 Navigation Drawer（rail + expand-on-hover）替代 v-expansion-panels 的设置面板布局。
 * 使用项目自有 Icon.vue 组件代替 Vuetify 内置图标。
 */
import { computed, reactive, ref } from 'vue';
import Icon from './Icon.vue';

// 设置分组元数据：模拟 Export Formats 中不同配置区域。
const sections = [
  { id: 'output',     title: '输出路径设置', desc: '管理输出目录和输出文件名模板',   icon: 'folder',    fields: ['输出目录', '输出文件名', '路径预览'] },
  { id: 'attachment', title: '附件设置',     desc: '控制图片和媒体附件导出方式',     icon: 'paperclip', fields: ['图片目录', '图片引用模板', '媒体附件目录'] },
  { id: 'template',  title: '内容模板',     desc: '编辑导出的主体模板内容',         icon: 'file-text', fields: ['模板正文', '占位符', '格式预览'] },
  { id: 'advanced',  title: '高级设置',     desc: '处理 Excalidraw 等高级导出选项', icon: 'settings',  fields: ['导出类型', 'PNG 缩放比例', '兼容性选项'] },
];

// 当前激活分组 ID。
const activeSectionId = ref('output');

// 当前激活分组对象：联动右侧标题与字段展示。
const activeSection = computed(() =>
  sections.find((s) => s.id === activeSectionId.value) || sections[0]
);

// 模拟表单数据：用于演示真实设置项的输入行为。
const demoForm = reactive({
  outputDir: '/exports/{{note.title}}',
  fileName: '{{note.title}}',
  processVideo: true,
  templateContent: '# {{note.title}}\n\n{{note.content}}',
});
</script>

<style scoped>
/* 演示外壳：给定最小高度以便观察布局效果。 */
.demo-shell {
  min-height: 520px;
}

/* 统一导航图标尺寸。 */
.nav-icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
