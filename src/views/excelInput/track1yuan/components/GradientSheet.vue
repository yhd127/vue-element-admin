<template>
  <div class="gradient-sheet">
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
  calculateT1, 
  calculateT2, 
  calculateTrack2, 
  calculateKPCorrection, 
  calculateDistance, 
  calculateSlopePermille,
  initializeGradientCalculations
} from '../calculations/gradientCalculations'

export default {
  name: 'GradientSheet',
  props: {
    sheetData: {
      type: Object,
      required: true
    },
    tracksData: {
      type: Array,
      default: () => []
    },
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
    directionValue() {
      this.updateAllDistances()
    },
    
    // 监听Tracks表数据变化
    tracksData: {
      handler() {
        this.initializeCalculatedValues()
      },
      deep: true
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
      
      // 使用集中初始化函数计算所有值
      initializeGradientCalculations(
        this.sheetData.data,
        this.tracksData,
        Number(this.directionValue)
      )
    },
    
    cellClassName({ column, row }) {
      // 为计算字段添加不同的样式
      const calculatedFields = ['T1', 'T2', 'Track2', 'KP_correction', 'Distance', 'Slope_permille']
      
      // ID列居中
      if (column.property === 'id') {
        return 'id-column'
      }
      
      if (calculatedFields.includes(column.property)) {
        return 'calculated-cell'
      }
      return ''
    },
    
    getColumnMinWidth(prop) {
      const minWidthMap = {
        'id': 80,
        'T1': 80,
        'T2': 80,
        'Track1': 80,
        'KP': 100,
        'slope': 100,
        'Track2': 80,
        'KP_correction': 120,
        'Distance': 100,
        'Slope_permille': 120
      }
      return minWidthMap[prop] || 100
    },
    
    shouldShowTooltip(value) {
      if (value === null || value === undefined || value === '') return false
      return String(value).length > 10
    },
    
    isFieldDisabled(prop) {
      // 这些字段是计算得出的，用户不能直接编辑
      const disabledFields = ['T1', 'T2', 'Track2', 'KP_correction', 'Distance', 'Slope_permille', 'id']
      return disabledFields.includes(prop)
    },
    
    handleInputChange(prop, row, index) {
      // 仅当KP或slope改变时进行计算
      if (prop === 'KP') {
        this.updateT1AndT2(row)
        this.updateTrack2(row)
        this.updateKPCorrection(row)
        this.updateDistance(row)
      }
      
      if (prop === 'Track1') {
        this.updateTrack2(row)
        this.updateKPCorrection(row)
        this.updateDistance(row)
      }
      
      if (prop === 'slope') {
        this.updateSlopePermille(row)
      }
      
      // 发出数据修改事件
      this.$emit('data-modified')
    },
    
    updateT1AndT2(row) {
      // 计算T1值
      row.T1 = calculateT1(row, this.tracksData, Number(this.directionValue))
      
      // 计算T2值
      row.T2 = calculateT2(row, this.tracksData, Number(this.directionValue))
    },
    
    updateTrack2(row) {
      // 计算Track2值
      row.Track2 = calculateTrack2(row)
    },
    
    updateKPCorrection(row) {
      // 计算KP_correction值
      row.KP_correction = calculateKPCorrection(row, this.tracksData, Number(this.directionValue))
    },
    
    updateDistance(row) {
      // 计算Distance值
      row.Distance = calculateDistance(row, Number(this.directionValue))
    },
    
    updateSlopePermille(row) {
      // 计算Slope_permille值
      row.Slope_permille = calculateSlopePermille(row)
    },
    
    // 更新所有行的Distance值
    updateAllDistances() {
      if (!this.sheetData || !this.sheetData.data) return
      
      for (let i = 0; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        row.Distance = calculateDistance(row, Number(this.directionValue))
      }
    },
    
    handleInsertRow(index) {
      // 通知父组件在指定位置插入新行
      this.$emit('insert-row', index)
    },
    
    handleDeleteRow(index) {
      // 通知父组件删除指定行
      this.$emit('delete-row', index)
    }
  }
}
</script>

<style>
.cell-input {
  text-align: center;
}

.calculated-cell {
  background-color: #f8f8f8;
}

.text-center >>> input {
  text-align: center;
}

/* 确保ID列文字居中 - 增加选择器优先级 */
.gradient-sheet .el-table .el-table__body td.id-column .cell,
.gradient-sheet .el-table .el-table__body td:first-child .cell,
.el-table .el-table__body td[class*=id-column] .cell {
  text-align: center !important;
}

/* 确保ID列内部的输入框文字居中 */
.gradient-sheet .el-table .el-table__body td.id-column .el-input .el-input__inner,
.gradient-sheet .el-table .el-table__body td:first-child .el-input .el-input__inner {
  text-align: center !important;
}
</style> 