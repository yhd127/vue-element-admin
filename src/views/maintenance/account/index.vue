<template>
  <div class="app-container">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script>
export default {
  name: 'AccountManagement'
}
</script>
