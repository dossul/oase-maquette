import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './plugins/router'
import './style.css'

createApp(App).use(vuetify).use(router).mount('#app')
