<script setup lang="ts">
// 不再直接导入Login组件，而是通过路由显示
</script>

<template>
  <div class="app-container">
    <!-- 渐变叠加层 -->
    <div class="gradient-overlay"></div>
    
    <!-- 路由出口，用于显示当前路由对应的组件 -->
    <router-view></router-view>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f0f2f5;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
}

.app-container {
  width: 100%;
  height: 100%;
  background-image: url('https://picsum.photos/id/1039/1920/1080');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* 渐变叠加层 */
.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.35) 0%, rgba(255, 107, 107, 0.25) 100%);
  backdrop-filter: blur(5px);
  z-index: 1;
}

/* 确保路由出口在最上层 */
.app-container > *:last-child {
  position: relative;
  z-index: 2;
}
</style>
