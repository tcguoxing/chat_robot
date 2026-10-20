<template>
  <div class="chat-container">
    <!-- 头部：单用户模式，内置 admin，无登录 -->
    <header class="chat-header">
      <div class="header-title">AI 助手</div>
      <div class="header-meta">单用户模式 · admin</div>
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
            <el-avatar :size="36" :icon="UserFilled"></el-avatar>
          </div>
          
          <div class="message-content">
            <div class="message-bubble">{{ msg.content }}</div>
            <div v-if="msg.meta" class="message-meta">{{ msg.meta }}</div>
          </div>
        </div>
      </div>
    </main>

    <!-- 输入区域 -->
    <footer class="chat-footer">
      <div class="input-wrapper">
        <!-- 工具栏 -->
        <div class="toolbar" row-flex>
          <input
            ref="fileInputRef"
            class="file-input"
            type="file"
            multiple
            :accept="ACCEPT"
            @change="handleFileChange"
          />
          <el-tooltip
            content="支持图片与纯文本（txt/md/csv/json 等），单个不超过 10MB，最多 50 个"
            placement="top"
          >
            <el-button text :icon="Paperclip" class="tool-btn" @click="triggerFilePick">
              附件
            </el-button>
          </el-tooltip>
          <el-button text :icon="Delete" class="tool-btn" @click="clearMessages">清空对话</el-button>
        </div>

        <!-- 已选附件 -->
        <div v-if="attachedFiles.length" class="attachment-list">
          <el-tag
            v-for="(file, index) in attachedFiles"
            :key="`${file.name}-${index}`"
            type="info"
            size="small"
            closable
            @close="removeFile(index)"
          >
            {{ file.name }}
          </el-tag>
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
            :disabled="sending || (!userInput.trim() && attachedFiles.length === 0)"
            :loading="sending"
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
import { ElMessage } from 'element-plus'
import { chatKimi } from '../api/ai'
defineOptions({name: 'Chat'})

interface Message {
  role: 'user' | 'assistant'
  content: string
  /** 图执行信息，比如推理步数 / 工具调用次数 */
  meta?: string
}

const MAX_FILES = 50
const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv', '.json', '.log', '.yml', '.yaml']
const ACCEPT = [...IMAGE_EXTENSIONS, ...TEXT_EXTENSIONS].join(',')

const chatMainRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const userInput = ref('')
const sessionId = ref(crypto.randomUUID())
const sending = ref(false)
const attachedFiles = ref<File[]>([])
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

// 后端返回的 content 可能是字符串，也可能是多模态的数组
const formatContent = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
      .join('')
  }
  return content == null ? '' : String(content)
}

const getExtension = (name: string) => {
  const index = name.lastIndexOf('.')
  return index === -1 ? '' : name.slice(index).toLowerCase()
}

// 把 LangGraph 的执行信息展示出来：推理步数 / 工具调用次数
const buildGraphMeta = (data: { steps?: number; toolCalls?: number }): string => {
  const parts: string[] = []
  if (data.steps) parts.push(`${data.steps} 步推理`)
  if (data.toolCalls) parts.push(`调用工具 ${data.toolCalls} 次`)
  return parts.join(' · ')
}

const isSupportedFile = (file: File) => {
  const ext = getExtension(file.name)
  return IMAGE_EXTENSIONS.includes(ext) || TEXT_EXTENSIONS.includes(ext)
}

const triggerFilePick = () => {
  fileInputRef.value?.click()
}

const removeFile = (index: number) => {
  attachedFiles.value.splice(index, 1)
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  for (const file of files) {
    if (attachedFiles.value.length >= MAX_FILES) {
      ElMessage.warning(`最多只能上传 ${MAX_FILES} 个文件`)
      break
    }
    if (!isSupportedFile(file)) {
      ElMessage.warning(`不支持的文件类型：${file.name}（仅支持图片与纯文本）`)
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      ElMessage.warning(`文件 ${file.name} 超过 10MB，已跳过`)
      continue
    }
    const duplicated = attachedFiles.value.some(
      (item) => item.name === file.name && item.size === file.size,
    )
    if (duplicated) {
      ElMessage.warning(`文件 ${file.name} 已添加`)
      continue
    }
    attachedFiles.value.push(file)
  }

  // 清空 input，保证同一个文件可以被再次选择
  input.value = ''
}

// 发送消息
const handleSend = async () => {
  if (sending.value) return

  const text = userInput.value.trim()
  const files = [...attachedFiles.value]
  if (!text && files.length === 0) return

  // 1. 添加用户消息（附件以文件名形式展示在气泡里）
  const displayParts: string[] = []
  if (text) displayParts.push(text)
  if (files.length) displayParts.push(files.map((file) => `📎 ${file.name}`).join('\n'))
  messages.value.push({ role: 'user', content: displayParts.join('\n') })

  userInput.value = ''
  attachedFiles.value = []
  sending.value = true
  await scrollToBottom()

  // 2. 调用后端 POST /chat（multipart/form-data）
  const assistantIndex = messages.value.push({ role: 'assistant', content: '正在思考…' }) - 1
  // 通过数组下标取到的是响应式代理，直接改它的 content 就能触发视图更新
  const assistantMessage = messages.value[assistantIndex]!
  await scrollToBottom()

  try {
    const data = await chatKimi({ info: text, sessionId: sessionId.value, files })
    if (data.code === 200 && data.data) {
      assistantMessage.content = formatContent(data.data.content) || '（空回复）'
      assistantMessage.meta = buildGraphMeta(data.data) || undefined
    } else {
      assistantMessage.content = `抱歉，本次回复失败：${data.message || '未知错误'}`
    }
  } catch (error: any) {
    // 网络/业务错误在气泡里给出可读提示，避免只弹一个 toast 却留下空白回复
    assistantMessage.content = `抱歉，本次回复失败：${error?.message || '请稍后重试'}`
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

// 清空对话
const clearMessages = () => {
  if (sending.value) return
  messages.value = [
    { role: 'assistant', content: '你好！我是你的 AI 助手，有什么我可以帮你的吗？' }
  ]
  // 清空对话时生成新的 sessionId，代表开启新一轮对话
  sessionId.value = crypto.randomUUID()
  attachedFiles.value = []
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
  position: relative;
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

  .header-meta {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: #86909c;
    background: #f2f3f5;
    border-radius: 10px;
    padding: 2px 10px;
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

  .message-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #86909c;
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

    .file-input {
      display: none;
    }
    
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

  .attachment-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;

    .el-tag {
      max-width: 220px;
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
