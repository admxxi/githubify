<script setup lang="ts">
import { ref } from 'vue'
import { useGroupedRepos } from '../composables/useGroupedRepos'
import { useMarkAsRead } from '../composables/useMutations'
import PRItem from './PRItem.vue'
import NotificationItem from './NotificationItem.vue'

const PAGE_SIZE = 12

const { groupedRepos, currentUser, isLoading } = useGroupedRepos()
const { markRepoAsRead } = useMarkAsRead()

const pages = ref<Map<string, number>>(new Map())

function getPage(key: string) {
  return pages.value.get(key) ?? 0
}

function setPage(key: string, page: number) {
  pages.value = new Map(pages.value).set(key, page)
}

function pagedPRs(key: string, prs: typeof groupedRepos.value[0]['openPRs']) {
  const p = getPage(key)
  return prs.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE)
}

function totalPages(count: number) {
  return Math.ceil(count / PAGE_SIZE)
}
</script>

<template>
  <div v-if="isLoading" class="text-center py-5">
    <div class="spinner-border text-warning" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="text-body-secondary mt-3">Fetching open PRs and notifications...</p>
  </div>

  <div v-else-if="groupedRepos.length === 0" class="text-center py-5">
    <i class="bi bi-check2-circle fs-1 text-body-tertiary"></i>
    <p class="text-body-secondary mt-3">No open PRs or notifications</p>
  </div>

  <div v-else class="d-flex flex-column gap-3">
    <div v-for="group in groupedRepos" :key="group.repoFullName" class="card">
      <div class="card-header d-flex align-items-center gap-2 py-2">
        <img :src="group.ownerAvatarUrl" :alt="group.ownerLogin" class="rounded-circle" width="20" height="20" />
        <a :href="group.repoHtmlUrl" target="_blank" rel="noopener" class="text-decoration-none fw-semibold text-body flex-grow-1">
          {{ group.repoFullName }}
        </a>
        <span v-if="group.openPRs.length" class="badge bg-success-subtle text-success-emphasis rounded-pill">
          <i class="bi bi-git me-1"></i>{{ group.openPRs.length }} open
        </span>
        <span v-if="group.otherNotifications.length" class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">
          {{ group.otherNotifications.length }}
        </span>
        <button class="btn btn-sm btn-outline-secondary border-0 ms-1" title="Mark all in repo as read" @click="markRepoAsRead(group.repoFullName)">
          <i class="bi bi-check2-all"></i>
        </button>
      </div>

      <div class="card-body p-0">
        <div v-if="group.openPRs.length">
          <div class="divide-y">
            <PRItem
              v-for="item in pagedPRs(group.repoFullName, group.openPRs)"
              :key="item.pr.number"
              :item="item"
              :is-own="item.pr.user.login === currentUser?.login"
            />
          </div>

          <div
            v-if="group.openPRs.length > PAGE_SIZE"
            class="d-flex align-items-center justify-content-between px-3 py-2 border-top bg-body-tertiary"
          >
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="getPage(group.repoFullName) === 0"
              @click="setPage(group.repoFullName, getPage(group.repoFullName) - 1)"
            >
              <i class="bi bi-chevron-left"></i> Prev
            </button>
            <span class="small text-body-secondary">
              Page {{ getPage(group.repoFullName) + 1 }} of {{ totalPages(group.openPRs.length) }}
            </span>
            <button
              class="btn btn-sm btn-outline-secondary"
              :disabled="getPage(group.repoFullName) >= totalPages(group.openPRs.length) - 1"
              @click="setPage(group.repoFullName, getPage(group.repoFullName) + 1)"
            >
              Next <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>

        <div v-if="group.otherNotifications.length">
          <div v-if="group.openPRs.length" class="px-3 py-1 bg-body-tertiary border-top border-bottom">
            <span class="small text-body-tertiary text-uppercase fw-semibold" style="font-size: 0.7rem; letter-spacing: 0.05em">
              Other notifications
            </span>
          </div>
          <div class="divide-y">
            <NotificationItem v-for="n in group.otherNotifications" :key="n.id" :notification="n" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.divide-y > * + * {
  border-top: 1px solid var(--bs-border-color);
}
</style>
