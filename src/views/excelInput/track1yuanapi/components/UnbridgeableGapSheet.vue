<template>
  <div class="unbridgeable-gap-container">
    <el-table
      :data="sheetData.data"
      style="width: 100%"
      border
      highlight-current-row
      :cell-class-name="cellClassName"
    >
      <el-table-column
        prop="id"
        label="ID"
        width="80"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.id"
            disabled
            size="small"
            class="cell-input text-center"
          />
        </template>
      </el-table-column>
      <el-table-column
        prop="Distance"
        label="Distance (m)"
        width="180"
        align="center"
      >
        <template slot-scope="scope">
          <el-tooltip :content="String(scope.row.Distance || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Distance)">
            <el-input-number
              v-model="scope.row.Distance"
              :controls="false"
              size="small"
              class="cell-input text-center"
              :precision="2"
              @change="handleInputChange('Distance', scope.row, scope.$index)"
            />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        prop="Unbridgable_gap"
        label="Unbridgable gap"
        width="150"
        align="center"
      >
        <template slot-scope="scope">
          <el-tooltip :content="String(scope.row.Unbridgable_gap || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Unbridgable_gap)">
            <el-input
              v-model="scope.row.Unbridgable_gap"
              size="small"
              class="cell-input text-center"
              @input="handleInputChange('Unbridgable_gap', scope.row, scope.$index)"
            />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="200"
        align="center"
      >
        <template slot-scope="scope">
          <div class="operation-buttons">
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
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'UnbridgeableGapSheet',
  props: {
    sheetData: {
      type: Object,
      required: true,
      default: () => ({
        headers: [],
        data: []
      })
    },
    activeSheet: {
      type: String,
      default: ''
    }
  },
  methods: {
    // 处理输入变化
    handleInputChange(field, row, index) {
      // 通知父组件数据已修改
      this.$emit('data-modified')
    },

    // 在表格中插入行的处理函数
    handleInsertRow(index) {
      // 通过事件通知父组件
      this.$emit('insert-row', index)
    },

    // 删除行
    handleDeleteRow(index) {
      // 通过事件通知父组件
      this.$emit('delete-row', index)
    },

    // 判断是否应该显示tooltip
    shouldShowTooltip(value) {
      if (value === undefined || value === null || value === '') {
        return false
      }
      const strValue = String(value)
      return strValue.length > 10
    },

    // 设置单元格样式
    cellClassName({ column, row }) {
      // ID列居中
      if (column.property === 'id') {
        return 'id-column'
      }
      return ''
    },

    // 重置计算值
    resetCalculations() {
      // 没有需要重置的计算值
    },

    // 更新所有计算
    updateAllCalculations() {
      // 没有需要更新的计算值
    }
  }
}
</script>

<style>
.unbridgeable-gap-container {
  padding: 0;
}

.cell-input {
  text-align: center;
}

.text-center >>> input {
  text-align: center;
}

/* 添加样式确保按钮在同一行 */
.operation-buttons {
  display: flex;
  justify-content: space-around;
}

/* 调整按钮尺寸 */
.el-button--mini {
  padding: 7px 10px;
  margin: 0 3px;
}

.unbridgeable-gap-container .el-input-number__decrease,
.unbridgeable-gap-container .el-input-number__increase {
  display: none !important;
}

/* 移除输入框右侧的内边距，通常是为控制按钮预留的 */
.unbridgeable-gap-container .el-input-number .el-input__inner {
  padding-right: 10px !important;
}

/* 确保ID列文字居中 - 增加选择器优先级 */
.unbridgeable-gap-container .el-table .el-table__body td.id-column .cell,
.unbridgeable-gap-container .el-table .el-table__body td:first-child .cell,
.el-table .el-table__body td[class*=id-column] .cell {
  text-align: center !important;
}

/* 确保ID列内部的输入框文字居中 */
.unbridgeable-gap-container .el-table .el-table__body td.id-column .el-input .el-input__inner,
.unbridgeable-gap-container .el-table .el-table__body td:first-child .el-input .el-input__inner {
  text-align: center !important;
}
</style>
