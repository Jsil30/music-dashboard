import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#00BCD4',
          secondary: '#7C4DFF',
          surface: '#13131A',
          background: '#0A0A0F',
        },
      },
      light: {
        dark: false,
        colors: {
          primary: '#0097A7',
          secondary: '#5E35B1',
          surface: '#FFFFFF',
          background: '#F0F2F5',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

createApp(App).use(vuetify).mount('#app')
