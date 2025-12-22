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
    path: '/content',
    name: 'content',
    // 动态导入内容页面组件，实现懒加载
    component: () => import('../components/ContentPage.vue'),
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

export default router