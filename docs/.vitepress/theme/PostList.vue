<script setup>
import { computed } from 'vue'
import { data as allPosts } from '../posts.data.mjs'

const props = defineProps({
  section: { type: String, required: true },
})

const posts = computed(() => allPosts.filter((p) => p.section === props.section))
</script>

<template>
  <ul v-if="posts.length" class="post-list">
    <li v-for="p in posts" :key="p.url">
      <a :href="p.url">{{ p.title }}</a>
      <span v-if="p.date" class="post-date">{{ p.date }}</span>
    </li>
  </ul>
  <p v-else class="post-empty">还没有笔记，发布后会自动出现在这里。</p>
</template>

<style scoped>
.post-list {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}
.post-list li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.post-list a {
  font-weight: 500;
}
.post-date {
  margin-left: auto;
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}
.post-empty {
  color: var(--vp-c-text-2);
}
</style>
