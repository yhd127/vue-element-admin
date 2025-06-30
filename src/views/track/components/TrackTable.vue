<template>
  <div class="track-table">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>{{ title }}</span>
        <el-button-group style="float: right;">
          <el-button size="mini" type="primary" icon="el-icon-plus" @click="handleAddRow">添加行</el-button>
          <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDeleteRows">删除选中</el-button>
        </el-button-group>
      </div>

      <el-table
        ref="trackTable"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 300px)"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="序号" type="index" width="60" />

        <template v-for="(column, index) in columns">
          <el-table-column
            :key="index"
            :prop="column.prop"
            :label="column.label"
            :width="column.width || ''"
            :sortable="column.sortable || false"
            :fixed="column.fixed || false"
          >
            <template slot-scope="scope">
              <el-input
                v-if="!column.readonly"
                v-model="scope.row[column.prop]"
                :placeholder="column.placeholder || '请输入'"
                :disabled="column.disabled || false"
                @change="() => handleCellChange(scope.row, column.prop)"
              />
              <span v-else>{{ scope.row[column.prop] }}</span>
            </template>
          </el-table-column>
        </template>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page.sync="currentPage"
          :page-sizes="[10, 20, 30, 50, 100]"
          :page-size.sync="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { deepClone } from '@/utils/track/commonUtils'

export default {
  name: 'TrackTable',
  props: {
    title: {
      type: String,
      default: '轨道表格'
    },
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    initialRowTemplate: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      selectedRows: [],
      currentPage: 1,
      pageSize: 20,
      totalCount: 0
    }
  },
  computed: {
    tableData() {
      const startIndex = (this.currentPage - 1) * this.pageSize
      const endIndex = startIndex + this.pageSize
      return this.data.slice(startIndex, endIndex)
    }
  },
  watch: {
    data: {
      immediate: true,
      handler(newVal) {
        this.totalCount = newVal.length
      }
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    handleAddRow() {
      // 创建新行对象，使用初始模板
      const newRow = deepClone(this.initialRowTemplate)

      // 添加到数据中并发送事件
      this.$emit('add-row', newRow)

      // 确保分页显示新添加的行
      this.ensureRowVisible(this.data.length - 1)
    },
    handleDeleteRows() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请至少选择一行')
        return
      }

      this.$confirm('确认删除选中的数据吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 发送删除事件
        this.$emit('delete-rows', this.selectedRows)

        // 清空选择
        this.selectedRows = []

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
    },
    handleCellChange(row, property) {
      // 发送单元格更新事件
      this.$emit('cell-change', row, property)
    },
    handleSizeChange(size) {
      this.pageSize = size
    },
    handleCurrentChange(page) {
      this.currentPage = page
    },
    ensureRowVisible(rowIndex) {
      // 计算行应该在哪一页
      const targetPage = Math.floor(rowIndex / this.pageSize) + 1
      // 如果不在当前页，跳转到目标页
      if (this.currentPage !== targetPage) {
        this.currentPage = targetPage
      }
    }
  }
}
</script>

<style scoped>
.track-table {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 15px;
  text-align: right;
}
</style>
