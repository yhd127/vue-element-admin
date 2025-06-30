<template>
  <div class="psr-sheet">
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
  calculatePSRMs,
  initializePSRCalculations
} from '../calculations/psrCalculations'

export default {
  name: 'PSRSheet',
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
    },
    maxPSR: {
      type: [Number, String],
      default: 350
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
      initializePSRCalculations(
        this.sheetData.data,
        this.tracksData,
        Number(this.directionValue)
      )
    },
    
    cellClassName({ row, column }) {
      // 为计算字段添加不同的样式
      const calculatedFields = ['T1', 'T2', 'Track2', 'KP_correction', 'Distance', 'PSR_ms']
      
      // 标红和标蓝逻辑 - 为Track1字段
      if (column.property === 'Track1') {
        // 当T1和T2不相等（且都不为空）时，Track1标红
        if (row.T1 && row.T2 && row.T1 !== row.T2 && !row.Track1) {
          return 'warning-cell'
        }
        // 当Track1有值（填充了数字）且T1和T2不相等时，标蓝
        else if (row.Track1 && row.T1 && row.T2 && row.T1 !== row.T2) {
          return 'info-cell'
        }
      }
      
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
      const widthMap = {
        id: 80,
        T1: 80,
        T2: 80,
        Track1: 80,
        KP: 100,
        PSR: 100,
        Track2: 80,
        KP_correction: 120,
        Distance: 100,
        PSR_ms: 100
      }
      return widthMap[prop] || 100
    },
    
    shouldShowTooltip(value) {
      if (value === null || value === undefined || value === '') return false
      return String(value).length > 10
    },
    
    isFieldDisabled(prop) {
      // 这些字段是计算得出的，用户不能直接编辑
      const disabledFields = ['T1', 'T2', 'Track2', 'KP_correction', 'Distance', 'PSR_ms', 'id']
      return disabledFields.includes(prop)
    },
    
    handleInputChange(prop, row, index) {
      // 处理输入变化并计算相关字段
      if (prop === 'KP') {
        this.updateT1AndT2(row)
        this.updateTrack2(row)
        this.updateKPCorrection(row)
        this.updateDistance(row)
      }
      
      if (prop === 'PSR') {
        this.updatePSRMs(row)
      }
      
      if (prop === 'Track1') {
        this.updateTrack2(row)
        this.updateKPCorrection(row)
        this.updateDistance(row)
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
    
    updatePSRMs(row) {
      // 计算PSR_ms值
      row.PSR_ms = calculatePSRMs(row)
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

/* 警告样式 - 只对输入框内部应用红色背景 */
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

/* 信息样式 - 只对输入框内部应用蓝色背景 */
.info-cell {
  background-color: transparent !important;
}

/* 使用全局样式确保优先级 */
.el-table .el-table__body tr .info-cell {
  background-color: transparent !important;
}

/* 直接修改info-cell中input元素的样式 */
.info-cell .el-input .el-input__inner {
  background-color: #ecf5ff !important;
  color: #409eff !important;
  text-align: center !important;
}

.text-center >>> input {
  text-align: center;
}

/* 确保ID列文字居中 */
.el-table .el-table__body td:first-child .cell,
.el-table .el-table__body td[class*=id-column] .cell {
  text-align: center !important;
}

/* 确保ID列内部的输入框文字居中 */
.psr-sheet .el-table__body td:first-child .el-input .el-input__inner,
td.id-column .el-input .el-input__inner {
  text-align: center !important;
}

/* 确保禁用字段的数字居中 */
.calculated-cell .el-input .el-input__inner {
  text-align: center !important;
}
</style> 