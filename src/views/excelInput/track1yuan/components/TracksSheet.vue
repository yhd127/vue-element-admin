<template>
  <div class="tracks-sheet">
    <el-table
      :data="sheetData.data"
      border
      style="width: 100%; margin-top: 20px"
      :cell-class-name="cellClassName"
    >
      <el-table-column
        v-for="(header, index) in sheetData.headers"
        :key="index"
        :prop="header.prop"
        :label="header.label"
        :min-width="getColumnMinWidth(header.prop)"
        align="center"
      >
        <template #default="scope">
          <el-tooltip :content="String(scope.row[header.prop] || '')" placement="top" :disabled="!shouldShowTooltip(scope.row[header.prop])">
            <el-input
              v-model="scope.row[header.prop]"
              :placeholder="isFieldDisabled(header.prop) ? '' : '请输入内容'"
              :disabled="isFieldDisabled(header.prop)"
              class="cell-input text-center"
              @input="handleInputChange(header.prop, scope.row, scope.$index)"
            />
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="230" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-plus"
              class="insert-btn"
              @click="handleInsertRow(scope.$index)"
            >下行插入</el-button>
            <el-button
              size="mini"
              type="danger"
              @click="handleDeleteRow(scope.$index)"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { 
  calculateJumpLength, 
  calculateCorrectionValue, 
  calculateDistanceFromOrigin,
  updateNextRowTrackId,
  updateRowsAfterInsert,
  needsWarningStyle
} from '../calculations/tracksCalculations'

export default {
  name: 'TracksSheet',
  
  props: {
    // 工作表数据
    sheetData: {
      type: Object,
      required: true
    },
    // 方向参数，用于计算
    directionValue: {
      type: [Number, String],
      default: 1
    }
  },
  
  created() {
    // 组件创建时初始化计算值
    this.$nextTick(() => {
      this.initializeCalculatedValues()
    })
  },
  
  watch: {
    // 监听方向值变化
    directionValue(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateAllDistancesFromOrigin()
      }
    },
    
    // 监听数据变化
    'sheetData.data': {
      handler(newVal) {
        if (newVal && Array.isArray(newVal) && newVal.length > 0) {
          this.initializeCalculatedValues()
        }
      },
      deep: true
    }
  },
  
  methods: {
    /**
     * 初始化所有计算值
     */
    initializeCalculatedValues() {
      if (!this.sheetData || !this.sheetData.data || !Array.isArray(this.sheetData.data)) {
        return
      }
      
      // 计算所有Jump length
      for (let i = 0; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        row.Jump_length = calculateJumpLength(row)
      }
      
      // 更新所有行的Correction值
      this.updateAllCorrectionValues()
      
      // 更新所有行的Distance值
      this.updateAllDistancesFromOrigin()
    },
    
    /**
     * 获取列的最小宽度
     */
    getColumnMinWidth(prop) {
      const minWidthMap = {
        'id': 80,
        'Track_ID_before_jump': 150,
        'Track_ID_after_jump': 150,
        'KP_before_jump': 120,
        'KP_after_jump': 120,
        'Jump_length': 120,
        'Correction_applied_to_KP': 200,
        'Distance_from_track_origin_to_jump_point': 250
      }
      return minWidthMap[prop] || 100
    },
    
    /**
     * 判断单元格是否需要显示tooltip
     */
    shouldShowTooltip(value) {
      if (value === undefined || value === null || value === '') return false
      return String(value).length > 15
    },
    
    /**
     * 根据字段名判断是否禁用编辑
     */
    isFieldDisabled(prop) {
      // 这些字段是计算得出的，不允许手动编辑
      const disabledFields = [
        'id',
        'Track_ID_before_jump',
        'Jump_length', 
        'Correction_applied_to_KP', 
        'Distance_from_track_origin_to_jump_point'
      ]
      return disabledFields.includes(prop)
    },
    
    /**
     * 设置单元格样式
     */
    cellClassName({ column, row }) {
      const property = column.property
      
      // 使用警告样式检查函数来确定是否需要警告样式
      if (needsWarningStyle(row, property)) {
        return 'warning-cell'
      }
      
      // 处理禁用单元格
      if (this.isFieldDisabled(property)) {
        return 'disabled-cell'
      }
      
      // 为数值型单元格添加特定类名
      const numericColumns = ['Distance_from_track_origin_to_jump_point', 'Jump_length', 'Correction_applied_to_KP']
      if (numericColumns.includes(property)) {
        return 'numeric-cell'
      }
      
      // 确保ID列文字居中
      if (property === 'id') {
        return 'id-column'
      }
      
      return ''
    },
    
    /**
     * 更新所有计算数据
     * 当外部参数如Direction变化时调用此方法
     */
    updateAllCalculations() {
      this.updateAllTrackIdsBeforeJump()
      this.updateAllCorrectionValues()
      this.updateAllDistancesFromOrigin()
      
      // 发出数据变更通知
      this.$emit('data-modified')
    },
    
    /**
     * 更新所有行的Track_ID_before_jump
     */
    updateAllTrackIdsBeforeJump() {
      // 第一行特殊处理
      if (this.sheetData.data.length > 0) {
        const firstRow = this.sheetData.data[0]
        if (firstRow.Track_ID_after_jump) {
          firstRow.Track_ID_before_jump = firstRow.Track_ID_after_jump
        }
      }
      
      // 其他行的Track_ID_before_jump应该等于上一行的Track_ID_after_jump
      for (let i = 1; i < this.sheetData.data.length; i++) {
        const prevRow = this.sheetData.data[i - 1]
        const currentRow = this.sheetData.data[i]
        
        // 始终设置Track_ID_before_jump，无论上一行的Track_ID_after_jump是否为空
        currentRow.Track_ID_before_jump = prevRow.Track_ID_after_jump || ''
      }
    },
    
    /**
     * 更新所有行的Distance_from_track_origin_to_jump_point值
     */
    updateAllDistancesFromOrigin() {
      for (let i = 0; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        row.Distance_from_track_origin_to_jump_point = calculateDistanceFromOrigin(row, this.directionValue)
      }
    },
    
    /**
     * 处理输入变化
     */
    handleInputChange(prop, row, index) {
      // 通知父组件数据已修改
      this.$emit('data-modified')
      
      // 处理 Track_ID_after_jump 变化
      if (prop === 'Track_ID_after_jump') {
        // 更新第一行的情况
        if (index === 0) {
          // 第一行的Track_ID_before_jump等于自己的Track_ID_after_jump
          row.Track_ID_before_jump = row.Track_ID_after_jump
        }
        
        // 更新下一行的Track_ID_before_jump
        if (index < this.sheetData.data.length - 1) {
          const nextRow = this.sheetData.data[index + 1]
          nextRow.Track_ID_before_jump = row.Track_ID_after_jump
        }
      }
      
      // 处理 KP_before_jump 或 KP_after_jump 变化
      if (['KP_before_jump', 'KP_after_jump'].includes(prop)) {
        // 计算Jump length
        row.Jump_length = calculateJumpLength(row)
        
        // 更新所有行的Correction值
        this.updateAllCorrectionValues()
        
        // 更新当前行的Distance from origin值
        row.Distance_from_track_origin_to_jump_point = calculateDistanceFromOrigin(row, this.directionValue)
      }
      
      // 处理 Correction_applied_to_KP 变化
      if (prop === 'Correction_applied_to_KP') {
        row.Distance_from_track_origin_to_jump_point = calculateDistanceFromOrigin(row, this.directionValue)
      }
      
      // 当Track_ID_after_jump变化时也需要触发其他工作表更新
      if (prop === 'Track_ID_after_jump') {
        this.$emit('track-id-changed')
      }
      
      // 当其他可能影响计算的字段变化时触发更新
      if (['Track_ID_before_jump', 'Track_ID_after_jump', 'KP_before_jump', 'KP_after_jump', 'Correction_applied_to_KP'].includes(prop)) {
        this.$emit('calculation-fields-changed')
      }
    },
    
    /**
     * 更新所有行的Correction applied to KP值
     */
    updateAllCorrectionValues() {
      for (let i = 0; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        row.Correction_applied_to_KP = calculateCorrectionValue(this.sheetData.data, i)
        
        // 同时更新Distance from track origin值
        row.Distance_from_track_origin_to_jump_point = calculateDistanceFromOrigin(row, this.directionValue)
      }
    },
    
    /**
     * 处理插入行操作
     */
    handleInsertRow(index) {
      // 创建一个空白行
      const emptyRow = {}
      this.sheetData.headers.forEach(header => {
        emptyRow[header.prop] = ''
      })
      
      // 设置正确的自增ID
      const currentData = this.sheetData.data
      // 使用插入位置后一行的ID
      const insertID = index < currentData.length - 1 
        ? parseInt(currentData[index + 1].id) || 0 
        : (parseInt(currentData[index].id) || 0) + 1
      
      emptyRow.id = insertID
      
      // 将插入行后的所有行ID递增1
      for (let i = 0; i < currentData.length; i++) {
        if (i > index) {
          if (currentData[i].id !== undefined && currentData[i].id !== null && currentData[i].id !== '') {
            currentData[i].id = parseInt(currentData[i].id) + 1
          }
        }
      }
      
      // 获取上一行的Track_ID_after_jump值
      if (index >= 0 && index < this.sheetData.data.length) {
        const prevRow = this.sheetData.data[index]
        // 立即设置新行的Track_ID_before_jump
        emptyRow.Track_ID_before_jump = prevRow.Track_ID_after_jump || ''
      }
      
      // 插入新行
      this.sheetData.data.splice(index + 1, 0, emptyRow)
      
      // 更新插入行之后的所有行
      this.updateRowsAfterInsert(index + 1)
      
      // 还需要单独再次更新所有的Track_ID_before_jump，确保一致性
      this.updateAllTrackIdsBeforeJump()
      
      // 通知父组件数据已修改
      this.$emit('data-modified')
      this.$emit('row-added')
      
      this.$message.success(`已在第 ${index + 1} 行后插入新行`)
    },
    
    /**
     * 更新插入行后的所有行
     */
    updateRowsAfterInsert(startIndex) {
      // 更新后续行的Track_ID_before_jump
      for (let i = startIndex; i < this.sheetData.data.length - 1; i++) {
        const currentRow = this.sheetData.data[i]
        const nextRow = this.sheetData.data[i + 1]
        
        if (currentRow && nextRow) {
          // 无论当前值是否为空，都设置下一行的Track_ID_before_jump
          nextRow.Track_ID_before_jump = currentRow.Track_ID_after_jump || ''
        }
      }
      
      // 更新所有行的Jump length
      for (let i = 0; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        row.Jump_length = calculateJumpLength(row)
      }
      
      // 更新所有行的Correction值和Distance值
      this.updateAllCorrectionValues()
      this.updateAllDistancesFromOrigin()
    },
    
    /**
     * 处理删除行操作
     */
    handleDeleteRow(index) {
      this.$confirm('确认删除此行?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 从数组中删除该行
        this.sheetData.data.splice(index, 1)
        
        // 删除后重新分配ID
        this.sheetData.data.forEach((row, idx) => {
          row.id = idx + 1;
        });
        
        // 重新更新所有的Track_ID_before_jump
        this.updateAllTrackIdsBeforeJump()
        
        // 更新所有行的Correction值
        this.updateAllCorrectionValues()
        
        // 通知父组件数据已修改
        this.$emit('data-modified')
        this.$emit('row-deleted')
        
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

<style>
.cell-input {
  text-align: center;
}

.text-center >>> input {
  text-align: center;
}

.operation-buttons {
  display: flex;
  justify-content: space-around;
}

.warning-cell {
  background-color: transparent !important;
}

/* 使用全局样式确保优先级 */
.el-table .el-table__body tr .warning-cell {
  background-color: transparent !important;
}

/* 直接修改warning-cell中input元素的样式 */
.warning-cell .el-input .el-input__inner {
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
  text-align: center !important;
}

.disabled-cell {
  background-color: #f5f7fa !important;
  color: #909399 !important;
}

.numeric-cell {
  text-align: right !important;
}

/* 隐藏数字输入框的控制按钮 */
.tracks-sheet .el-input-number__decrease,
.tracks-sheet .el-input-number__increase {
  display: none !important;
}

/* 移除输入框右侧的内边距 */
.tracks-sheet .el-input-number .el-input__inner {
  padding-right: 10px !important;
}

/* 确保数值字段足够宽 */
.el-table .el-table__body td[class*=numeric-cell] {
  min-width: 120px;
}

/* 确保ID列文字居中 */
.el-table .el-table__body td:first-child .cell,
.el-table .el-table__body td[class*=id-column] .cell {
  text-align: center !important;
}

/* 确保禁用字段的数字居中 */
.disabled-cell .el-input .el-input__inner {
  text-align: center !important;
}
</style> 