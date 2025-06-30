<template>
  <div class="tracks-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="id"
        label="ID"
        width="80">
      </el-table-column>
      <el-table-column
        prop="Track_ID_before_jump"
        label="Track_ID_before_jump"
        width="180">
      </el-table-column>
      <el-table-column
        prop="Track_ID_after_jump"
        label="Track_ID_after_jump"
        width="180">
      </el-table-column>
      <el-table-column
        prop="KP_before_jump"
        label="KP_before_jump"
        width="150">
      </el-table-column>
      <el-table-column
        prop="KP_after_jump"
        label="KP_after_jump"
        width="150">
      </el-table-column>
      <el-table-column
        prop="Jump_length"
        label="Jump_length"
        width="150">
      </el-table-column>
      <el-table-column
        prop="Correction_applied_to_KP"
        label="Correction_applied_to_KP"
        width="220">
      </el-table-column>
      <el-table-column
        prop="Distance_from_track_origin_to_jump_point"
        label="Distance_from_track_origin_to_jump_point"
        width="300">
      </el-table-column>
      <el-table-column 
        label="操作" 
        width="200">
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
  name: 'Tracks',
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
          Track_ID_before_jump: 'Track1',
          Track_ID_after_jump: 'Track2',
          KP_before_jump: '1000',
          KP_after_jump: '1100',
          Jump_length: '100',
          Correction_applied_to_KP: '0',
          Distance_from_track_origin_to_jump_point: '1000'
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
      if (componentName !== 'Tracks') return
      
      // 构造新行数据，包含默认值
      const newRow = {
        id: this.sheetData.length + 1,
        Track_ID_before_jump: rowData.Track_ID_before_jump || '',
        Track_ID_after_jump: rowData.Track_ID_after_jump || '',
        KP_before_jump: rowData.KP_before_jump || '',
        KP_after_jump: rowData.KP_after_jump || '',
        Jump_length: rowData.Jump_length || '',
        Correction_applied_to_KP: rowData.Correction_applied_to_KP || '0',
        Distance_from_track_origin_to_jump_point: rowData.Distance_from_track_origin_to_jump_point || ''
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
.tracks-container {
  padding: 0;
}
</style> 