import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const oaseLight = {
  dark: false,
  colors: {
    background: '#F4F6F9',
    surface: '#FFFFFF',
    primary: '#2774AE',
    secondary: '#36454F',
    error: '#C62828',
    info: '#0277BD',
    success: '#1B8F4C',
    warning: '#E65100',
    'on-background': '#1A2332',
    'on-surface': '#1A2332',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-error': '#FFFFFF',
    'on-info': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': '#F0F4F8',
    'surface-variant': '#E8EDF2',
    'on-surface-variant': '#36454F',
    'primary-darken-1': '#1A5C8E',
    'secondary-darken-1': '#263238',
  },
  variables: {
    'border-color': '#CBD5E1',
    'border-opacity': 1,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'hover-opacity': 0.06,
  },
}

const oaseDark = {
  dark: true,
  colors: {
    background: '#0F1923',
    surface: '#1A2539',
    primary: '#4A9FDE',
    secondary: '#7B97AB',
    error: '#EF5350',
    info: '#42A5F5',
    success: '#4CAF50',
    warning: '#FF7043',
    'on-background': '#E2EAF0',
    'on-surface': '#E2EAF0',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-error': '#FFFFFF',
    'on-info': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'surface-bright': '#243047',
    'surface-light': '#1E2E3E',
    'surface-variant': '#263445',
    'on-surface-variant': '#9BB5C8',
    'primary-darken-1': '#2774AE',
    'secondary-darken-1': '#4B6371',
  },
  variables: {
    'border-color': '#2D4059',
    'border-opacity': 1,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'oaseLight',
    themes: {
      oaseLight,
      oaseDark,
    },
  },
  defaults: {
    VCard: { rounded: '8px' },
    VBtn: { rounded: '6px' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VDataTable: { density: 'comfortable' },
    VChip: { rounded: '4px' },
  },
})
