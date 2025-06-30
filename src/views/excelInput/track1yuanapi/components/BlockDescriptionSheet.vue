<template>
  <div class="block-description-sheet">
    <el-table
      :data="sheetData.data"
      border
      style="width: 100%; margin-top: 20px"
      :cell-class-name="cellClassName"
    >
      <!-- 常规列 -->
      <el-table-column
        v-for="header in regularColumns"
        :key="header.prop"
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

      <!-- Sub Block 分组 -->
      <el-table-column label="Sub Block" align="center">
        <el-table-column
          prop="SubBlock_Start"
          label="Start_KP"
          :min-width="getColumnMinWidth('SubBlock_Start')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.SubBlock_Start || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_Start)">
              <el-input
                v-model="scope.row.SubBlock_Start"
                :placeholder="isFieldDisabled('SubBlock_Start') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('SubBlock_Start')"
                class="cell-input text-center"
                @input="handleInputChange('SubBlock_Start', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="SubBlock_End"
          label="End"
          :min-width="getColumnMinWidth('SubBlock_End')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.SubBlock_End || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_End)">
              <el-input
                v-model="scope.row.SubBlock_End"
                :placeholder="isFieldDisabled('SubBlock_End') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('SubBlock_End')"
                class="cell-input text-center"
                @input="handleInputChange('SubBlock_End', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="Track2"
          label="Track2"
          :min-width="getColumnMinWidth('Track2')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.Track2 || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Track2)">
              <el-input
                v-model="scope.row.Track2"
                :placeholder="isFieldDisabled('Track2') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('Track2')"
                class="cell-input text-center"
                @input="handleInputChange('Track2', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="KP_correction"
          label="KP correction"
          :min-width="getColumnMinWidth('KP_correction')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.KP_correction || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.KP_correction)">
              <el-input
                v-model="scope.row.KP_correction"
                :placeholder="isFieldDisabled('KP_correction') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('KP_correction')"
                class="cell-input text-center"
                @input="handleInputChange('KP_correction', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="SubBlock_StartDistance"
          label="Start distance"
          :min-width="getColumnMinWidth('SubBlock_StartDistance')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.SubBlock_StartDistance || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_StartDistance)">
              <el-input
                v-model="scope.row.SubBlock_StartDistance"
                :placeholder="isFieldDisabled('SubBlock_StartDistance') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('SubBlock_StartDistance')"
                class="cell-input text-center"
                @input="handleInputChange('SubBlock_StartDistance', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="SubBlock_Track"
          label="Track"
          :min-width="getColumnMinWidth('SubBlock_Track')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.SubBlock_Track || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_Track)">
              <el-input
                v-model="scope.row.SubBlock_Track"
                :placeholder="isFieldDisabled('SubBlock_Track') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('SubBlock_Track')"
                class="cell-input text-center"
                @input="handleInputChange('SubBlock_Track', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table-column>

      <!-- overlap分组 -->
      <el-table-column label="overlap" align="center">
        <el-table-column
          prop="Overlap_Value"
          label="Value"
          :min-width="getColumnMinWidth('Overlap_Value')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.Overlap_Value || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Overlap_Value)">
              <el-input
                v-model="scope.row.Overlap_Value"
                :placeholder="isFieldDisabled('Overlap_Value') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('Overlap_Value')"
                class="cell-input text-center"
                @input="handleInputChange('Overlap_Value', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="Overlap_Track"
          label="Track"
          :min-width="getColumnMinWidth('Overlap_Track')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.Overlap_Track || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Overlap_Track)">
              <el-input
                v-model="scope.row.Overlap_Track"
                :placeholder="isFieldDisabled('Overlap_Track') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('Overlap_Track')"
                class="cell-input text-center"
                @input="handleInputChange('Overlap_Track', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="Overlap_Sens"
          label="Sens"
          :min-width="getColumnMinWidth('Overlap_Sens')"
          align="center"
        >
          <template #default="scope">
            <el-tooltip :content="String(scope.row.Overlap_Sens || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Overlap_Sens)">
              <el-input
                v-model="scope.row.Overlap_Sens"
                :placeholder="isFieldDisabled('Overlap_Sens') ? '' : '请输入内容'"
                :disabled="isFieldDisabled('Overlap_Sens')"
                class="cell-input text-center"
                @input="handleInputChange('Overlap_Sens', scope.row, scope.$index)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table-column>

      <!-- 操作列 -->
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
export default {
  name: 'BlockDescriptionSheet',
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
  
  computed: {
    regularColumns() {
      return this.sheetData.headers.filter(header => 
        !header.prop.startsWith('SubBlock_') && 
        !header.prop.startsWith('Overlap_') &&
        !['Track2', 'KP_correction'].includes(header.prop)
      )
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
      
      // 为每一行更新计算字段
      for (let i = 0; i < this.sheetData.data.length; i++) {
        this.updateStartT1(i)
        this.updateStartT2(i)
        this.updateTrack2(i)
        this.updateKPCorrection(i)
        this.updateStartDistance(i)
      }
    },
    
    cellClassName({ column, row }) {
      // 为计算字段添加不同的样式
      const calculatedFields = ['Start_T1', 'Start_T2', 'Track2', 'KP_correction', 'SubBlock_StartDistance']
      
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
        'Start_T1': 100,
        'Start_T2': 100,
        'Start_Track': 100,
        'Rule': 80,
        'Timer': 80,
        'SubBlock_Start': 120,
        'SubBlock_End': 80,
        'Track2': 80,
        'KP_correction': 100,
        'SubBlock_StartDistance': 120,
        'SubBlock_Track': 80,
        'Overlap_Value': 80,
        'Overlap_Track': 80,
        'Overlap_Sens': 80
      }
      return minWidthMap[prop] || 100
    },
    
    shouldShowTooltip(value) {
      if (value === null || value === undefined || value === '') return false
      return String(value).length > 10
    },
    
    isFieldDisabled(prop) {
      // 这些字段是计算得出的，用户不能直接编辑
      const disabledFields = ['Start_T1', 'Start_T2', 'Track2', 'KP_correction', 'SubBlock_StartDistance', 'id']
      return disabledFields.includes(prop)
    },
    
    handleInputChange(prop, row, index) {
      // 处理输入变化并计算相关字段
      if (prop === 'SubBlock_Start') {
        this.updateStartT1(index)
        this.updateStartT2(index)
        this.updateTrack2(index)
        this.updateKPCorrection(index)
        this.updateStartDistance(index)
      }
      
      if (prop === 'SubBlock_Track') {
        this.updateKPCorrection(index)
        this.updateStartDistance(index)
      }
      
      if (prop === 'Start_Track') {
        this.updateTrack2(index)
        // Track2更新后，需要更新依赖于Track2的其他字段
        this.updateKPCorrection(index)
        this.updateStartDistance(index)
      }
      
      // 发出数据修改事件
      this.$emit('data-modified')
    },
    
    // 找到Tracks表中匹配指定KP的行索引
    findMatchIndexInTracks(columnName, numericValue, tracksData, dir) {
      let matchIndex = -1
      
      // 根据dir的值决定查找方式
      if (dir === 1) {
        // dir=1时，假设数据是升序排列，查找小于等于numericValue的最大值
        for (let i = 0; i < tracksData.length; i++) {
          const rawValue = tracksData[i][columnName]
          
          // 跳过空行或值为空字符串的行
          if (rawValue === '' || rawValue === undefined) {
            continue
          }
          
          const rowValue = Number(rawValue) || 0
          if (rowValue <= numericValue) {
            matchIndex = i
          } else {
            break // 一旦找到大于numericValue的值就停止
          }
        }
      } else {
        // dir=-1时，假设数据是降序排列，查找大于等于numericValue的最小值
        for (let i = 0; i < tracksData.length; i++) {
          const rawValue = tracksData[i][columnName]
          
          // 跳过空行或值为空字符串的行
          if (rawValue === '' || rawValue === undefined) {
            continue
          }
          
          const rowValue = Number(rawValue) || 0
          if (rowValue >= numericValue) {
            matchIndex = i
          } else {
            break // 一旦找到小于numericValue的值就停止
          }
        }
      }
      
      return matchIndex
    },
    
    // 根据SubBlock_Start(Start_KP)在Tracks表中找到对应的Track_ID_before_jump
    updateStartT1(index) {
      if (!this.sheetData || !this.sheetData.data) return
      
      const currentRow = this.sheetData.data[index]
      const startKp = currentRow.SubBlock_Start  // Start_KP字段
      
      // 获取Direction值
      let dir = Number(this.directionValue) || 1
      
      // 获取Tracks表数据
      const tracksData = this.tracksData || []
      if (tracksData.length === 0 || startKp === '' || startKp === undefined) {
        currentRow.Start_T1 = ''
        return
      }
      
      // 应用公式：=IF($Start_KP="","",IF(INDEX(Tracks!C:C,MATCH($Start_KP,Tracks!C:C,dir))=$Start_KP,INDEX(Tracks!B:B,MATCH($Start_KP,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($Start_KP,Tracks!C:C,dir)+1)))
      
      const numericKP = Number(startKp)
      // 在Tracks表中查找匹配的KP before jump
      const matchIndex = this.findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)
      
      if (matchIndex === -1) {
        currentRow.Start_T1 = ''
        return
      }
      
      // 检查找到的值是否与startKP完全匹配
      const matchedKP = Number(tracksData[matchIndex].KP_before_jump) || 0
      if (matchedKP === numericKP) {
        // 完全匹配，返回当前行的Track_ID_before_jump
        currentRow.Start_T1 = tracksData[matchIndex].Track_ID_before_jump
      } else {
        // 不完全匹配，使用下一行的Track_ID_before_jump
        if (matchIndex + 1 < tracksData.length) {
          currentRow.Start_T1 = tracksData[matchIndex + 1].Track_ID_before_jump
        } else {
          currentRow.Start_T1 = tracksData[matchIndex].Track_ID_before_jump
        }
      }
    },
    
    // 根据SubBlock_Start(Start_KP)在Tracks表中找到对应的Track_ID_after_jump
    updateStartT2(index) {
      if (!this.sheetData || !this.sheetData.data) return
      
      const currentRow = this.sheetData.data[index]
      const startKp = currentRow.SubBlock_Start  // Start_KP字段
      
      // 获取Direction值
      let dir = Number(this.directionValue) || 1
      
      // 获取Tracks表数据
      const tracksData = this.tracksData || []
      if (tracksData.length === 0 || startKp === '' || startKp === undefined) {
        currentRow.Start_T2 = ''
        return
      }
      
      // 应用公式：=IF($Start_KP="","",INDEX(Tracks!E:E,MATCH($Start_KP,Tracks!D:D,dir)))
      // D列是KP after jump (m)，E列是Track ID after jump
      
      const numericKP = Number(startKp)
      // 在Tracks表中查找匹配的KP after jump
      const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)
      
      if (matchIndex === -1) {
        currentRow.Start_T2 = ''
        return
      }
      
      // 返回对应行的Track_ID_after_jump
      currentRow.Start_T2 = tracksData[matchIndex].Track_ID_after_jump
    },
    
    // 根据Start_T1, Start_T2和Start_Track计算Track2
    updateTrack2(index) {
      if (!this.sheetData || !this.sheetData.data) return
      
      const currentRow = this.sheetData.data[index]
      const startT1 = currentRow.Start_T1
      const startT2 = currentRow.Start_T2
      const startTrack = currentRow.Start_Track
      
      // 应用公式: =IF(AND(D3="",B3=C3),B3,IF(D3="","",D3))
      // D3=Start_Track, B3=Start_T1, C3=Start_T2
      
      // 第一层判断：如果Start_Track为空且Start_T1等于Start_T2
      if ((!startTrack || startTrack === '') && startT1 === startT2) {
        // 返回Start_T1的值
        currentRow.Track2 = startT1
      }
      // 第二层判断：如果Start_Track为空
      else if (!startTrack || startTrack === '') {
        // 返回空值
        currentRow.Track2 = ''
      }
      // 否则返回Start_Track的值
      else {
        currentRow.Track2 = startTrack
      }
    },
    
    // 根据SubBlock_Start和SubBlock_Track计算KP_correction
    updateKPCorrection(index) {
      if (!this.sheetData || !this.sheetData.data) return
      
      const currentRow = this.sheetData.data[index]
      const startKP = currentRow.SubBlock_Start  // G列: SubBlock_Start
      const trackValue = currentRow.SubBlock_Track  // I列: SubBlock_Track
      const track2Value = currentRow.Track2  // 考虑Track2值
      
      // 如果Start-KP为空，返回空值
      if (!startKP || startKP === '') {
        currentRow.KP_correction = ''
        return
      }
      
      // 获取Direction值
      let dir = Number(this.directionValue) || 1
      
      // 获取Tracks表数据
      const tracksData = this.tracksData || []
      if (tracksData.length === 0) {
        currentRow.KP_correction = '#N/A'
        return
      }
      
      // 使用SubBlock_Track或Track2值进行查找
      const trackToUse = trackValue || track2Value
      
      // 如果没有可用的Track值，返回#N/A
      if (!trackToUse) {
        currentRow.KP_correction = '#N/A'
        return
      }
      
      // 核心匹配逻辑：在Tracks表的KP_after_jump列中查找匹配Start-KP的位置
      const numericKP = Number(startKP)
      const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)
      
      if (matchIndex === -1) {
        currentRow.KP_correction = '#N/A'
        return
      }
      
      // 三层判断逻辑：
      // 1. 检查匹配行的Track_ID_after_jump是否等于要使用的Track值
      if (tracksData[matchIndex].Track_ID_after_jump === trackToUse) {
        currentRow.KP_correction = tracksData[matchIndex].Correction_applied_to_KP
        return
      }
      
      // 2. 检查匹配行的下一行
      if (matchIndex + 1 < tracksData.length &&
          tracksData[matchIndex + 1].Track_ID_after_jump === trackToUse) {
        currentRow.KP_correction = tracksData[matchIndex + 1].Correction_applied_to_KP
        return
      }
      
      // 3. 检查匹配行的上一行
      if (matchIndex > 0 &&
          tracksData[matchIndex - 1].Track_ID_after_jump === trackToUse) {
        currentRow.KP_correction = tracksData[matchIndex - 1].Correction_applied_to_KP
        return
      }
      
      // 如果所有条件都不满足，返回#N/A
      currentRow.KP_correction = '#N/A'
    },
    
    // 根据SubBlock_Start和KP_correction计算Start distance
    updateStartDistance(index) {
      if (!this.sheetData || !this.sheetData.data) return
      
      const currentRow = this.sheetData.data[index]
      const startKP = currentRow.SubBlock_Start  // G列: SubBlock_Start
      const kpCorrection = currentRow.KP_correction  // J列: KP_correction
      
      // 获取Direction参数
      let dir = Number(this.directionValue) || 1
      
      // 应用公式: =IF(ISTEXT(G3),-100000,IF(G3="",MAX(100000,K3+1),(G3+J3)*dir))
      
      // 第一层判断：检查Start-KP是否为文本
      if (typeof startKP === 'string' && isNaN(Number(startKP)) && startKP !== '') {
        // 如果是文本且不是空字符串，返回-100000
        currentRow.SubBlock_StartDistance = -100000
        return
      }
      
      // 第二层判断：检查Start-KP是否为空
      if (!startKP || startKP === '') {
        // 获取上一行的Start distance + 1（如果存在）
        let maxValue = 100000
        if (index > 0) {
          const prevRow = this.sheetData.data[index - 1]
          const prevStartDistance = Number(prevRow.SubBlock_StartDistance)
          if (!isNaN(prevStartDistance)) {
            maxValue = Math.max(100000, prevStartDistance + 1)
          }
        }
        currentRow.SubBlock_StartDistance = maxValue
        return
      }
      
      // 最终计算：(Start-KP + KP correction) * dir
      // KP correction可能是#N/A或空值，需要处理
      let kpCorrectionValue = 0
      if (kpCorrection !== '#N/A' && kpCorrection !== '' && !isNaN(Number(kpCorrection))) {
        kpCorrectionValue = Number(kpCorrection)
      }
      
      // 计算结果
      const result = (Number(startKP) + kpCorrectionValue) * dir
      currentRow.SubBlock_StartDistance = !isNaN(result) ? result : 0
    },
    
    // 更新所有行的Distance值
    updateAllDistances() {
      if (!this.sheetData || !this.sheetData.data) return
      
      for (let i = 0; i < this.sheetData.data.length; i++) {
        this.updateStartDistance(i)
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
.block-description-sheet .el-table .el-table__body td.id-column .cell,
.block-description-sheet .el-table .el-table__body td:first-child .cell,
.el-table .el-table__body td[class*=id-column] .cell {
  text-align: center !important;
}

/* 确保ID列内部的输入框文字居中 */
.block-description-sheet .el-table .el-table__body td.id-column .el-input .el-input__inner,
.block-description-sheet .el-table .el-table__body td:first-child .el-input .el-input__inner {
  text-align: center !important;
}
</style> 