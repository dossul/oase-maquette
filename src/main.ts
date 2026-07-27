import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './plugins/router'
import './style.css'

const app = createApp(App).use(createPinia()).use(vuetify).use(router)

// Monter uniquement une fois la route initiale résolue : sinon App.vue rend
// transitoirement le layout par défaut (AppLayout) sur TOUTE page (y compris
// /login), ce qui déclenchait des appels API anonymes (401 → boucle de
// rechargements en production).
router.isReady().then(() => app.mount('#app'))
