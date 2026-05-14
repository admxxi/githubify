<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubNotification } from '../types/github'
import { useMarkAsRead } from '../composables/useMutations'

const props = defineProps<{ notification: GitHubNotification }>()
const { markAsRead } = useMarkAsRead()

const typeIcon: Record<string, string> = {
  PullRequest: 'bi-git',
  Issue: 'bi-exclamation-circle',
  Commit: 'bi-code-slash',
  Discussion: 'bi-chat-square-dots',
  CheckSuite: 'bi-check2-circle',
  Release: 'bi-tag',
}

const typeColor: Record<string, string> = {
  PullRequest: 'text-success',
  Issue: 'text-danger',
  Commit: 'text-info',
  Discussion: 'text-primary',
  CheckSuite: 'text-warning',
  Release: 'text-secondary',
}

const reasonLabel: Record<string, string> = {
  assign: 'Assigned',
  author: 'Author',
  comment: 'Comment',
  ci_activity: 'CI',
  mention: 'Mentioned',
  review_requested: 'Review',
  security_alert: 'Security',
  state_change: 'State change',
  subscribed: 'Subscribed',
  team_mention: 'Team mention',
  your_activity: 'Your activity',
  manual: 'Manual',
  invitation: 'Invite',
}

const timeAgo = computed(() => {
  const diff = Date.now() - new Date(props.notification.updated_at).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
})

const htmlUrl = computed(() => {
  const url = props.notification.subject.url
  if (!url) return null
  return url
    .replace('https://api.github.com/repos/', 'https://github.com/')
    .replace('/pulls/', '/pull/')
    .replace('/commits/', '/commit/')
})
</script>

<template>
  <div
    class="d-flex align-items-start gap-3 py-2 px-3 notification-item"
    :class="{ 'bg-body-tertiary': notification.unread }"
  >
    <i :class="['bi', typeIcon[notification.subject.type] ?? 'bi-bell', typeColor[notification.subject.type] ?? 'text-secondary', 'mt-1', 'flex-shrink-0']"></i>

    <div class="flex-grow-1 min-w-0">
      <a
        :href="htmlUrl ?? '#'"
        :target="htmlUrl ? '_blank' : undefined"
        rel="noopener"
        class="text-decoration-none text-body fw-semibold text-truncate d-block"
        :title="notification.subject.title"
      >
        {{ notification.subject.title }}
      </a>
      <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
        <span class="badge rounded-pill bg-body-secondary text-body-secondary small">
          {{ reasonLabel[notification.reason] ?? notification.reason }}
        </span>
        <span class="text-body-tertiary small">{{ timeAgo }}</span>
        <span v-if="notification.unread" class="badge bg-warning-subtle text-warning-emphasis rounded-pill small">unread</span>
      </div>
    </div>

    <button
      v-if="notification.unread"
      class="btn btn-sm btn-outline-secondary border-0 flex-shrink-0"
      title="Mark as read"
      @click="markAsRead(notification.id)"
    >
      <i class="bi bi-check2"></i>
    </button>
  </div>
</template>

<style scoped>
.notification-item:hover {
  background-color: var(--bs-tertiary-bg) !important;
}
</style>
