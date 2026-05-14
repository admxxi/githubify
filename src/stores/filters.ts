import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFiltersStore = defineStore('filters', () => {
  const filterReason = ref<string>('all')
  const filterUnread = ref<boolean>(false)
  return { filterReason, filterUnread }
})
