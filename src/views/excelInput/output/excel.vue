<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>Excel文件</span>
      </div>
      <el-table
        :data="excelFiles"
        style="width: 100%"
        border
      >
        <el-table-column
          prop="name"
          label="文件名"
          width="220"
        />
        <el-table-column
          prop="size"
          label="大小"
          width="120"
        />
        <el-table-column
          prop="date"
          label="上传日期"
          width="180"
        />
        <el-table-column
          label="操作"
        >
          <template slot-scope="scope">
            <el-button
              size="mini"
              @click="handleDownload(scope.row)"
            >下载</el-button>
            <el-button
              size="mini"
              type="danger"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ExcelFiles',
  data() {
    return {
      excelFiles: [
        {
          name: '导出数据示例.xlsx',
          size: '128KB',
          date: '2023-05-15'
        },
        {
          name: '系统报表.xlsx',
          size: '256KB',
          date: '2023-05-16'
        }
      ]
    }
  },
  methods: {
    handleDownload(row) {
      this.$message({
        message: `下载文件: ${row.name}`,
        type: 'success'
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除文件 ${row.name}?`, '提示', {
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
</style> 