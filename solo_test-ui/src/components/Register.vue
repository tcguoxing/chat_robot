<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import JSEncrypt from 'jsencrypt'
import { registerApi, getPublicKeyApi } from '../api'
import type { RegisterRequest } from '../api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const isFormDirty = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  inviteCode: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{4,20}$/, message: '用户名只能包含字母和数字，长度在4到20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/, 
      message: '密码需包含大小写字母、数字和特殊符号，长度至少8位', 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (_: any, value: string, callback: any) => {
        if (value === '') {
          callback(new Error('请确认密码'))
        } else if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { min: 6, max: 20, message: '邀请码长度在6到20个字符之间', trigger: 'blur' }
  ]
}

// 处理注册表单提交
const handleRegister = async () => {
  if (formRef.value && !loading.value) {
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
          const encryptedPassword = encryptor.encryptOAEP(registerForm.password)
          
          if (!encryptedPassword) {
            throw new Error('密码加密失败')
          }
          
          // 3. 准备注册请求参数
          const registerParams: RegisterRequest = {
            username: registerForm.username,
            password: encryptedPassword,
            email: registerForm.email,
            phone: registerForm.phone,
            inviteCode: registerForm.inviteCode
          }
          
          // 4. 调用注册接口
          const registerRes = await registerApi(registerParams)
          if (registerRes.code === 200) {
            ElMessage.success(registerRes.message)
            console.log('注册成功:', registerRes.data)
            // 注册成功后跳转到登录页面
            router.push('/')
          } else {
            ElMessage.error(registerRes.message || '注册失败')
          }
        } catch (err: any) {
          console.error('注册请求失败:', err)
          ElMessage.error(err.message || '注册请求失败，请稍后重试')
        } finally {
          loading.value = false
        }
      } else {
        ElMessage.error('表单验证失败，请检查输入')
        return false
      }
    })
  }
}

// 处理表单输入，标记表单为已修改
const handleInput = () => {
  if (!isFormDirty.value) {
    isFormDirty.value = true
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/')
}
</script>

<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h1 class="login-title">立即注册</h1>
      <p class="login-subtitle">请填写以下信息创建您的账号</p>
      
      <el-form
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        class="login-form"
        label-position="top"
        @input="handleInput"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名（4-20位字母和数字）"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（包含大小写字母、数字和特殊符号）"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Check"
            show-password
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            type="tel"
            placeholder="请输入手机号码"
            prefix-icon="Phone"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="registerForm.inviteCode"
            placeholder="请输入邀请码（6-20位）"
            prefix-icon="Key"
            size="large"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            @click="handleRegister"
            class="login-btn"
            size="large"
            :loading="loading"
            :disabled="!isFormDirty"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-prompt">
        <span>已有账号？</span>
        <el-button type="text" class="register-btn" @click="goToLogin">立即登录</el-button>
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
  max-width: 420px;
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
  margin-bottom: 20px;
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

.login-btn:hover:not(:disabled) {
  background: rgba(64, 158, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
    margin-bottom: 16px;
  }
}
</style>