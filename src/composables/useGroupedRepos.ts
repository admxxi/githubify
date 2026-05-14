import { computed } from 'vue'
import { useOpenPRsQuery, useNotificationsQuery, useCurrentUserQuery } from './useGitHubQueries'
import { useFiltersStore } from '../stores/filters'
import { WATCHED_REPOS } from '../config'
import type { GroupedRepo, GitHubNotification, GitHubOpenPR } from '../types/github'

export function useGroupedRepos() {
  const { data: openPRs, isLoading: prsLoading } = useOpenPRsQuery()
  const { data: notifications, isLoading: notifsLoading } = useNotificationsQuery()
  const { data: currentUser } = useCurrentUserQuery()
  const filters = useFiltersStore()

  const isLoading = computed(() => prsLoading.value || notifsLoading.value)

  const unreadCount = computed(() => (notifications.value ?? []).filter((n) => n.unread).length)

  const availableReasons = computed(() => {
    const reasons = new Set((notifications.value ?? []).map((n) => n.reason))
    return Array.from(reasons).sort()
  })

  const totalItems = computed(() =>
    groupedRepos.value.reduce((sum, g) => sum + g.openPRs.length + g.otherNotifications.length, 0),
  )

  const groupedRepos = computed<GroupedRepo[]>(() => {
    const prs = openPRs.value ?? []
    const notifs = notifications.value ?? []

    // Build repo info map from notification data (has avatar URLs etc.)
    const repoInfoMap = new Map<string, { html_url: string; ownerLogin: string; ownerAvatarUrl: string }>()
    for (const n of notifs) {
      const fn = n.repository.full_name
      if (!repoInfoMap.has(fn)) {
        repoInfoMap.set(fn, {
          html_url: n.repository.html_url,
          ownerLogin: n.repository.owner.login,
          ownerAvatarUrl: n.repository.owner.avatar_url,
        })
      }
    }

    // Index PR notifications by their API URL for matching
    const notifsByPRUrl = new Map<string, GitHubNotification[]>()
    const unmatchedNotifs: GitHubNotification[] = []

    for (const n of notifs) {
      if (filters.filterUnread && !n.unread) continue
      if (filters.filterReason !== 'all' && n.reason !== filters.filterReason) continue

      const url = n.subject.url
      if (n.subject.type === 'PullRequest' && url) {
        if (!notifsByPRUrl.has(url)) notifsByPRUrl.set(url, [])
        notifsByPRUrl.get(url)!.push(n)
      } else {
        unmatchedNotifs.push(n)
      }
    }

    const map = new Map<string, GroupedRepo>()

    function getOrCreateGroup(repoFullName: string, pr?: GitHubOpenPR): GroupedRepo {
      if (!map.has(repoFullName)) {
        const info = repoInfoMap.get(repoFullName)
        map.set(repoFullName, {
          repoFullName,
          repoHtmlUrl: info?.html_url ?? pr?.base.repo.html_url ?? '',
          ownerLogin: info?.ownerLogin ?? pr?.base.repo.owner.login ?? repoFullName.split('/')[0],
          ownerAvatarUrl: info?.ownerAvatarUrl ?? pr?.base.repo.owner.avatar_url ?? '',
          openPRs: [],
          otherNotifications: [],
        })
      }
      return map.get(repoFullName)!
    }

    // Own PRs first, then by updated_at desc
    const sortedPRs = [...prs].sort((a, b) => {
      const aOwn = a.user.login === currentUser.value?.login ? 0 : 1
      const bOwn = b.user.login === currentUser.value?.login ? 0 : 1
      if (aOwn !== bOwn) return aOwn - bOwn
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    for (const pr of sortedPRs) {
      const repoFullName = pr.base.repo.full_name
      const group = getOrCreateGroup(repoFullName, pr)
      const prNotifs = notifsByPRUrl.get(pr.url) ?? []
      notifsByPRUrl.delete(pr.url)
      group.openPRs.push({ pr, notifications: prNotifs })
    }

    // PR notifications that didn't match any open PR → unmatched
    for (const ns of notifsByPRUrl.values()) unmatchedNotifs.push(...ns)

    for (const n of unmatchedNotifs) {
      const repoFullName = n.repository.full_name
      if (WATCHED_REPOS.length > 0 && !WATCHED_REPOS.includes(repoFullName)) continue
      getOrCreateGroup(repoFullName).otherNotifications.push(n)
    }

    const values = Array.from(map.values())
    if (WATCHED_REPOS.length > 0) {
      values.sort((a, b) => WATCHED_REPOS.indexOf(a.repoFullName) - WATCHED_REPOS.indexOf(b.repoFullName))
    } else {
      values.sort((a, b) => b.openPRs.length - a.openPRs.length)
    }
    return values
  })

  return { groupedRepos, currentUser, isLoading, unreadCount, availableReasons, totalItems }
}
