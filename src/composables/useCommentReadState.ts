import { ref } from 'vue'

const STORAGE_KEY = 'gh_comment_reads'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function save(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {}
}

// Shared across all component instances
const readIds = ref<Set<string>>(load())

function key(type: 'issue' | 'review', id: number) {
  return `${type}-${id}`
}

export function useCommentReadState() {
  function isRead(type: 'issue' | 'review', id: number) {
    return readIds.value.has(key(type, id))
  }

  function toggleRead(type: 'issue' | 'review', id: number) {
    const next = new Set(readIds.value)
    if (next.has(key(type, id))) {
      next.delete(key(type, id))
    } else {
      next.add(key(type, id))
    }
    readIds.value = next
    save(next)
  }

  return { isRead, toggleRead }
}
