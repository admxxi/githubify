import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import { WATCHED_REPOS } from '../config'
import type { GitHubNotification, GitHubOpenPR, GitHubComment } from '../types/github'

const REFETCH_INTERVAL = 60_000

export function useCurrentUserQuery() {
  const auth = useAuthStore()
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<{ login: string; avatar_url: string }> => {
      const res = await auth.githubFetch('/user')
      return res.json()
    },
    enabled: computed(() => !!auth.token),
    staleTime: Infinity, // user identity never goes stale
  })
}

export function useOpenPRsQuery() {
  const auth = useAuthStore()
  return useQuery({
    queryKey: ['openPRs'],
    queryFn: async (): Promise<GitHubOpenPR[]> => {
      if (WATCHED_REPOS.length === 0) return []
      const results = await Promise.all(
        WATCHED_REPOS.map((repo) =>
          auth
            .githubFetch(`/repos/${repo}/pulls?state=open&per_page=100&sort=updated`)
            .then((r) => r.json() as Promise<GitHubOpenPR[]>)
            .catch(() => [] as GitHubOpenPR[]),
        ),
      )
      return results.flat()
    },
    enabled: computed(() => !!auth.token),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  })
}

export function useNotificationsQuery() {
  const auth = useAuthStore()
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<GitHubNotification[]> => {
      const res = await auth.githubFetch('/notifications?all=false&per_page=100')
      return res.json()
    },
    enabled: computed(() => !!auth.token),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  })
}

export function usePRCommentsQuery(
  repoFullName: Ref<string>,
  prNumber: Ref<number>,
  enabled: Ref<boolean>,
) {
  const auth = useAuthStore()
  return useQuery({
    queryKey: computed(() => ['prComments', repoFullName.value, prNumber.value]),
    queryFn: async (): Promise<GitHubComment[]> => {
      const [issueComments, reviewComments] = await Promise.all([
        auth
          .githubFetch(`/repos/${repoFullName.value}/issues/${prNumber.value}/comments?per_page=100`)
          .then((r) => r.json() as Promise<any[]>),
        auth
          .githubFetch(`/repos/${repoFullName.value}/pulls/${prNumber.value}/comments?per_page=100`)
          .then((r) => r.json() as Promise<any[]>),
      ])
      const combined: GitHubComment[] = [
        ...issueComments.map((c) => ({ ...c, type: 'issue' as const })),
        ...reviewComments.map((c) => ({ ...c, type: 'review' as const })),
      ]
      combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      return combined
    },
    enabled: computed(() => !!auth.token && enabled.value),
    staleTime: REFETCH_INTERVAL,
  })
}
