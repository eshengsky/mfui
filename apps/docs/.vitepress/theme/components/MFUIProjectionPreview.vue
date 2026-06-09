<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

type TimelineItem = {
  date: string;
  title: string;
  description?: string;
};

const { lang } = useData();

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'hero';
  }>(),
  {
    variant: 'default',
  },
);

const isZh = computed(() => lang.value.startsWith('zh'));

const copy = computed(() => {
  if (isZh.value) {
    return {
      componentLabel: '组件 UI',
      componentHint: '用于展示与交互',
      textLabel: '文本投影',
      textHint: '用于复制、分享和作为上下文',
      intro: '这是发布计划：',
      title: '发布计划',
      items: [
        {
          date: '3 月 15 日',
          title: '项目启动',
          description: '确认目标、里程碑和协作方式。',
        },
        {
          date: '3 月 22 日',
          title: '设计评审',
        },
        {
          date: '3 月 29 日',
          title: '公开预览',
          description: '发布首个可试用版本，并收集反馈。',
        },
      ] satisfies TimelineItem[],
    };
  }

  return {
    componentLabel: 'Component UI',
    componentHint: 'for display and interaction',
    textLabel: 'Text Projection',
    textHint: 'for copy, sharing, and context',
    intro: 'Here is the launch plan:',
    title: 'Launch plan',
    items: [
      {
        date: 'Mar 15',
        title: 'Project kickoff',
        description: 'Align goals, milestones, and collaboration.',
      },
      {
        date: 'Mar 22',
        title: 'Design review',
      },
      {
        date: 'Mar 29',
        title: 'Public preview',
        description: 'Ship the first usable version and collect feedback.',
      },
    ] satisfies TimelineItem[],
  };
});

const projection = computed(() => {
  const lines = [
    copy.value.intro,
    '',
    ...copy.value.items.flatMap((item) =>
      item.description
        ? [`- ${item.date}: ${item.title} - ${item.description}`]
        : [`- ${item.date}: ${item.title}`],
    ),
  ];

  return lines.join('\n');
});
</script>

<template>
  <section
    class="mfui-preview"
    :class="{ 'mfui-preview--hero': props.variant === 'hero' }"
    aria-label="MFUI component and text projection preview"
  >
    <div class="mfui-preview__pane mfui-preview__pane--component">
      <p class="mfui-preview__markdown">{{ copy.intro }}</p>

      <div class="mfui-timeline" aria-label="Timeline component preview">
        <div
          v-for="(item, index) in copy.items"
          :key="`${item.date}:${item.title}`"
          class="mfui-timeline__item"
        >
          <div
            class="mfui-timeline__rail"
            :class="{ 'mfui-timeline__rail--last': index === copy.items.length - 1 }"
            aria-hidden="true"
          >
            <span class="mfui-timeline__dot" />
          </div>
          <div class="mfui-timeline__content">
            <p class="mfui-timeline__date">{{ item.date }}</p>
            <p class="mfui-timeline__title">{{ item.title }}</p>
            <p v-if="item.description" class="mfui-timeline__description">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>

      <p class="mfui-preview__label">
        <span>{{ copy.componentLabel }}</span>
        <span>{{ copy.componentHint }}</span>
      </p>
    </div>

    <div class="mfui-preview__bridge" aria-hidden="true">
      <svg viewBox="0 0 20 20" focusable="false">
        <path
          d="M4 10h11m-4-4 4 4-4 4"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
        />
      </svg>
    </div>

    <div class="mfui-preview__pane mfui-preview__pane--projection">
      <pre class="mfui-preview__code"><code>{{ projection }}</code></pre>
      <p class="mfui-preview__label">
        <span>{{ copy.textLabel }}</span>
        <span>{{ copy.textHint }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.mfui-preview {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1px;
  margin: 28px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-divider);
  overflow: hidden;
}

.mfui-preview__pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 360px;
  padding: 24px;
  background: var(--vp-c-bg);
}

.mfui-preview--hero {
  margin: 0;
  box-shadow: 0 24px 60px color-mix(in srgb, var(--vp-c-text-1) 12%, transparent);
}

.mfui-preview--hero .mfui-preview__pane {
  min-height: 330px;
  padding: 22px;
}

.mfui-preview--hero .mfui-preview__markdown {
  margin-bottom: 20px;
}

.mfui-preview--hero .mfui-timeline__content {
  padding-bottom: 22px;
}

@media (min-width: 960px) {
  .mfui-preview--hero {
    transform: translateX(32px);
  }
}

.mfui-preview__pane--component {
  justify-content: flex-start;
}

.mfui-preview__pane--projection {
  background: color-mix(in srgb, var(--vp-c-bg-soft) 54%, var(--vp-c-bg));
}

.mfui-preview__bridge {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  transform: translate(-50%, -50%);
}

.mfui-preview__bridge svg {
  width: 18px;
  height: 18px;
}

.mfui-preview__markdown {
  margin: 0 0 24px;
  line-height: 1.6;
  font-size: 15px;
  color: var(--vp-c-text-1);
}

.mfui-timeline {
  display: grid;
  gap: 0;
  margin: 0;
}

.mfui-timeline__item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  column-gap: 16px;
}

.mfui-timeline__rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.mfui-timeline__rail::after {
  position: absolute;
  top: 26px;
  bottom: 1px;
  width: 2px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 68%, transparent);
  content: '';
}

.mfui-timeline__rail--last::after {
  display: none;
}

.mfui-timeline__dot {
  position: relative;
  z-index: 1;
  margin-top: 6px;
  width: 12px;
  height: 12px;
  border: 3px solid var(--vp-c-bg);
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent);
}

.mfui-timeline__content {
  min-width: 0;
  padding-bottom: 28px;
}

.mfui-timeline__date,
.mfui-timeline__title,
.mfui-timeline__description {
  margin: 0;
}

.mfui-timeline__date {
  line-height: 1.4;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.mfui-timeline__title {
  margin-top: 2px;
  line-height: 1.45;
  font-size: 16px;
  font-weight: 650;
  color: var(--vp-c-text-1);
}

.mfui-timeline__description {
  margin-top: 5px;
  line-height: 1.55;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.mfui-preview__code {
  flex: 1;
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.mfui-preview__code code {
  display: block;
  padding: 0;
  background: transparent;
  color: inherit;
  font-family: var(--vp-font-family-mono);
}

.mfui-preview__label {
  margin: auto 0 0;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 14px;
  line-height: 1.5;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.mfui-preview__label span + span::before {
  content: ', ';
}

@media (max-width: 767px) {
  .mfui-preview {
    grid-template-columns: 1fr;
  }

  .mfui-preview__bridge {
    display: none;
  }

  .mfui-preview__pane {
    min-height: 0;
    padding: 20px;
  }
}
</style>
