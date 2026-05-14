<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{ body: string }>()

marked.use({
  renderer: {
    code({ text, lang }) {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      if (lang === 'suggestion') {
        return `<div class="suggestion-block">
  <div class="suggestion-header"><span class="suggestion-icon">±</span> Suggested change</div>
  <pre class="suggestion-code"><code>${escaped}</code></pre>
</div>`
      }
      return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escaped}</code></pre>`
    },
  },
  breaks: true,
})

const html = computed(() =>
  DOMPurify.sanitize(marked.parse(props.body) as string, { USE_PROFILES: { html: true } }),
)
</script>

<template>
  <div class="md" v-html="html"></div>
</template>

<style scoped>
.md {
  font-size: 0.85rem;
  line-height: 1.55;
  word-break: break-word;
  color: var(--bs-body-color);
}

.md :deep(p) { margin: 0 0 0.4em; }
.md :deep(p:last-child) { margin-bottom: 0; }

.md :deep(code) {
  font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
  font-size: 0.82em;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 3px;
  padding: 0.1em 0.35em;
}

.md :deep(pre) {
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 6px;
  padding: 0.65em 0.85em;
  overflow-x: auto;
  margin: 0.4em 0;
}
.md :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.9em;
}

.md :deep(blockquote) {
  border-left: 3px solid var(--bs-border-color);
  margin: 0.4em 0;
  padding: 0.1em 0.75em;
  color: var(--bs-secondary-color);
}
.md :deep(blockquote p) { margin: 0; }

.md :deep(.suggestion-block) {
  border: 1px solid var(--bs-success-border-subtle, #a3cfbb);
  border-radius: 6px;
  overflow: hidden;
  margin: 0.4em 0;
}
.md :deep(.suggestion-header) {
  background: var(--bs-success-bg-subtle);
  color: var(--bs-success-text-emphasis);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.3em 0.75em;
  border-bottom: 1px solid var(--bs-success-border-subtle, #a3cfbb);
  display: flex;
  align-items: center;
  gap: 0.35em;
}
.md :deep(.suggestion-icon) { font-weight: 700; }
.md :deep(.suggestion-code) {
  background: var(--bs-success-bg-subtle);
  border: none;
  border-radius: 0;
  margin: 0;
  padding: 0.6em 0.85em;
}

.md :deep(ul), .md :deep(ol) { margin: 0.25em 0; padding-left: 1.4em; }
.md :deep(li) { margin-bottom: 0.15em; }

.md :deep(h1), .md :deep(h2), .md :deep(h3), .md :deep(h4) {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.5em 0 0.25em;
}

.md :deep(a) { color: var(--bs-link-color); }

.md :deep(table) { border-collapse: collapse; font-size: 0.85em; margin: 0.4em 0; }
.md :deep(th), .md :deep(td) {
  border: 1px solid var(--bs-border-color);
  padding: 0.3em 0.6em;
}
.md :deep(th) { background: var(--bs-tertiary-bg); }
</style>
