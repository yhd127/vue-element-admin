<template>
  <div class="block-description-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="id"
        label="id"
        width="80">
      </el-table-column>
      <el-table-column
        prop="Start_T1"
        label="Start_T1"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Start_T1" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Start_T2"
        label="Start_T2"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Start_T2" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Start_Track"
        label="Start_Track"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Start_Track" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Rule"
        label="Rule"
        width="100">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Rule" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Timer"
        label="Timer"
        width="100">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Timer" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="SubBlock_Start"
        label="Start_KP"
        width="120">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.SubBlock_Start" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="SubBlock_End"
        label="End"
        width="120">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.SubBlock_End" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Track2"
        label="Track2"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Track2" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="KP_correction"
        label="KP correction"
        width="150">
        <template slot-scope="scope">
          <el-input v-model="scope.row.KP_correction" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="SubBlock_StartDistance"
        label="Start distance"
        width="150">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.SubBlock_StartDistance" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="SubBlock_Track"
        label="Track"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.SubBlock_Track" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Overlap_Value"
        label="Value"
        width="120">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Overlap_Value" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Overlap_Track"
        label="Track"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Overlap_Track" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Overlap_Sens"
        label="Sens"
        width="120">
        <template slot-scope="scope">
          <el-input v-model="scope.row.Overlap_Sens" size="small" />
        </template>
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
  name: 'BlockDescription',
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
          Start_T1: '',
          Start_T2: '',
          Start_Track: '1',
          Rule: 'T',
          Timer: '0',
          SubBlock_Start: '0',
          SubBlock_End: '500',
          Track2: '1',
          KP_correction: '',
          SubBlock_StartDistance: '0',
          SubBlock_Track: '1',
          Overlap_Value: '0',
          Overlap_Track: '0',
          Overlap_Sens: '0'
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
      if (componentName !== 'BlockDescription') return
      
      // 构造新行数据，包含默认值
      const newRow = {
        id: this.sheetData.length + 1,
        Start_T1: rowData.Start_T1 || '',
        Start_T2: rowData.Start_T2 || '',
        Start_Track: rowData.Start_Track || '1',
        Rule: rowData.Rule || 'T',
        Timer: rowData.Timer || '0',
        SubBlock_Start: rowData.SubBlock_Start || '0',
        SubBlock_End: rowData.SubBlock_End || '500',
        Track2: rowData.Track2 || '1',
        KP_correction: rowData.KP_correction || '',
        SubBlock_StartDistance: rowData.SubBlock_StartDistance || '0',
        SubBlock_Track: rowData.SubBlock_Track || '1',
        Overlap_Value: rowData.Overlap_Value || '0',
        Overlap_Track: rowData.Overlap_Track || '0',
        Overlap_Sens: rowData.Overlap_Sens || '0'
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
.block-description-container {
  padding: 0;
}
</style> 