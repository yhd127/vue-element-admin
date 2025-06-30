<template>
  <div class="gradient-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="id"
        label="ID"
        width="80"
      />
      <el-table-column
        prop="T1"
        label="T1"
        width="120"
      />
      <el-table-column
        prop="T2"
        label="T2"
        width="120"
      />
      <el-table-column
        prop="Track1"
        label="Track"
        width="120"
      />
      <el-table-column
        prop="KP"
        label="KP (m)"
        width="120"
      />
      <el-table-column
        prop="slope"
        label="坡度 (%)"
        width="120"
      />
      <el-table-column
        prop="Track2"
        label="Track"
        width="120"
      />
      <el-table-column
        prop="KP_correction"
        label="KP correction"
        width="150"
      />
      <el-table-column
        prop="Distance"
        label="Distance"
        width="120"
      />
      <el-table-column
        prop="Slope_permille"
        label="Slope (‰)"
        width="120"
      />
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
  name: 'Gradient',
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
          id: 1,
          T1: '',
          T2: '',
          Track1: '1',
          KP: '0',
          slope: '0',
          Track2: '1',
          KP_correction: '',
          Distance: '0',
          Slope_permille: '0'
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

        // 重新设置ID
        this.updateRowIds()

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
      if (componentName !== 'Gradient') return

      // 构造新行数据，包含默认值
      const newRow = {
        id: this.sheetData.length + 1,
        T1: rowData.T1 || '',
        T2: rowData.T2 || '',
        Track1: rowData.Track1 || '1',
        KP: rowData.KP || '0',
        slope: rowData.slope || '0',
        Track2: rowData.Track2 || '1',
        KP_correction: rowData.KP_correction || '',
        Distance: rowData.Distance || '0',
        Slope_permille: rowData.Slope_permille || '0'
      }

      // 根据insertPosition决定在哪里插入新行
      if (rowData.index >= 0 && rowData.index < this.sheetData.length) {
        // 在指定位置插入
        this.sheetData.splice(rowData.index + 1, 0, newRow)
      } else {
        // 在末尾插入
        this.sheetData.push(newRow)
      }

      // 更新所有行的ID
      this.updateRowIds()

      // 提示添加成功
      this.$message({
        type: 'success',
        message: '添加行成功!'
      })
    },

    // 更新所有行的ID
    updateRowIds() {
      this.sheetData.forEach((row, index) => {
        row.id = index + 1
      })
    }
  }
}
</script>

<style scoped>
.gradient-container {
  padding: 0;
}
</style>
