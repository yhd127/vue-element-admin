<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>输出文件</span>
      </div>

      <!-- 子路由视图 -->
      <router-view />

      <!-- 当没有子路由匹配时的默认内容 -->
      <div v-if="showDefault" class="default-content">
        <p>请选择要查看的文件类型</p>
        <div class="category-cards">
          <el-card shadow="hover" class="category-card" @click.native="goToExcelFiles">
            <div slot="header" class="clearfix">
              <span>Excel文件</span>
            </div>
            <div class="card-content">
              <i class="el-icon-document" />
              <p>查看和管理系统生成的Excel文件</p>
            </div>
          </el-card>

          <el-card shadow="hover" class="category-card" @click.native="goToImageFiles">
            <div slot="header" class="clearfix">
              <span>图片文件</span>
            </div>
            <div class="card-content">
              <i class="el-icon-picture" />
              <p>查看和管理系统生成的图片文件</p>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'OutputFiles',
  data() {
    return {
      showDefault: true
    }
  },
  watch: {
    $route(to, from) {
      // 监听路由变化，更新显示状态
      const path = to.path
      if (path === '/excelInput/output') {
        this.showDefault = true
      } else {
        this.showDefault = false
      }
    }
  },
  created() {
    // 根据当前路由判断是否显示默认内容
    const path = this.$route.path
    if (path === '/excelInput/output') {
      this.showDefault = true
    } else {
      this.showDefault = false
    }
  },
  methods: {
    goToExcelFiles() {
      this.$router.push('/excelInput/output/excel')
    },
    goToImageFiles() {
      this.$router.push('/excelInput/output/image')
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

.default-content {
  text-align: center;
  margin-top: 20px;
}

.category-cards {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  flex-wrap: wrap;
}

.category-card {
  width: 300px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.card-content i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #409EFF;
}

.card-content p {
  color: #606266;
}
</style>
