<template>
  <div class="gen-param-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="paramName"
        label="参数名称"
        width="180">
        <template slot-scope="scope">
          <el-input v-model="scope.row.paramName" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="value"
        label="值"
        width="180">
        <template slot-scope="scope">
          <el-input-number v-if="isNumber(scope.row.value)" v-model.number="scope.row.value" :controls="false" size="small" />
          <el-input v-else v-model="scope.row.value" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="描述">
        <template slot-scope="scope">
          <el-input v-model="scope.row.description" size="small" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'GenParam',
  props: {
    activeSheet: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      sheetData: [
        { paramName: 'Direction', value: '1', description: '轨道方向' },
        { paramName: 'Line speed', value: '80', description: '线路速度' }
      ]
    }
  },
  methods: {
    // 判断值是否为数字
    isNumber(value) {
      return !isNaN(parseFloat(value)) && isFinite(value)
    }
  }
}
</script>

<style scoped>
.gen-param-container {
  padding: 0;
}
</style> 