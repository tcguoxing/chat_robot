import { createRouter, createWebHistory } from 'vue-router'

// 单用户模式：没有登录/注册，只有聊天页
const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../components/Chat.vue')
  },
  // 其余路径统一回到聊天页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/chat'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
