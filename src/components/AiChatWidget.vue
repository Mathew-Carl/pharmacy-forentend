<template>
  <div class="ai-chat-widget">
    <button class="chat-fab" type="button" @click="togglePanel">
      <span class="chat-fab-icon">🤖</span>
      <span class="chat-fab-label">AI 客服</span>
    </button>

    <transition name="chat-fade">
      <div v-if="panelOpen" class="chat-panel" role="dialog" aria-label="AI 客服">
        <header class="chat-header">
          <div class="chat-title">
            <span class="chat-title-icon">🤖</span>
            <div>
              <div class="chat-title-text">药店 AI 助手</div>
              <div class="chat-title-sub">智能查询库存 / 价格 / 用药建议</div>
            </div>
          </div>
          <button class="chat-close" type="button" @click="togglePanel">×</button>
        </header>

        <section ref="messageListRef" class="chat-body">
          <div v-for="item in messages" :key="item.id" :class="['chat-message', item.role]">
            <div class="chat-bubble">
              <p class="chat-text">{{ item.content }}</p>
              <span class="chat-time">{{ item.time }}</span>
            </div>
          </div>
          <div v-if="loading" class="chat-message bot">
            <div class="chat-bubble typing">
              <span class="dot" />
              <span class="dot" />
              <span class="dot" />
            </div>
          </div>
        </section>

        <footer class="chat-footer">
          <textarea
            v-model="inputValue"
            class="chat-input"
            placeholder="请输入问题，例如：帮我查一下布洛芬"
            rows="1"
            @keydown.enter.exact.prevent="handleSend"
          />
          <button class="chat-send" type="button" :disabled="loading || !inputValue.trim()" @click="handleSend">
            发送
          </button>
        </footer>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { chatApi } from "@/api";

const panelOpen = ref(false);
const inputValue = ref("");
const loading = ref(false);
const messageListRef = ref<HTMLElement | null>(null);

const messages = ref([
  {
    id: Date.now(),
    role: "bot",
    content: "您好，我是药店 AI 助手。请问您想查询哪种药品？",
    time: new Date().toLocaleTimeString(),
  },
]);

const togglePanel = () => {
  panelOpen.value = !panelOpen.value;
  if (panelOpen.value) {
    nextTick(scrollToBottom);
  }
};

const scrollToBottom = () => {
  const el = messageListRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
};

const pushMessage = (role: "user" | "bot", content: string) => {
  messages.value.push({
    id: Date.now() + Math.random(),
    role,
    content,
    time: new Date().toLocaleTimeString(),
  });
  nextTick(scrollToBottom);
};

const handleSend = async () => {
  const content = inputValue.value.trim();
  if (!content || loading.value) return;
  inputValue.value = "";
  pushMessage("user", content);
  loading.value = true;
  try {
    const result = await chatApi.send({ user_input: content });
    const reply = result?.reply || "抱歉，暂时没有获取到回答。";
    pushMessage("bot", reply);
  } catch (error) {
    console.error("具体的报错信息是：", error);
    Message.error("AI 客服请求失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

onMounted(scrollToBottom);
</script>

<style scoped>
.ai-chat-widget {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 999;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.chat-fab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #2bb6a8 0%, #4bcfaf 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(43, 182, 168, 0.35);
  font-size: 14px;
  font-weight: 600;
}

.chat-fab-icon {
  font-size: 18px;
}

.chat-panel {
  width: 360px;
  max-height: 520px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(15, 65, 60, 0.24);
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0;
  bottom: 64px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(43, 182, 168, 0.12), rgba(75, 207, 175, 0.2));
  border-bottom: 1px solid rgba(30, 120, 110, 0.1);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-title-icon {
  font-size: 20px;
}

.chat-title-text {
  font-weight: 700;
  font-size: 16px;
}

.chat-title-sub {
  font-size: 12px;
  color: #4a6f6a;
}

.chat-close {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: #4a6f6a;
}

.chat-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8fbfa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  display: flex;
}

.chat-message.user {
  justify-content: flex-end;
}

.chat-message.bot {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 16px rgba(15, 65, 60, 0.08);
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
}

.chat-message.user .chat-bubble {
  background: linear-gradient(135deg, rgba(43, 182, 168, 0.16), rgba(75, 207, 175, 0.2));
  color: #14423f;
}

.chat-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.chat-time {
  align-self: flex-end;
  font-size: 11px;
  color: #7c9a96;
}

.chat-footer {
  padding: 12px 14px 16px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  border-top: 1px solid rgba(30, 120, 110, 0.08);
  background: #fff;
}

.chat-input {
  flex: 1;
  min-height: 36px;
  max-height: 90px;
  resize: none;
  border-radius: 12px;
  border: 1px solid rgba(30, 120, 110, 0.2);
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
  background: #f9fcfb;
}

.chat-send {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: #2bb6a8;
  color: #fff;
  font-weight: 600;
}

.chat-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.typing {
  flex-direction: row;
  gap: 6px;
  align-items: center;
}

.typing .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2bb6a8;
  animation: blink 1.2s infinite;
}

.typing .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing .dot:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: all 0.25s ease;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .ai-chat-widget {
    right: 16px;
    bottom: 16px;
  }

  .chat-panel {
    width: 320px;
  }
}
</style>
