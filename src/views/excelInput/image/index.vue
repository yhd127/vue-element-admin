<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>图片文件</span>
      </div>
      <div class="text item">
        <p>此页面用于显示系统中的图片文件。</p>
        <el-empty description="暂无图片文件"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ImageFiles',
  data() {
    return {
      // 数据将在未来实现
    }
  }
}
</script>

<style scoped>
.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}
</style> 