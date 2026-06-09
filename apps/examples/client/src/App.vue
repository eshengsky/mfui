<script setup lang="ts">
import {
  createMFUIManifest,
  streamMFUIMessage,
  type ProjectedMessage,
} from '@mfui/client';
import { computed, ref } from 'vue';

import TimelineView from './components/TimelineView.vue';
import {
  timelineDefinition,
  type TimelineSpec,
} from './components/timeline';

type UserChatItem = {
  id: string;
  role: 'user';
  content: string;
};

type AssistantChatItem = {
  id: string;
  role: 'assistant';
  pending: boolean;
  message?: ProjectedMessage;
  error?: string;
};

type ChatItem = UserChatItem | AssistantChatItem;

type ModelMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const mfui = createMFUIManifest({
  components: [timelineDefinition],
});

const input = ref(
  "Create tomorrow's release plan and show the key steps as a timeline.",
);
const isSending = ref(false);
const copiedAssistantId = ref<string>();
const chatItems = ref<ChatItem[]>([]);
const canSend = computed(() => input.value.trim().length > 0 && !isSending.value);

async function send(): Promise<void> {
  const content = input.value.trim();
  if (!content || isSending.value) {
    return;
  }

  chatItems.value.push({
    id: createId('user'),
    role: 'user',
    content,
  });

  const assistantId = createId('assistant');
  chatItems.value.push({
    id: assistantId,
    role: 'assistant',
    pending: true,
  });

  input.value = '';
  isSending.value = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: createRequestMessages(),
        mfui,
      }),
    });

    let received = false;
    for await (const message of streamMFUIMessage(response)) {
      received = true;
      setAssistantMessage(assistantId, message);
    }

    if (!received) {
      setAssistantError(assistantId, 'The model did not return any content.');
    } else {
      finishAssistant(assistantId);
    }
  } catch (error) {
    setAssistantError(
      assistantId,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    isSending.value = false;
  }
}

function createRequestMessages(): ModelMessage[] {
  const messages: ModelMessage[] = [];

  for (const item of chatItems.value) {
    if (item.role === 'user') {
      messages.push({
        role: 'user',
        content: item.content,
      });
      continue;
    }

    if (item.message?.portableText) {
      messages.push({
        role: 'assistant',
        content: item.message.portableText,
      });
    }
  }

  return messages;
}

function setAssistantMessage(id: string, message: ProjectedMessage): void {
  const item = findAssistant(id);
  if (!item) {
    return;
  }

  chatItems.value[item.index] = {
    ...item.value,
    pending: message.parts.length === 0,
    message,
  };
}

function finishAssistant(id: string): void {
  const item = findAssistant(id);
  if (!item) {
    return;
  }

  chatItems.value[item.index] = {
    ...item.value,
    pending: false,
  };
}

function setAssistantError(id: string, error: string): void {
  const item = findAssistant(id);
  if (!item) {
    return;
  }

  chatItems.value[item.index] = {
    ...item.value,
    pending: false,
    error,
  };
}

async function copyPortableText(item: AssistantChatItem): Promise<void> {
  const text = item.message?.portableText;
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copiedAssistantId.value = item.id;
    window.setTimeout(() => {
      if (copiedAssistantId.value === item.id) {
        copiedAssistantId.value = undefined;
      }
    }, 1400);
  } catch (error) {
    setAssistantError(
      item.id,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function findAssistant(
  id: string,
): { index: number; value: AssistantChatItem } | undefined {
  const index = chatItems.value.findIndex((item) => item.id === id);
  const item = chatItems.value[index];

  if (item?.role !== 'assistant') {
    return undefined;
  }

  return { index, value: item };
}

function asTimelineSpec(spec: unknown): TimelineSpec {
  return spec as TimelineSpec;
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
</script>

<template>
  <main class="chat-shell">
    <header class="chat-header">
      <h1>MFUI Example</h1>
      <span>{{ isSending ? 'Generating' : 'Ready' }}</span>
    </header>

    <section class="message-list" aria-live="polite">
      <p v-if="chatItems.length === 0" class="empty-state">
        No messages yet
      </p>

      <div
        v-for="item in chatItems"
        :key="item.id"
        :class="['message-row', item.role]"
      >
        <article v-if="item.role === 'user'" class="user-message">
          {{ item.content }}
        </article>

        <article v-else class="assistant-message">
          <p v-if="item.pending && !item.message" class="pending">
            Generating...
          </p>
          <p v-if="item.error" class="error">{{ item.error }}</p>

          <template v-if="item.message">
            <template v-for="part in item.message.parts" :key="part.id">
              <p v-if="part.type === 'text'" class="text-part">
                {{ part.content }}
              </p>

              <TimelineView
                v-else-if="part.type === 'component' && part.component === 'app.timeline'"
                :spec="asTimelineSpec(part.spec)"
              />

              <pre v-else class="text-fallback">{{ part.projection.text }}</pre>
            </template>
          </template>

          <footer class="assistant-actions">
            <button
              type="button"
              :disabled="!item.message?.portableText"
              @click="copyPortableText(item)"
            >
              {{ copiedAssistantId === item.id ? 'Copied' : 'Copy' }}
            </button>
          </footer>
        </article>
      </div>
    </section>

    <form class="composer" @submit.prevent="send">
      <textarea
        v-model="input"
        rows="3"
        :disabled="isSending"
        @keydown.enter.exact.prevent="send"
      />
      <button type="submit" :disabled="!canSend">
        Send
      </button>
    </form>
  </main>
</template>

<style scoped>
.chat-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 18px;
  width: min(920px, calc(100vw - 32px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 28px 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.chat-header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.chat-header span {
  color: #596170;
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 420px;
}

.empty-state {
  margin: auto;
  color: #717987;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: stretch;
}

.user-message {
  max-width: min(74%, 620px);
  border-radius: 8px;
  background: #24272d;
  color: #ffffff;
  padding: 12px 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.assistant-message {
  width: 100%;
  display: grid;
  gap: 12px;
}

.text-part,
.pending,
.error,
.text-fallback {
  width: 100%;
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
}

.pending {
  color: #717987;
}

.error {
  border-color: #efb3a5;
  color: #9f2d20;
  background: #fff4f1;
}

.text-fallback {
  overflow-x: auto;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    monospace;
}

.assistant-actions {
  display: flex;
  justify-content: flex-start;
}

.assistant-actions button {
  min-width: 72px;
  min-height: 34px;
  border: 1px solid #c9d0dc;
  border-radius: 8px;
  background: #ffffff;
  color: #24272d;
  font-size: 14px;
  font-weight: 650;
}

.assistant-actions button:not(:disabled):hover {
  border-color: #3861a6;
  color: #3861a6;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
  border-top: 1px solid #d9dee7;
  padding-top: 16px;
}

.composer textarea {
  width: 100%;
  min-height: 74px;
  resize: vertical;
  border: 1px solid #c9d0dc;
  border-radius: 8px;
  background: #ffffff;
  color: inherit;
  padding: 12px 14px;
  line-height: 1.55;
}

.composer textarea:focus {
  border-color: #3861a6;
  outline: 3px solid rgba(56, 97, 166, 0.16);
}

.composer button {
  min-width: 88px;
  min-height: 44px;
  border-radius: 8px;
  background: #3861a6;
  color: #ffffff;
  font-weight: 650;
}

@media (max-width: 640px) {
  .chat-shell {
    width: min(100vw - 24px, 920px);
    padding: 18px 0;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .composer button {
    width: 100%;
  }

  .user-message {
    max-width: 88%;
  }
}
</style>
