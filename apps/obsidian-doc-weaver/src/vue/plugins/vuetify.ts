// import styleConfigs from 'src/exportFormats/textConvert/defaultStyleConfig/styleConfigs';
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const OBSIDIAN_PRIMARY_COLOR = 'var(--text-accent)';

// //TODO: 只导入部分Vuetify的组件和样式，减少包体积

// // 注入自定义样式
// if (typeof document !== 'undefined') {
//   const style = document.createElement('style');
//   style.textContent = `
//     /* 1. 移除Vuetify按钮的默认悬停效果 */
//     .v-btn .v-btn__overlay {
//       display: none !important;
//     }

//     /* 2. 添加简单的悬停效果 */
//     .v-btn:hover {
//       background-color: rgba(0, 0, 0, 0.04) !important;
//     }
//   `;
//   document.head.appendChild(style);
// }

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
  },
  defaults: {
    // 通过在 SettingsApp.vue 注入非scoped的样式来覆盖Vuetify的默认样式,实现更精细的样式控制
    // VBtn: { variant: 'elevated',},
    VCard: { variant: 'elevated' },
    VTabs: { sliderColor: OBSIDIAN_PRIMARY_COLOR},
    VSwitch: { color: OBSIDIAN_PRIMARY_COLOR, inset: true},
    VTextField: { variant: 'outlined', density: 'compact', hideDetails: 'true' },
    VTextarea: { hideDetails: 'auto' },
  },
})