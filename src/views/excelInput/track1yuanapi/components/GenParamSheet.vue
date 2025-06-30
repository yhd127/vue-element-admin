<template>
  <div class="gen-param-sheet">
    <el-table
      :data="sheetData.data"
      border
      style="width: 100%; margin-top: 20px"
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
              @input="handleInputChange(header.prop, scope.row)"
            />
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'GenParamSheet',
  
  props: {
    // 工作表数据
    sheetData: {
      type: Object,
      required: true
    }
  },
  
  methods: {
    /**
     * 处理输入变化
     */
    handleInputChange(prop, row) {
      // 通知父组件数据已修改
      this.$emit('data-modified')
      
      // 检测特定参数的变化
      if (row.paramName === 'Direction') {
        // 方向参数变化时，触发更新
        this.$emit('direction-changed', row.value)
      } else if (row.paramName === 'Line speed') {
        // 线路速度变化时，触发更新
        this.$emit('line-speed-changed', row.value)
      } else if (row.paramName === 'Max PSR') {
        // 最大PSR值变化时，触发更新
        this.$emit('max-psr-changed', row.value)
      } else if (row.paramName === 'Train length') {
        // 列车长度变化时，触发更新
        this.$emit('train-length-changed', row.value)
      }
    },
    
    /**
     * 获取列的最小宽度
     */
    getColumnMinWidth(prop) {
      const widthMap = {
        paramName: 180,
        value: 120,
        description: 240
      }
      return widthMap[prop] || 120
    },
    
    /**
     * 判断是否应该显示tooltip
     */
    shouldShowTooltip(value) {
      if (value === null || value === undefined || value === '') return false
      return String(value).length > 10
    },
    
    /**
     * 判断字段是否应该禁用
     */
    isFieldDisabled(prop) {
      // paramName字段应该被禁用
      return prop === 'paramName'
    }
  }
}
</script>

<style scoped>
.cell-input {
  text-align: center;
}

.text-center >>> input {
  text-align: center;
}
</style> 