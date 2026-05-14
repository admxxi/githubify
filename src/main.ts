import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'
import App from './App.vue'

const GC_TIME = 1000 * 60 * 60 * 24 // 24 hours

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: GC_TIME,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'gh_digest_query_cache',
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: GC_TIME,
})

createApp(App)
  .use(createPinia())
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
