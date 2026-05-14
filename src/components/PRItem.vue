<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PRWithNotifications, GitHubNotification } from '../types/github'
import { usePRCommentsQuery } from '../composables/useGitHubQueries'
import { useMarkAsRead, usePostCommentMutation } from '../composables/useMutations'
import { useCommentReadState } from '../composables/useCommentReadState'
import MarkdownContent from './MarkdownContent.vue'

const props = defineProps<{ item: PRWithNotifications; isOwn: boolean }>()

const { markAsRead } = useMarkAsRead()
const { mutateAsync: postComment, isPending: posting } = usePostCommentMutation()
const { isRead, toggleRead } = useCommentReadState()

const activePanel = ref<'comments' | 'notifications' | null>(null)
const commentsEnabled = computed(() => activePanel.value === 'comments')

const { data: comments, isLoading: commentsLoading } = usePRCommentsQuery(
  computed(() => props.item.pr.base.repo.full_name),
  computed(() => props.item.pr.number),
  commentsEnabled,
)

const replyingToId = ref<number | null>(null)
const replyBody = ref('')

function togglePanel(panel: 'comments' | 'notifications') {
  if (activePanel.value === panel) {
    activePanel.value = null
  } else {
    activePanel.value = panel
    replyingToId.value = null
    replyBody.value = ''
  }
}

const totalComments = computed(() => (props.item.pr.comments ?? 0) + (props.item.pr.review_comments ?? 0))

const unreadCommentCount = computed(() => {
  if (!comments.value) return 0
  return comments.value.filter((c) => !isRead(c.type, c.id)).length
})

const unreadNotifCount = computed(() => props.item.notifications.filter((n) => n.unread).length)

const timeAgo = computed(() => ago(props.item.pr.updated_at))

function ago(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const reasonIcon: Record<string, string> = {
  comment: 'bi-chat',
  review_requested: 'bi-eye',
  mention: 'bi-at',
  author: 'bi-pencil',
  assign: 'bi-person-check',
  ci_activity: 'bi-check2-circle',
  state_change: 'bi-arrow-left-right',
  subscribed: 'bi-bell',
  team_mention: 'bi-people',
  your_activity: 'bi-activity',
}

const reasonLabel: Record<string, string> = {
  comment: 'Comment',
  review_requested: 'Review requested',
  mention: 'Mention',
  author: 'Activity',
  assign: 'Assigned',
  ci_activity: 'CI',
  state_change: 'State change',
  subscribed: 'Subscribed',
  team_mention: 'Team mention',
  your_activity: 'Your activity',
}

function notifHtmlUrl(n: GitHubNotification): string {
  const url = n.subject.latest_comment_url
  const prUrl = props.item.pr.html_url
  if (!url) return prUrl
  const issueComment = url.match(/\/issues\/comments\/(\d+)$/)
  if (issueComment) return `${prUrl}#issuecomment-${issueComment[1]}`
  const pullComment = url.match(/\/pulls\/comments\/(\d+)$/)
  if (pullComment) return `${prUrl}#discussion_r${pullComment[1]}`
  return prUrl
}

async function submitReply(commentId: number, commentType: 'issue' | 'review') {
  if (!replyBody.value.trim()) return
  await postComment({
    repoFullName: props.item.pr.base.repo.full_name,
    prNumber: props.item.pr.number,
    commentId,
    commentType,
    body: replyBody.value.trim(),
  })
  replyBody.value = ''
  replyingToId.value = null
}
</script>

<template>
  <div class="pr-item">
    <!-- PR header row -->
    <div
      class="d-flex align-items-center gap-3 px-3 py-2 pr-header"
      :class="isOwn ? 'pr-own' : 'pr-other'"
    >
      <img
        :src="item.pr.user.avatar_url"
        :alt="item.pr.user.login"
        class="rounded-circle flex-shrink-0"
        width="20"
        height="20"
      />

      <div class="flex-grow-1 min-w-0">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <a
            :href="item.pr.html_url"
            target="_blank"
            rel="noopener"
            class="fw-semibold text-decoration-none text-body text-truncate"
          >
            {{ item.pr.title }}
          </a>
          <span class="text-body-tertiary small flex-shrink-0">#{{ item.pr.number }}</span>
          <span v-if="item.pr.draft" class="badge bg-secondary rounded-pill small">Draft</span>
          <span
            v-for="label in item.pr.labels"
            :key="label.id"
            class="badge rounded-pill small"
            :style="{
              backgroundColor: `#${label.color}`,
              color: parseInt(label.color, 16) > 0x888888 ? '#000' : '#fff',
            }"
          >
            {{ label.name }}
          </span>
        </div>
        <div class="d-flex align-items-center gap-2 mt-1">
          <span class="text-body-tertiary small">{{ item.pr.user.login }}</span>
          <span class="text-body-tertiary small">&middot; {{ timeAgo }}</span>
        </div>
      </div>

      <!-- Two panel buttons -->
      <div class="d-flex gap-1 flex-shrink-0">
        <!-- Comments button -->
        <button
          class="btn btn-sm d-flex align-items-center gap-1 panel-btn"
          :class="
            activePanel === 'comments'
              ? 'btn-secondary'
              : unreadCommentCount > 0
                ? 'btn-warning'
                : 'btn-outline-secondary'
          "
          :title="`${totalComments} comment${totalComments !== 1 ? 's' : ''}, ${unreadCommentCount} unread`"
          @click="togglePanel('comments')"
        >
          <i class="bi bi-chat-fill" style="font-size: 0.75rem"></i>
          <span class="fw-semibold" style="font-size: 0.8rem">{{ totalComments }}</span>
          <span class="count-sep">/</span>
          <span class="count-unread">{{ unreadCommentCount }}</span>
          <i
            class="bi ms-1"
            :class="activePanel === 'comments' ? 'bi-chevron-up' : 'bi-chevron-down'"
            style="font-size: 0.65rem"
          ></i>
        </button>

        <!-- Notifications button -->
        <button
          class="btn btn-sm d-flex align-items-center gap-1 panel-btn"
          :class="
            activePanel === 'notifications'
              ? 'btn-secondary'
              : unreadNotifCount > 0
                ? 'btn-warning'
                : 'btn-outline-secondary'
          "
          :title="`${item.notifications.length} notification${item.notifications.length !== 1 ? 's' : ''}, ${unreadNotifCount} unread`"
          @click="togglePanel('notifications')"
        >
          <i class="bi bi-bell-fill" style="font-size: 0.75rem"></i>
          <span class="fw-semibold" style="font-size: 0.8rem">{{ item.notifications.length }}</span>
          <template v-if="unreadNotifCount > 0">
            <span class="count-sep">/</span>
            <span class="count-unread">{{ unreadNotifCount }}</span>
          </template>
          <i
            class="bi ms-1"
            :class="activePanel === 'notifications' ? 'bi-chevron-up' : 'bi-chevron-down'"
            style="font-size: 0.65rem"
          ></i>
        </button>
      </div>
    </div>

    <!-- Comments panel -->
    <div
      v-if="activePanel === 'comments'"
      class="sub-panel"
      :class="isOwn ? 'panel-own' : 'panel-other'"
    >
      <div v-if="commentsLoading" class="px-3 py-3 text-center text-body-tertiary">
        <div class="spinner-border spinner-border-sm" role="status"></div>
        <span class="ms-2 small">Loading comments...</span>
      </div>

      <template v-else>
        <div v-for="c in comments" :key="`${c.type}-${c.id}`" class="comment-row">
          <!-- Comment header -->
          <div class="d-flex align-items-center gap-2 px-3 pt-2 pb-1">
            <img
              :src="c.user.avatar_url"
              :alt="c.user.login"
              class="rounded-circle flex-shrink-0"
              width="18"
              height="18"
            />
            <span class="small fw-semibold">{{ c.user.login }}</span>
            <span class="text-body-tertiary small">{{ ago(c.created_at) }}</span>
            <span
              v-if="c.type === 'review'"
              class="badge bg-info-subtle text-info-emphasis rounded-pill"
              style="font-size: 0.65rem"
            >review</span>

            <div class="ms-auto d-flex align-items-center gap-1">
              <!-- Read toggle -->
              <button
                class="btn btn-sm border-0 read-toggle"
                :class="isRead(c.type, c.id) ? 'btn-success' : 'btn-outline-secondary'"
                :title="isRead(c.type, c.id) ? 'Mark as unread' : 'Mark as read'"
                @click="toggleRead(c.type, c.id)"
              >
                <i :class="isRead(c.type, c.id) ? 'bi bi-check-circle-fill' : 'bi bi-circle'" style="font-size: 0.75rem"></i>
                <span style="font-size: 0.72rem; margin-left: 0.2em">{{ isRead(c.type, c.id) ? 'read' : 'unread' }}</span>
              </button>
              <!-- Reply -->
              <button
                class="btn btn-sm btn-outline-secondary border-0 py-0 px-1"
                style="font-size: 0.75rem"
                title="Reply"
                @click="replyingToId = replyingToId === c.id ? null : c.id; replyBody = ''"
              >
                <i class="bi bi-reply"></i>
              </button>
              <!-- Open on GitHub -->
              <a
                :href="c.html_url"
                target="_blank"
                rel="noopener"
                class="btn btn-sm btn-outline-secondary border-0 py-0 px-1"
                style="font-size: 0.75rem"
                title="Open on GitHub"
              >
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
          </div>

          <!-- Comment body -->
          <div class="px-3 pb-2">
            <MarkdownContent :body="c.body" />
          </div>

          <!-- Inline reply box -->
          <div v-if="replyingToId === c.id" class="reply-box px-3 pb-2 pt-2">
            <textarea
              v-model="replyBody"
              class="form-control form-control-sm mb-2"
              rows="3"
              placeholder="Write a reply… (Markdown supported)"
              :disabled="posting"
            ></textarea>
            <div class="d-flex gap-2">
              <button
                class="btn btn-sm btn-primary"
                :disabled="posting || !replyBody.trim()"
                @click="submitReply(c.id, c.type)"
              >
                <span v-if="posting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                Send
              </button>
              <button
                class="btn btn-sm btn-outline-secondary"
                :disabled="posting"
                @click="replyingToId = null; replyBody = ''"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div v-if="!comments?.length" class="px-3 py-2 text-body-tertiary small fst-italic">
          No comments yet
        </div>
      </template>
    </div>

    <!-- Notifications panel -->
    <div
      v-if="activePanel === 'notifications'"
      class="sub-panel"
      :class="isOwn ? 'panel-own' : 'panel-other'"
    >
      <div
        v-for="n in item.notifications"
        :key="n.id"
        class="d-flex align-items-center gap-2 px-3 py-2 notif-row"
        :class="{ 'notif-unread': n.unread }"
      >
        <i
          :class="['bi', reasonIcon[n.reason] ?? 'bi-bell', 'flex-shrink-0', 'text-body-secondary']"
          style="font-size: 0.85rem"
        ></i>
        <span class="small text-body-secondary flex-shrink-0">{{ reasonLabel[n.reason] ?? n.reason }}</span>
        <span class="text-body-tertiary small flex-shrink-0">&middot; {{ ago(n.updated_at) }}</span>
        <span
          v-if="n.unread"
          class="badge bg-warning-subtle text-warning-emphasis rounded-pill flex-shrink-0"
          style="font-size: 0.65rem"
        >unread</span>
        <div class="ms-auto d-flex align-items-center gap-1 flex-shrink-0">
          <a
            :href="notifHtmlUrl(n)"
            target="_blank"
            rel="noopener"
            class="btn btn-sm btn-outline-secondary border-0"
            title="Open on GitHub"
          >
            <i class="bi bi-box-arrow-up-right" style="font-size: 0.75rem"></i>
          </a>
          <button
            v-if="n.unread"
            class="btn btn-sm btn-outline-secondary border-0"
            title="Mark as read"
            @click="markAsRead(n.id)"
          >
            <i class="bi bi-check2" style="font-size: 0.85rem"></i>
          </button>
        </div>
      </div>

      <div v-if="!item.notifications.length" class="px-3 py-2 text-body-tertiary small fst-italic">
        No notifications
      </div>
    </div>
  </div>
</template>

<style scoped>
.pr-other {
  background-color: rgba(25, 135, 84, 0.25);
  border-left: 3px solid rgba(25, 135, 84, 0.6);
}
.pr-own {
  background-color: rgba(25, 135, 84, 0.12);
  border-left: 3px solid var(--bs-success);
}
.sub-panel {
  border-top: 1px solid var(--bs-border-color);
}
.panel-own  { border-left: 3px solid var(--bs-success); }
.panel-other { border-left: 3px solid rgba(25, 135, 84, 0.6); }
.panel-btn {
  min-width: 60px;
  justify-content: center;
}
.count-sep   { opacity: 0.5; font-size: 0.75rem; }
.count-unread { font-weight: 700; font-size: 0.8rem; }
.read-toggle {
  font-size: 0.72rem;
  line-height: 1.4;
  padding: 0.1rem 0.4rem;
}
.comment-row + .comment-row {
  border-top: 1px solid var(--bs-border-color);
}
.reply-box {
  background: var(--bs-tertiary-bg);
  border-top: 1px solid var(--bs-border-color);
}
.notif-row + .notif-row {
  border-top: 1px solid var(--bs-border-color);
}
.notif-unread {
  background-color: var(--bs-tertiary-bg);
}
</style>
