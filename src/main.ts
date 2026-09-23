import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import * as m from './paraglide/messages.js'
import { getLocale } from './paraglide/runtime.js'
import './styles/main.scss'

document.documentElement.lang = getLocale()
document.title = m.document_title()

createApp(App).use(router).mount('#app')
