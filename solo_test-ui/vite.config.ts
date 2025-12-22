import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // '/api': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   rewrite: path => path.replace(/^\/api/, '')
      // }
      '/dev': { // 默认API前缀，如果需要根据环境变量配置，可以设置默认值
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev/, ''),
      }
    }
  }
})
