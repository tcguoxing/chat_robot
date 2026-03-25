<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import JSEncrypt from 'jsencrypt'
import { loginApi, getPublicKeyApi } from '../api'
import type { LoginRequest } from '../api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})

const rememberMe = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (formRef.value) {
    formRef.value.validate(async (valid: boolean) => {
      if (valid) {
        loading.value = true
        
        try {
          // 1. 获取公钥
          const publicKeyRes = await getPublicKeyApi()
          if (publicKeyRes.code !== 200) {
            throw new Error(publicKeyRes.message || '获取公钥失败')
          }
          
          // 2. 检查公钥数据是否存在
          if (!publicKeyRes.data) {
            throw new Error('公钥数据获取失败')
          }
          
          // 3. 使用公钥加密密码
          const encryptor = new JSEncrypt()
          encryptor.setPublicKey(publicKeyRes.data.publicKey)
          const encryptedPassword = encryptor.encryptOAEP(loginForm.password)
          
          if (!encryptedPassword) {
            throw new Error('密码加密失败')
          }
          
          // 3. 准备登录请求参数（注意：根据swagger，登录接口使用email字段）
          const loginParams: LoginRequest = {
            username: loginForm.username,
            password: encryptedPassword,
          }
          
          // 4. 调用登录接口
          const loginRes = await loginApi(loginParams)
          if (loginRes.code === 200) {
            ElMessage.success(loginRes.message)
            console.log('登录成功:', loginRes.data)
            
            // 保存 token
            if (loginRes.data && loginRes.data.accessToken) {
              localStorage.setItem('chatToken', loginRes.data.accessToken)
            }
            
            // 登录成功后跳转到聊天页面
            router.push('/chat')
          } else {
            ElMessage.error(loginRes.message || '登录失败')
          }
        } catch (err: any) {
          console.error('登录请求失败:', err)
          ElMessage.error(err.message || '登录请求失败，请稍后重试')
        } finally {
          loading.value = false
        }
      } else {
        ElMessage.error('表单验证失败')
        return false
      }
    })
  }
}

const handleForgotPassword = () => {
  ElMessage.info('忘记密码功能开发中')
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h1 class="login-title">登录</h1>
      <p class="login-subtitle">请输入您的账号和密码</p>
      
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>
        
        <div class="form-options">
          <el-checkbox v-model="rememberMe" class="remember-me">
            记住我
          </el-checkbox>
          <el-button type="text" class="forgot-password" @click="handleForgotPassword">
            忘记密码？
          </el-button>
        </div>
        
        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            class="login-btn"
            size="large"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-prompt">
        <span>还没有账号？</span>
        <el-button type="text" class="register-btn" @click="goToRegister">立即注册</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-form-wrapper:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.login-title {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
  line-height: 1.2;
}

.login-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 32px;
  text-align: center;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 8px;
}

.login-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) inset;
}

.login-form :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.25);
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.login-form :deep(.el-input__inner) {
  color: #fff;
  font-size: 14px;
  background: transparent;
  border: none;
}

.login-form :deep(.el-input__placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.login-form :deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.6);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-me {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 400;
}

.login-form :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.8);
}

.login-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

.login-form :deep(.el-checkbox__input.is-checked+.el-checkbox__label) {
  color: #fff;
}

.forgot-password {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  padding: 0;
  height: auto;
  font-weight: 400;
}

.forgot-password:hover {
  color: #409eff;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: rgba(64, 158, 255, 0.95);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.login-btn:hover {
  background: rgba(64, 158, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

.register-prompt {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 400;
}

.register-btn {
  color: #409eff;
  font-weight: 500;
  padding: 0;
  height: auto;
  margin-left: 4px;
}

.register-btn:hover {
  color: #66b1ff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-form-wrapper {
    margin: 0 16px;
    padding: 32px 24px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .login-subtitle {
    font-size: 13px;
  }
  
  .login-form :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>