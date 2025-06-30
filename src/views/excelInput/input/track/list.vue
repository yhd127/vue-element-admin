<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <el-menu :default-active="activeIndex" mode="horizontal" class="track-menu" @select="handleSelect">
          <el-submenu index="1">
            <template slot="title">
              <i class="el-icon-document" />
              <span>Track文件列表</span>
            </template>
            <el-menu-item v-for="file in excelFiles" :key="file.name" :index="file.name">
              <i class="el-icon-document-copy" />
              {{ file.name }} ({{ file.displayName }})
            </el-menu-item>
            <el-menu-item index="refresh" @click.native.stop="getExcelFiles">
              <i class="el-icon-refresh" />
              刷新文件列表
            </el-menu-item>
          </el-submenu>
        </el-menu>
        <div class="header-buttons">
          <el-button size="small" type="primary" icon="el-icon-plus">新建文件</el-button>
          <el-button size="small" type="success" icon="el-icon-upload2">导入</el-button>
        </div>
      </div>
      <el-table
        :data="tableData"
        border
        style="width: 100%"
      >
        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center"
        />
        <el-table-column
          prop="username"
          label="用户名"
          width="180"
        />
        <el-table-column
          prop="name"
          label="姓名"
          width="150"
        />
        <el-table-column
          prop="file"
          label="文件名"
          width="200"
        />
        <el-table-column
          label="操作"
          align="center"
        >
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              size="mini"
              type="success"
              @click="handleShare(scope.row)"
            >分享</el-button>
            <el-button
              size="mini"
              type="warning"
              @click="handleSaveAs(scope.row)"
            >另存为</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'TrackList',
  data() {
    return {
      activeIndex: '1',
      excelFiles: [],
      tableData: [
        {
          id: 1,
          username: 'admin',
          name: '管理员',
          file: 'track_up.json'
        },
        {
          id: 2,
          username: 'user1',
          name: '用户1',
          file: 'track_down-YDL.json'
        },
        {
          id: 3,
          username: 'user2',
          name: '用户2',
          file: 'track_down-YX.json'
        },
        {
          id: 4,
          username: 'user3',
          name: '测试用户',
          file: 'track-InMDD.json'
        }
      ]
    }
  },
  created() {
    // 初始化时获取Excel文件列表
    this.getExcelFiles()
  },
  methods: {
    // 获取可用的Excel文件列表
    getExcelFiles() {
      // 模拟从后端获取Excel文件列表
      // 实际应用中，可以通过API请求获取
      const files = this.tableData.map(item => ({
        name: item.file.replace('.json', '.xls'),
        type: 'excel',
        userId: item.id,
        username: item.username,
        displayName: item.name
      }))
      this.excelFiles = files
      this.$message.success('文件列表已更新')
    },
    handleSelect(key, keyPath) {
      if (key === 'refresh') {
        return // 刷新按钮由单独的click事件处理
      }
      console.log('选择了Excel文件:', key, keyPath)
      // 查找与选择的Excel文件对应的表格数据
      const selectedFile = this.tableData.find(item => item.file.replace('.json', '.xls') === key)
      if (selectedFile) {
        this.handleView(selectedFile)
      } else {
        this.$message.info(`暂无${key}对应的数据记录`)
      }
    },
    handleView(row) {
      // 存储当前选中的文件信息，以便在详情页使用
      localStorage.setItem('selectedTrackFile', JSON.stringify(row))
      // 跳转到Track详情页
      this.$router.push(`/excelInput/input/track/detail/${row.id}`)
    },
    handleShare(row) {
      this.$message({
        message: `分享文件: ${row.file}`,
        type: 'success'
      })
    },
    handleSaveAs(row) {
      this.$message({
        message: `另存为文件: ${row.file}`,
        type: 'warning'
      })
    }
  }
}
</script>

<style scoped>
.box-card {
  width: 100%;
  margin-bottom: 20px;
}

/* 菜单样式调整 */
.track-menu {
  border-bottom: none !important;
}

.el-submenu__title {
  height: 40px !important;
  line-height: 40px !important;
  font-size: 16px !important;
  font-weight: bold;
}

.clearfix {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

/* 修复菜单项和按钮的垂直对齐 */
.el-menu-item {
  line-height: 36px !important;
  height: 36px !important;
}

.el-menu-item i {
  margin-right: 5px;
  color: #409EFF;
}

/* 固定菜单宽度，防止表格宽度变化 */
.track-menu {
  min-width: 200px;
}
</style>
