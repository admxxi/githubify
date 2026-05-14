import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOKEN_KEY = 'gh_digest_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '')

  function saveToken(value: string) {
    token.value = value.trim()
    if (token.value) localStorage.setItem(TOKEN_KEY, token.value)
    else localStorage.removeItem(TOKEN_KEY)
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem(TOKEN_KEY)
  }

  async function githubFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token.value}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    })
    if (!res.ok) {
      const msg = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error((msg as { message?: string }).message ?? res.statusText)
    }
    return res
  }

  return { token, saveToken, clearToken, githubFetch }
})
