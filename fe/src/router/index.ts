import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'

// 定义路由规则
const routes = [
  {
    path: '/',
    name: 'login',
    component: Login
  },
  {
    path: '/register',
    name: 'register',
    // 动态导入注册组件，实现懒加载
    component: () => import('../components/Register.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    // 动态导入内容页面组件，实现懒加载
    component: () => import('../components/Chat.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // 重定向到登录页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'  
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置路由守卫
router.beforeEach((to, _from, next) => {
  // 获取本地存储的 token
  const token = localStorage.getItem('chatToken')
  // next()

  // 如果访问的是登录或注册页
  if (to.path === '/' || to.path === '/register') {
    // 如果已有 token，则直接跳转到聊天页（或其他主页）
    if (token) {
      next('/chat')
    } else {
      next()
    }
  } else {
    // 访问其他页面，需要验证 token
    if (token) {
      next()
    } else {
      // 没有 token，重定向到登录页
      next('/')
    }
  }
})

export default router