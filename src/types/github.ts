export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GitHubNotificationSubject {
  title: string
  url: string | null
  latest_comment_url: string | null
  type: 'PullRequest' | 'Issue' | 'Commit' | 'Discussion' | 'CheckSuite' | 'Release' | string
}

export interface GitHubNotification {
  id: string
  unread: boolean
  reason: string
  updated_at: string
  last_read_at: string | null
  subject: GitHubNotificationSubject
  repository: GitHubRepository
  url: string
  subscription_url: string
}

export interface GitHubOpenPR {
  number: number
  title: string
  html_url: string
  url: string // API URL — used to match against notification.subject.url
  state: string
  draft: boolean
  user: { login: string; avatar_url: string }
  labels: Array<{ id: number; name: string; color: string }>
  comments: number
  review_comments: number
  created_at: string
  updated_at: string
  base: {
    repo: {
      full_name: string
      html_url: string
      owner: { login: string; avatar_url: string }
    }
  }
}

export interface GitHubComment {
  id: number
  user: { login: string; avatar_url: string }
  body: string
  created_at: string
  html_url: string
  type: 'issue' | 'review'
}

export interface PRWithNotifications {
  pr: GitHubOpenPR
  notifications: GitHubNotification[]
}

export interface GroupedRepo {
  repoFullName: string
  repoHtmlUrl: string
  ownerLogin: string
  ownerAvatarUrl: string
  openPRs: PRWithNotifications[]
  otherNotifications: GitHubNotification[]
}
