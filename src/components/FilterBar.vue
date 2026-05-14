<script setup lang="ts">
import { useFiltersStore } from '../stores/filters'
import { useGroupedRepos } from '../composables/useGroupedRepos'

const filters = useFiltersStore()
const { availableReasons, unreadCount, totalItems } = useGroupedRepos()

const reasonLabels: Record<string, string> = {
  assign: 'Assigned',
  author: 'Author',
  comment: 'Comment',
  ci_activity: 'CI Activity',
  invitation: 'Invitation',
  manual: 'Manual',
  mention: 'Mention',
  review_requested: 'Review Requested',
  security_alert: 'Security Alert',
  state_change: 'State Change',
  subscribed: 'Subscribed',
  team_mention: 'Team Mention',
  your_activity: 'Your Activity',
}
</script>

<template>
  <div class="d-flex flex-wrap align-items-center gap-2">
    <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">
      {{ totalItems }} items
      <span v-if="unreadCount" class="ms-1 badge bg-warning text-dark rounded-pill">{{ unreadCount }} unread</span>
    </span>

    <div class="d-flex gap-2 flex-wrap ms-auto">
      <div class="form-check form-switch mb-0 d-flex align-items-center gap-2">
        <input
          id="filter-unread"
          v-model="filters.filterUnread"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label small" for="filter-unread">Unread only</label>
      </div>

      <select v-model="filters.filterReason" class="form-select form-select-sm" style="width: auto">
        <option value="all">All reasons</option>
        <option v-for="r in availableReasons" :key="r" :value="r">
          {{ reasonLabels[r] ?? r }}
        </option>
      </select>
    </div>
  </div>
</template>
