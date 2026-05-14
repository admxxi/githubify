# GitHub Digest

A Vue 3 + TypeScript web app that displays GitHub notifications and open PRs grouped by repository, with filtering and real-time updates.

## 🏗️ Project Structure

```
src/
├── App.vue                    # Root layout & controls
├── main.ts                    # Entry point
├── config.ts                  # WATCHED_REPOS configuration
├── types/github.ts            # GitHub API TypeScript interfaces
├── components/
│   ├── SetupToken.vue         # Token authentication screen
│   ├── FilterBar.vue          # Filter controls (unread, reason)
│   ├── NotificationList.vue   # Grouped repos container
│   ├── PRItem.vue             # PR with collapsible notifications
│   └── NotificationItem.vue   # Non-PR notifications
└── composables/
    └── useNotifications.ts    # Core state & API logic
```

## 📦 Dependencies

**Production:**
- Vue 3 - UI framework
- Bootstrap 5 - Styling
- Bootstrap Icons - Icons
- Pinia - State management (available)
- TanStack Vue Query - Data fetching (available)

**Dev:**
- Vite - Build tool
- TypeScript - Type safety
- Vite Plugin PWA - PWA support

## 🔑 Key Types (github.ts)

```typescript
GitHubNotification   // Notifications: PRs, issues, discussions, etc.
GitHubOpenPR        // Open pull request metadata
PRWithNotifications // PR + attached notifications
GroupedRepo         // Repo with openPRs[] + otherNotifications[]
```

## 🧠 Core Logic (useNotifications.ts)

**Reactive State:**
- `token`, `currentUser`, `openPRs`, `notifications`
- `loading`, `error`, `lastFetched`
- `filterReason`, `filterUnread`

**Computed:**
- `groupedRepos` - PRs & notifications grouped/filtered by repo
- `availableReasons` - Unique notification reasons
- `unreadCount`, `totalItems`

**Functions:**
- `saveToken()`, `clearToken()`
- `fetchAll()` - Fetches user, open PRs, notifications
- `markAsRead()`, `markAllAsRead()`, `markRepoAsRead()`

**Grouping Logic:**
1. Index notifications by PR URL
2. Sort PRs (own first, then by updated_at)
3. Attach notifications to PRs
4. Separate unmatched notifications (issues, discussions)
5. Apply filters & sort repos

## 🎨 Components

| Component | Role |
|-----------|------|
| **App.vue** | Main layout, header, 60s auto-refresh |
| **SetupToken.vue** | Token input form |
| **FilterBar.vue** | Unread toggle + reason dropdown |
| **NotificationList.vue** | Paginated (12/page) repo cards |
| **PRItem.vue** | PR with collapsible notifications, color-coded |
| **NotificationItem.vue** | Standalone notification (issue, discussion, etc.) |

## 🔄 Data Flow

```
SetupToken → token saved
   ↓
fetchAll() runs:
  ├── fetchCurrentUser()
  ├── fetchOpenPRs()
  └── fetchRawNotifications()
   ↓
groupedRepos computed (filtered & sorted)
   ↓
NotificationList renders PRItem + NotificationItem
```

## 🌐 GitHub API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/user` | GET | Current user |
| `/repos/{owner}/{repo}/pulls?state=open` | GET | Open PRs |
| `/notifications?all=false` | GET | Unread notifications |
| `/notifications/threads/{id}` | PATCH | Mark as read |
| `/notifications` | PUT | Mark all as read |

**Auth:** Bearer token in header | **Scope:** `notifications`

## ✨ Features

- ✅ GitHub PAT authentication (localStorage)
- ✅ Display open PRs + notifications grouped by repo
- ✅ Link notifications to PRs
- ✅ Filter by reason & unread status
- ✅ Mark read (individual/repo/all)
- ✅ 60s auto-refresh
- ✅ Unread count badge
- ✅ Pagination (12 PRs per page)
- ✅ Own vs. other PR styling
- ✅ Deep links to comments on GitHub
- ✅ PWA support (offline-capable)

## 🛠️ Commands

```bash
npm install
npm run dev      # Dev server
npm run build    # TypeScript + Vite bundle
npm run preview  # Preview production build
```

## 🔐 Security

- Tokens stored in **localStorage** (client-only)
- GitHub API with Bearer auth
- Minimal scope: `notifications`

## 📝 Configuration

**src/config.ts:**
```typescript
export const WATCHED_REPOS = [
  "owner/repo",    // Leave empty to show all repos
  "owner/repo"
]
```

## 🚀 Extend / Modify

- **Change refresh rate:** App.vue `onMounted()` (currently 60s)
- **Add filters:** Add state to `useNotifications.ts` → update `groupedRepos` → add UI in `FilterBar.vue`
- **Change styling:** Modify Bootstrap classes or add scoped CSS

