<script setup lang="ts">
import { watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from './stores/auth'
import { useGroupedRepos } from './composables/useGroupedRepos'
import { useMarkAsRead } from './composables/useMutations'
import { useNotificationsQuery } from './composables/useGitHubQueries'
import SetupToken from './components/SetupToken.vue'
import FilterBar from './components/FilterBar.vue'
import NotificationList from './components/NotificationList.vue'

const auth = useAuthStore()
const queryClient = useQueryClient()
const { unreadCount, isLoading } = useGroupedRepos()
const { markAllAsRead } = useMarkAsRead()
const { dataUpdatedAt } = useNotificationsQuery()

watch(
  () => auth.token,
  (val) => { if (!val) queryClient.clear() },
)

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function refresh() {
  await queryClient.invalidateQueries()
}
</script>

<template>
  <SetupToken v-if="!auth.token" />

  <div v-else class="container py-4" style="max-width: 860px">
    <header class="d-flex align-items-center gap-3 mb-4">
      <i class="bi bi-bell-fill fs-3 text-warning"></i>
      <div class="flex-grow-1">
        <h1 class="h4 fw-bold mb-0">GitHub Digest</h1>
        <p v-if="dataUpdatedAt" class="text-body-tertiary small mb-0">
          Updated at {{ formatTime(dataUpdatedAt) }} &mdash; refreshes every 60s
        </p>
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-sm btn-outline-warning"
          :disabled="isLoading"
          title="Mark all as read"
          @click="markAllAsRead()"
        >
          <i class="bi bi-check2-all me-1"></i>
          <span class="d-none d-sm-inline">Mark all read</span>
          <span v-if="unreadCount" class="ms-1 badge bg-warning text-dark rounded-pill">{{ unreadCount }}</span>
        </button>

        <button
          class="btn btn-sm btn-outline-secondary"
          :disabled="isLoading"
          title="Refresh"
          @click="refresh"
        >
          <i class="bi bi-arrow-clockwise" :class="{ spin: isLoading }"></i>
        </button>

        <button
          class="btn btn-sm btn-outline-danger"
          title="Disconnect"
          @click="auth.clearToken()"
        >
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>

    <div class="mb-3">
      <FilterBar />
    </div>

    <NotificationList />
  </div>
</template>

<style>
body { min-height: 100vh; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}
</style>
