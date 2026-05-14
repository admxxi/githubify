import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import type { GitHubNotification } from '../types/github'

export function usePostCommentMutation() {
  const auth = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      repoFullName,
      prNumber,
      commentId,
      commentType,
      body,
    }: {
      repoFullName: string
      prNumber: number
      commentId: number
      commentType: 'issue' | 'review'
      body: string
    }) => {
      const [owner, repo] = repoFullName.split('/')
      if (commentType === 'review') {
        return auth.githubFetch(
          `/repos/${owner}/${repo}/pulls/${prNumber}/comments/${commentId}/replies`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body }),
          },
        )
      }
      return auth.githubFetch(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
    },
    onSuccess: (_, { repoFullName, prNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['prComments', repoFullName, prNumber] })
    },
  })
}

export function useMarkAsRead() {
  const auth = useAuthStore()
  const queryClient = useQueryClient()

  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: (id: string) =>
      auth.githubFetch(`/notifications/threads/${id}`, { method: 'PATCH' }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      queryClient.setQueryData<GitHubNotification[]>(['notifications'], (old) =>
        old?.map((n) => (n.id === id ? { ...n, unread: false } : n)) ?? [],
      )
    },
  })

  const { mutateAsync: markAllAsRead } = useMutation({
    mutationFn: () => auth.githubFetch('/notifications', { method: 'PUT' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutateAsync: markRepoAsRead } = useMutation({
    mutationFn: (repoFullName: string) => {
      const [owner, repo] = repoFullName.split('/')
      return auth.githubFetch(`/repos/${owner}/${repo}/notifications`, { method: 'PUT' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return { markAsRead, markAllAsRead, markRepoAsRead }
}
