import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

//TODO: 只导入部分Vuetify的组件和样式，减少包体积

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976d2',
          secondary: '#424242',
          // ... 其他颜色配置
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'elevated' },
    VTextField: { variant: 'outlined', density: 'compact' },
    VCard: { variant: 'elevated' },
  },
})