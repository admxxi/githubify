<script setup lang="ts">
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const queryClient = useQueryClient()

const input = ref('')
const submitting = ref(false)
const err = ref('')

async function submit() {
  if (!input.value.trim()) {
    err.value = 'Please enter a token'
    return
  }
  err.value = ''
  submitting.value = true
  auth.saveToken(input.value)
  await queryClient.invalidateQueries()
  submitting.value = false
}
</script>

<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-body">
    <div class="card shadow-lg" style="max-width: 480px; width: 100%">
      <div class="card-body p-4 p-md-5">
        <div class="text-center mb-4">
          <i class="bi bi-bell-fill fs-1 text-warning"></i>
          <h1 class="h3 mt-2 fw-bold">GitHub Digest</h1>
          <p class="text-body-secondary">Enter a GitHub Personal Access Token to get started</p>
        </div>

        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label fw-semibold" for="token-input">Personal Access Token</label>
            <input
              id="token-input"
              v-model="input"
              type="password"
              class="form-control font-monospace"
              :class="{ 'is-invalid': err }"
              placeholder="ghp_..."
              autocomplete="off"
            />
            <div v-if="err" class="invalid-feedback">{{ err }}</div>
          </div>

          <div class="d-grid">
            <button type="submit" class="btn btn-warning fw-semibold" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ submitting ? 'Connecting...' : 'Connect' }}
            </button>
          </div>
        </form>

        <hr class="my-4" />

        <p class="small text-body-secondary mb-1">
          <i class="bi bi-info-circle me-1"></i>
          Token needs <code>notifications</code> scope. Stored only in your browser's localStorage.
        </p>
        <p class="small text-body-secondary mb-0">
          Create one at
          <a href="https://github.com/settings/tokens/new?scopes=notifications" target="_blank" rel="noopener">
            github.com/settings/tokens
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
