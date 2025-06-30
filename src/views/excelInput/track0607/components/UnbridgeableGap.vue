<template>
  <div class="unbridgeable-gap-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="Distance"
        label="Distance (m)"
        width="150"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Distance" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Unbridgable_gap"
        label="Unbridgable_gap"
        width="150"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.Unbridgable_gap" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="200"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            icon="el-icon-plus"
            @click="handleInsertRow(scope.$index)"
          >下行插入</el-button>
          <el-button
            size="mini"
            type="danger"
            icon="el-icon-delete"
            @click="handleDeleteRow(scope.$index)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'UnbridgeableGap',
  props: {
    activeSheet: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      sheetData: [
        {
          Distance: '1000',
          Unbridgable_gap: '1'
        }
      ]
    }
  },
  created() {
    // 监听新行数据添加事件
    this.$root.$on('add-new-row', this.addNewRow)
  },
  beforeDestroy() {
    // 移除监听器
    this.$root.$off('add-new-row', this.addNewRow)
  },
  methods: {
    // 在表格中插入行的处理函数
    handleInsertRow(index) {
      // 通过事件通知父组件
      this.$emit('insert-row', index)
    },

    // 删除行
    handleDeleteRow(index) {
      // 确认删除提示
      this.$confirm('确认删除此行数据?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除数据
        this.sheetData.splice(index, 1)

        // 提示删除成功
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        // 取消删除
      })
    },

    // 添加新行数据
    addNewRow(componentName, rowData) {
      // 只处理当前组件的数据
      if (componentName !== 'UnbridgeableGap') return

      // 构造新行数据，包含默认值
      const newRow = {
        Distance: rowData.Distance || '0',
        Unbridgable_gap: rowData.Unbridgable_gap || '1'
      }

      // 根据insertPosition决定在哪里插入新行
      if (rowData.index >= 0 && rowData.index < this.sheetData.length) {
        // 在指定位置插入
        this.sheetData.splice(rowData.index + 1, 0, newRow)
      } else {
        // 在末尾插入
        this.sheetData.push(newRow)
      }

      // 提示添加成功
      this.$message({
        type: 'success',
        message: '添加行成功!'
      })
    }
  }
}
</script>

<style scoped>
.unbridgeable-gap-container {
  padding: 0;
}
</style>
