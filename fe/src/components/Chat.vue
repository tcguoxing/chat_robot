<template>
  <div class="chat-container">
    <!-- 头部 -->
    <header class="chat-header">
      <div class="header-title"> AI 助手</div>
    </header>

    <!-- 消息列表 -->
    <main class="chat-main" ref="chatMainRef">
      <div class="message-list" role="contentList">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['message-item', msg.role === 'user' ? 'message-user' : 'message-assistant']"
        >
          <div class="avatar" v-if="msg.role === 'assistant'">
            <el-avatar :size="36" src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/doubao_logo_1.png">AI</el-avatar>
          </div>
          <div class="avatar" v-else>
            <el-avatar :size="36" icon="UserFilled"></el-avatar>
          </div>
          
          <div class="message-content">
            <div class="message-bubble">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </main>

    <!-- 输入区域 -->
    <footer class="chat-footer">
      <div class="input-wrapper">
        <!-- 工具栏 -->
        <div class="toolbar" row-flex>
          <el-tooltip content="最多 50 个文件。支持 pdf, txt, csv, docx, xlsx, pptx, md 等" placement="top">
            <el-button text :icon="Paperclip" class="tool-btn">附件</el-button>
          </el-tooltip>
          <el-button text :icon="Delete" class="tool-btn" @click="clearMessages">清空对话</el-button>
        </div>
        
        <!-- 输入框 -->
        <div class="input-box">
          <el-input
            v-model="userInput"
            type="textarea"
            role="userInput"
            :autosize="{ minRows: 1, maxRows: 6 }"
            placeholder="给“AI”发送消息..."
            resize="none"
            @keydown.enter.prevent="handleSend"
          />
          <el-button 
            type="primary" 
            class="send-btn" 
            :icon="Position" 
            :disabled="!userInput.trim()"
            @click="handleSend"
            circle
          ></el-button>
        </div>
      </div>
      <div class="footer-tip">内容由 AI 生成，请仔细甄别</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Paperclip, Delete, Position, UserFilled } from '@element-plus/icons-vue'
import {askKimi, chatKimi} from '../api/ai'
defineOptions({name: 'Chat'})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const chatMainRef = ref<HTMLElement | null>(null)
const userInput = ref('')
const sessionId = ref(crypto.randomUUID())
const messages = ref<Message[]>([
  { role: 'assistant', content: '你好！我是你的 AI 助手，有什么我可以帮你的吗？' }
])

// 滚动到最新消息
const scrollToBottom = async () => {
  await nextTick()
  if (chatMainRef.value) {
    chatMainRef.value.scrollTop = chatMainRef.value.scrollHeight
  }
}

// 发送消息
const handleSend = () => {
  const content = userInput.value.trim()
  if (!content) return
  
  // 1. 添加用户消息
  messages.value.push({
    role: 'user',
    content
  })
  
  userInput.value = ''
  scrollToBottom()

  // 2. 模拟 AI 回复（实际项目中这里会调用接口）
  chatKimi({info: content, sessionId: sessionId.value}).then(data => {
    console.log('data: ', data)
    if(data.code == 200) {
      const responseContent = data.data.content || ''
      messages.value.push({
        role: 'assistant',
        content: responseContent
      })
      scrollToBottom()
    }
  })
  // setTimeout(() => {
  //   messages.value.push({
  //     role: 'assistant',
  //     content: '这是一个模拟回复。你刚刚说：' + content
  //   })
  //   scrollToBottom()
  // }, 800)
}

// 清空对话
const clearMessages = () => {
  messages.value = [
    { role: 'assistant', content: '你好！我是你的 AI 助手，有什么我可以帮你的吗？' }
  ]
  // 清空对话时生成新的 sessionId，代表开启新一轮对话
  sessionId.value = crypto.randomUUID()
}
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f7f8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.chat-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-bottom: 1px solid #e5e6eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  z-index: 10;
  flex-shrink: 0;
  
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
  }
}

.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
  scroll-behavior: smooth;
  
  .message-list {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 0 20px;
  }
}

.message-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  
  &.message-user {
    flex-direction: row-reverse;
    
    .message-bubble {
      background-color: #165dff;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
  }
  
  &.message-assistant {
    .message-bubble {
      background-color: #fff;
      color: #1d2129;
      border: 1px solid #e5e6eb;
      border-bottom-left-radius: 4px;
    }
  }
}

.avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
  
  .message-bubble {
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 15px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
}

.chat-footer {
  padding: 16px 20px 24px;
  background: linear-gradient(180deg, rgba(247, 247, 248, 0) 0%, #f7f7f8 20%);
  flex-shrink: 0;
  
  .input-wrapper {
    max-width: 800px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 16px;
    border: 1px solid #e5e6eb;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    padding: 12px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
    
    &:focus-within {
      border-color: #165dff;
      box-shadow: 0 4px 12px rgba(22, 93, 255, 0.1);
    }
  }
  
  .toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    
    .tool-btn {
      padding: 4px 8px;
      height: 28px;
      color: #4e5969;
      
      &:hover {
        color: #165dff;
        background-color: #f2f3f5;
      }
    }
  }
  
  .input-box {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 12px;
    
    :deep(.el-textarea) {
      flex: 1;
    }
    
    :deep(.el-textarea__inner) {
      border: none;
      box-shadow: none;
      padding: 0;
      font-size: 15px;
      line-height: 1.5;
      background-color: transparent;
      resize: none;
      
      &::placeholder {
        color: #86909c;
      }
      
      &:focus {
        box-shadow: none;
      }
    }
    
    .send-btn {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      margin-bottom: 2px;
    }
  }
  
  .footer-tip {
    text-align: center;
    font-size: 12px;
    color: #86909c;
    margin-top: 12px;
  }
}
</style>
