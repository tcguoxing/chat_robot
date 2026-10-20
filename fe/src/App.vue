<script setup lang="ts"></script>

<template>
  <!-- 单用户模式，没有登录页，直接进入聊天 -->
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  background-color: #f7f7f8;
  color: #1d2129;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
}
</style>
