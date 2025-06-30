<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>图片文件</span>
      </div>
      <div class="image-container">
        <div v-for="(image, index) in images" :key="index" class="image-item">
          <div class="image-card">
            <img :src="image.url" class="image-preview">
            <div class="image-info">
              <div class="image-name">{{ image.name }}</div>
              <div class="image-meta">
                <span>{{ image.size }}</span>
                <span>{{ image.date }}</span>
              </div>
              <div class="image-actions">
                <el-button
                  size="mini"
                  type="primary"
                  @click="handleDownload(image)"
                >下载</el-button>
                <el-button
                  size="mini"
                  type="danger"
                  @click="handleDelete(image)"
                >删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'OutputImageFiles',
  data() {
    return {
      images: [
        {
          name: '设计图.png',
          url: 'https://via.placeholder.com/300x200?text=设计图',
          size: '1.2MB',
          date: '2023-05-15'
        },
        {
          name: '系统架构图.jpg',
          url: 'https://via.placeholder.com/300x200?text=系统架构图',
          size: '0.8MB',
          date: '2023-05-16'
        },
        {
          name: '用户界面.png',
          url: 'https://via.placeholder.com/300x200?text=用户界面',
          size: '2.1MB',
          date: '2023-05-17'
        }
      ]
    }
  },
  methods: {
    handleDownload(image) {
      this.$message({
        message: `下载图片: ${image.name}`,
        type: 'success'
      })
    },
    handleDelete(image) {
      this.$confirm(`确认删除图片 ${image.name}?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    }
  }
}
</script>

<style scoped>
.box-card {
  width: 100%;
}
.image-container {
  display: flex;
  flex-wrap: wrap;
  margin: -10px;
}
.image-item {
  padding: 10px;
  width: 33.333%;
  box-sizing: border-box;
}
.image-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}
.image-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.image-info {
  padding: 10px;
}
.image-name {
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}
.image-actions {
  display: flex;
  justify-content: space-between;
}
</style>
