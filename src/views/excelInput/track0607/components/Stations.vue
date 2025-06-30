<template>
  <div class="stations-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="id"
        label="ID"
        width="80"
      />
      <el-table-column
        prop="T1"
        label="T1"
        width="120"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.T1" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="T2"
        label="T2"
        width="120"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.T2" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Track1"
        label="Track"
        width="120"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.Track1" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="KP_of_platform_center"
        label="KP of platform center"
        width="180"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.KP_of_platform_center" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Name_of_station"
        label="Name of station"
        width="180"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.Name_of_station" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Track2"
        label="Track"
        width="120"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.Track2" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="KP_of_SSP"
        label="KP of SSP"
        width="120"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.KP_of_SSP" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="KP_correction"
        label="KP correction"
        width="150"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.KP_correction" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Distance_of_PF_center"
        label="Distance of PF center"
        width="180"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Distance_of_PF_center" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="Distance_of_SSP"
        label="Distance of SSP"
        width="150"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.Distance_of_SSP" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="200"
      >
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
  name: 'Stations',
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
          T1: '',
          T2: '',
          Track1: '1',
          KP_of_platform_center: '0',
          Name_of_station: '站点1',
          Track2: '1',
          KP_of_SSP: '0',
          KP_correction: '',
          Distance_of_PF_center: '0',
          Distance_of_SSP: '0'
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
      if (componentName !== 'Stations') return

      // 构造新行数据，包含默认值
      const newRow = {
        id: this.sheetData.length + 1,
        T1: rowData.T1 || '',
        T2: rowData.T2 || '',
        Track1: rowData.Track1 || '1',
        KP_of_platform_center: rowData.KP_of_platform_center || '0',
        Name_of_station: rowData.Name_of_station || '新站点',
        Track2: rowData.Track2 || '1',
        KP_of_SSP: rowData.KP_of_SSP || '0',
        KP_correction: rowData.KP_correction || '',
        Distance_of_PF_center: rowData.Distance_of_PF_center || '0',
        Distance_of_SSP: rowData.Distance_of_SSP || '0'
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
.stations-container {
  padding: 0;
}
</style>
