<template>
  <div class="track-container">
    <help-guide />
    <track-manager :project-id="projectId" />
  </div>
</template>

<script>
import TrackManager from './components/TrackManager'
import HelpGuide from './components/HelpGuide'

export default {
  name: 'TrackDetail',
  components: {
    TrackManager,
    HelpGuide
  },
  data() {
    return {
      projectId: ''
    }
  },
  created() {
    // 从路由参数中获取项目ID
    if (this.$route.params.id) {
      this.projectId = this.$route.params.id
    }
  }
}
</script>

<style scoped>
.track-container {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 84px);
}
</style>
