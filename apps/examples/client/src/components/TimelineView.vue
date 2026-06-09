<script setup lang="ts">
import type { TimelineSpec } from './timeline';

defineProps<{
  spec: TimelineSpec;
}>();
</script>

<template>
  <section class="timeline">
    <h3>{{ spec.title }}</h3>
    <ol>
      <li v-for="item in spec.items" :key="`${item.time}:${item.title}`">
        <span class="timeline-time">{{ item.time }}</span>
        <div class="timeline-body">
          <strong>{{ item.title }}</strong>
          <p v-if="item.description">{{ item.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline {
  width: 100%;
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
}

.timeline h3 {
  margin: 0 0 16px;
  font-size: 18px;
  line-height: 1.35;
}

.timeline ol {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline li {
  display: grid;
  grid-template-columns: minmax(72px, 112px) 1fr;
  gap: 14px;
  align-items: start;
}

.timeline-time {
  color: #3861a6;
  font-weight: 650;
  line-height: 1.45;
}

.timeline-body {
  border-left: 2px solid #d9dee7;
  padding-left: 14px;
}

.timeline-body strong {
  display: block;
  line-height: 1.45;
}

.timeline-body p {
  margin: 4px 0 0;
  color: #596170;
  line-height: 1.55;
}

@media (max-width: 560px) {
  .timeline li {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
