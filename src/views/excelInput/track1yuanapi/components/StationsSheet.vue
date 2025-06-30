<template>
  <div class="stations-sheet">
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
  calculateKPOfSSP,
  calculateT1, 
  calculateT2, 
  calculateTrack1,
  calculateTrack2, 
  calculateKPCorrection, 
  calculateDistanceOfPFCenter, 
  calculateDistanceOfSSP,
  initializeStationsCalculations
} from '../calculations/stationsCalculations'

export default {
  name: 'StationsSheet',
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
    trainLength: {
      type: [Number, String],
      default: 0
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
      initializeStationsCalculations(
        this.sheetData.data,
        this.tracksData,
        Number(this.directionValue),
        Number(this.trainLength)
      )
    },
    
    cellClassName({ column, row }) {
      const { property } = column
      
      // 高亮Track1字段且T1和T2不相等时
      if (property === 'Track1' && row.T1 && row.T2 && row.T1 !== row.T2) {
        if (!row.Track1) {
          return 'warning-cell'
        } else {
          return 'info-cell'
        }
      }
      
      // 禁用字段样式
      if (this.isFieldDisabled(property)) {
        return 'calculated-cell'
      }
      
      // ID列居中
      if (property === 'id') {
        return 'id-column'
      }
      
      return ''
    },
    
    getColumnMinWidth(prop) {
      const minWidthMap = {
        'id': 80,
        'T1': 80,
        'T2': 80,
        'Track1': 80,
        'KP_of_platform_center': 150,
        'Name_of_station': 150,
        'Track2': 80,
        'KP_of_SSP': 120,
        'KP_correction': 120,
        'Distance_of_PF_center': 150,
        'Distance_of_SSP': 150
      }
      return minWidthMap[prop] || 100
    },
    
    shouldShowTooltip(value) {
      if (value === null || value === undefined || value === '') return false
      return String(value).length > 10
    },
    
    isFieldDisabled(prop) {
      // 这些字段是计算得出的，用户不能直接编辑
      const disabledFields = ['T1', 'T2', 'Track2', 'KP_correction', 'KP_of_SSP', 'Distance_of_PF_center', 'Distance_of_SSP', 'id']
      return disabledFields.includes(prop)
    },
    
    handleInputChange(prop, row, index) {
      // 处理输入变化并计算相关字段
      if (prop === 'KP' || prop === 'Platform_length') {
        // 先计算KP_of_SSP
        row.KP_of_SSP = calculateKPOfSSP(row, Number(this.directionValue), Number(this.trainLength))
        
        // 更新T1和T2
        this.updateT1(index)
        this.updateT2(index)
        
        // 更新Track2
        this.updateTrack2(index)
        
        // 更新KP_correction
        this.updateKPCorrection(index)
        
        // 更新Distances
        this.updateDistanceOfPFCenter(index)
        this.updateDistanceOfSSP(index)
      }
      
      if (prop === 'Station_track') {
        this.updateTrack2(index)
        this.updateKPCorrection(index)
        this.updateDistanceOfPFCenter(index)
        this.updateDistanceOfSSP(index)
      }
      
      // 当Track1变化时，更新计算链
      if (prop === 'Track1') {
        // 先更新Track2
        this.updateTrack2(index)
        
        // 确保KP_of_SSP已计算（如果需要重新计算）
        const row = this.sheetData.data[index]
        if (!row.KP_of_SSP) {
          row.KP_of_SSP = calculateKPOfSSP(row, Number(this.directionValue), Number(this.trainLength))
        }
        
        // 然后更新KP_correction和距离字段
        this.updateKPCorrection(index)
        this.updateDistanceOfPFCenter(index)
        this.updateDistanceOfSSP(index)
      }
      
      // 发出数据修改事件
      this.$emit('data-modified')
    },
    
    updateT1(index) {
      const row = this.sheetData.data[index]
      row.T1 = calculateT1(row, this.tracksData, Number(this.directionValue))
    },
    
    updateT2(index) {
      const row = this.sheetData.data[index]
      row.T2 = calculateT2(row, this.tracksData, Number(this.directionValue))
    },
    
    updateTrack2(index) {
      const row = this.sheetData.data[index]
      row.Track2 = calculateTrack2(row)
    },
    
    updateKPCorrection(index) {
      const row = this.sheetData.data[index]
      row.KP_correction = calculateKPCorrection(row, this.tracksData, Number(this.directionValue))
    },
    
    updateDistanceOfPFCenter(index) {
      const row = this.sheetData.data[index]
      row.Distance_of_PF_center = calculateDistanceOfPFCenter(row, Number(this.directionValue))
    },
    
    updateDistanceOfSSP(index) {
      const row = this.sheetData.data[index]
      row.Distance_of_SSP = calculateDistanceOfSSP(row, Number(this.directionValue))
    },
    
    // 更新所有行的Distance值
    updateAllDistances() {
      if (!this.sheetData || !this.sheetData.data) return
      
      for (let i = 0; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        row.Distance_of_PF_center = calculateDistanceOfPFCenter(row, Number(this.directionValue))
        row.Distance_of_SSP = calculateDistanceOfSSP(row, Number(this.directionValue))
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

/* 清除之前的样式 */
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

/* 确保禁用字段的数字居中 */
.calculated-cell .el-input .el-input__inner {
  text-align: center !important;
}
</style> 