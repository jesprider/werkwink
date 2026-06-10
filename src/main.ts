import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import StorageErrorView from './views/StorageErrorView.vue'
import { readStoredStateRaw, StorageLoadError } from './storage/loadState'
import './styles/fonts.css'
import './styles/main.css'

let storageErrorMessage: string | null = null

try {
  readStoredStateRaw()
} catch (err) {
  storageErrorMessage =
    err instanceof StorageLoadError ? err.message : err instanceof Error ? err.message : String(err)
}

if (storageErrorMessage) {
  createApp(StorageErrorView, { message: storageErrorMessage }).mount('#app')
} else {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp(App).use(pinia).use(router).mount('#app')
}
