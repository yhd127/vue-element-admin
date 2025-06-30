<template>
  <el-dialog
    :visible.sync="visible"
    :title="imageInfo ? imageInfo.title : '图片预览'"
    fullscreen
    :show-close="true"
    :append-to-body="true"
    custom-class="full-screen-image-dialog"
    @close="handleClose"
  >
    <div class="full-screen-image-container">
      <img v-if="imageInfo" :src="imageInfo.path" class="full-screen-image">
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="downloadImage">下载图片</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ImagePreviewDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    imageInfo: {
      type: Object,
      default: null
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
    },

    downloadImage() {
      if (!this.imageInfo || !this.imageInfo.path) return

      // 创建临时链接并触发下载
      const link = document.createElement('a')
      link.href = this.imageInfo.path
      link.download = this.imageInfo.title || '图片.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      this.$message.success('图片下载已开始')
    }
  }
}
</script>

<style scoped>
.full-screen-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 160px);
  overflow: auto;
}

.full-screen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 全屏对话框样式覆盖 */
:deep(.full-screen-image-dialog) {
  margin: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.full-screen-image-dialog .el-dialog__body) {
  flex: 1;
  overflow: auto;
}
</style>
