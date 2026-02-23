<template>
  <div>
weather info
  </div>
</template>

<script setup>

console.log('weather info')


aiOperator.getWeatherInfo().then(res => {
  console.log('getWeatherInfo: ', res)
})

defineOptions({
  name: 'WeatherInfo'
})
const weatherInfo = ref({})
</script>

<style lang="scss" scoped>

</style>
