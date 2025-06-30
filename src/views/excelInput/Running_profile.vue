<template>
  <div class="app-container">
    <!-- 新建Excel弹窗 -->
    <el-dialog
      title="新建Excel文件"
      :visible.sync="showNewExcelDialog"
      width="30%"
    >
      <el-form>
        <el-form-item label="文件名" required>
          <el-input
            v-model="newExcelName"
            placeholder="请输入文件名（无需后缀）"
            clearable
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showNewExcelDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!newExcelName"
          @click="confirmCreateExcel"
        >确认</el-button>
      </span>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      title="删除确认"
      :visible.sync="showDeleteConfirm"
      width="30%"
    >
      <span>确定要删除文件 <strong>{{ deleteTarget }}</strong> 吗？该操作不可恢复！</span>
      <span slot="footer">
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button
          type="danger"
          @click="confirmDelete"
        >确认删除</el-button>
      </span>
    </el-dialog>

    <!-- Excel文件管理 -->
    <div class="excel-control">
      <el-button @click="showNewExcelDialog = true">新建Excel</el-button>
      <el-select
        v-model="activeExcel"
        placeholder="选择Excel文件"
        style="width: 300px; margin: 0 10px"
      >
        <el-option
          v-for="(excel, name) in excelFiles"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
      <el-button
        type="danger"
        :disabled="!activeExcel"
        @click="showDeleteConfirm = true"
      >删除当前文件</el-button>
    </div>

    <!-- Sheet管理 -->
    <div v-if="activeExcel" class="sheet-control">
      <el-button @click="addNewSheet">新增Sheet</el-button>
      <el-button :disabled="!activeSheet" @click="addNewRow">新增行</el-button>
      <el-select
        v-model="activeSheet"
        placeholder="请选择工作表"
      >
        <el-option
          v-for="(sheet, name) in currentSheets"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
    </div>

    <!-- 动态表格 -->
    <div
      v-for="(sheet, name) in currentSheets"
      v-show="activeSheet === name"
      :key="name"
    >
      <el-table
        :data="sheet.data"
        border
        style="width: 100%; margin-top: 20px"
      >
        <el-table-column
          v-for="(header, index) in sheet.headers"
          :key="index"
          :prop="header.prop"
          :label="header.label"
        >
          <template #default="scope">
            <el-input
              v-model="scope.row[header.prop]"
              placeholder="请输入内容"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              size="mini"
              type="danger"
              @click="handleDeleteRow(scope.$index)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 导出控制 -->
    <div v-if="activeExcel" class="export-control">
      <el-button
        :loading="downloadLoading"
        type="primary"
        @click="handleDownload"
      >
        导出当前Excel
      </el-button>
    </div>
  </div>
</template>

<script>
// 导入xlsx库用于Excel操作
import XLSX from 'xlsx'

export default {
  data() {
    // 初始化空的数据结构
    const initialExcelFiles = {
      'running_profile.xls': {
        'Running list': {
          headers: [
            { prop: 'Departure_Station_name', label: 'Departure Station name' },
            { prop: 'Departure_Station_Distance', label: 'Departure Station Distance' },
            { prop: 'Arrival_Station_name', label: 'Arrival Station name' },
            { prop: 'Arrival_Station_Distance', label: 'Arrival Station Distance' },
            { prop: 'Track', label: 'Track' },
            { prop: 'Train', label: 'Train' },
            { prop: 'train_load', label: 'train load [0 1]' },
            { prop: 'Performance_objective', label: 'Performance objective' },
            { prop: 'Safe_Visibility', label: 'Safe Visibility' },
            { prop: 'functionnal_Visibility', label: 'functionnal Visibility' },
            { prop: 'Perf', label: 'Perf' },
            { prop: 'Limit_Visibility', label: 'Limit Visibility' },
            { prop: 'Profile_Type_1', label: 'Profile Type 1' },
            { prop: 'Running_profile_1', label: 'Running profile 1' }
          ],
          data: []
        }
      }
    }
    
    return {
      excelFiles: initialExcelFiles,
      activeExcel: 'running_profile.xls',
      activeSheet: 'Running list',
      showNewExcelDialog: false,
      newExcelName: '',
      downloadLoading: false,
      showDeleteConfirm: false,
      deleteTarget: ''
    }
  },

  created() {
    // 在组件创建时加载JSON数据
    this.loadJsonData()
  },

  computed: {
    currentSheets() {
      return this.activeExcel ? this.excelFiles[this.activeExcel] : {}
    }
  },

  watch: {
    showDeleteConfirm(val) {
      if (val) {
        this.deleteTarget = this.activeExcel
      }
    }
  },

  methods: {
    // 添加加载JSON数据的方法
    async loadJsonData() {
      try {
        const response = await fetch('/data/Running_profile/running_profile.json')
        if (!response.ok) {
          throw new Error('Failed to load JSON data')
        }
        const jsonData = await response.json()
        
        // 转换数据格式
        const convertedData = jsonData.map(item => ({
          Departure_Station_name: item.start_node,
          Departure_Station_Distance: item.start_value,
          Arrival_Station_name: item.end_node,
          Arrival_Station_Distance: item.end_value,
          Track: item.track_file,
          Train: item.train_file,
          train_load: item.load,
          Performance_objective: '',
          Safe_Visibility: '',
          functionnal_Visibility: '',
          Perf: '',
          Limit_Visibility: '',
          Profile_Type_1: '',
          Running_profile_1: ''
        }))
        
        // 更新组件数据
        this.$set(this.excelFiles['running_profile.xls']['Running list'], 'data', convertedData)
        this.$message.success('数据加载成功')
      } catch (error) {
        console.error('加载JSON数据失败:', error)
        this.$message.error(`加载JSON数据失败: ${error.message}`)
      }
    },

    // 创建新Excel文件
    confirmCreateExcel() {
      const fullName = `${this.newExcelName}.xls`

      if (this.excelFiles[fullName]) {
        this.$message.error('文件名已存在，请重新命名')
        return
      }

      this.$set(this.excelFiles, fullName, this.createDefaultSheets())
      this.activeExcel = fullName
      this.activeSheet = Object.keys(this.createDefaultSheets())[0]
      this.showNewExcelDialog = false
      this.newExcelName = ''
    },

    // 删除当前Excel文件
    confirmDelete() {
      try {
        // 执行删除操作
        this.$delete(this.excelFiles, this.deleteTarget)

        // 更新当前选中状态
        if (this.activeExcel === this.deleteTarget) {
          const files = Object.keys(this.excelFiles)
          this.activeExcel = files.length ? files[0] : null
          this.activeSheet = this.activeExcel
            ? Object.keys(this.excelFiles[this.activeExcel])[0]
            : null
        }

        this.showDeleteConfirm = false
        this.$message.success('文件删除成功')
      } catch (error) {
        this.$message.error('删除失败: ' + error.message)
      }
    },

    // 初始化默认Sheet结构 (保留方法，但在初始化时不会调用)
    createDefaultSheets() {
      return {
        'Running list': {
          headers: [
            { prop: 'Departure_Station_name', label: 'Departure Station name' },
            { prop: 'Departure_Station_Distance', label: 'Departure Station Distance' },
            { prop: 'Arrival_Station_name', label: 'Arrival Station name' },
            { prop: 'Arrival_Station_Distance', label: 'Arrival Station Distance' },
            { prop: 'Track', label: 'Track' },
            { prop: 'Train', label: 'Train' },
            { prop: 'train_load', label: 'train load [0 1]' },
            // 可以保留其他字段，但不会显示在主要表头
            { prop: 'Performance_objective', label: 'Performance objective' },
            { prop: 'Safe_Visibility', label: 'Safe Visibility' },
            { prop: 'functionnal_Visibility', label: 'functionnal Visibility' },
            { prop: 'Perf', label: 'Perf' },
            { prop: 'Limit_Visibility', label: 'Limit Visibility' },
            { prop: 'Profile_Type_1', label: 'Profile Type 1' },
            { prop: 'Running_profile_1', label: 'Running profile 1' }
          ],
          data: []
        }
      }
    },

    handleExcelChange() {
      this.activeSheet = Object.keys(this.currentSheets)[0]
    },

    addNewSheet() {
      const sheets = this.excelFiles[this.activeExcel]
      const sheetName = `Sheet${Object.keys(sheets).length + 1}`

      this.$set(sheets, sheetName, {
        headers: [
          { prop: 'default1', label: '默认字段1' },
          { prop: 'default2', label: '默认字段2' }
        ],
        data: []
      })
      this.activeSheet = sheetName
    },

    addNewRow() {
      const currentSheet = this.currentSheets[this.activeSheet]
      const newRow = currentSheet.headers.reduce((row, header) => {
        row[header.prop] = ''
        return row
      }, {})
      currentSheet.data.push(newRow)
    },

    handleDeleteRow(index) {
      this.currentSheets[this.activeSheet].data.splice(index, 1)
    },

    async handleDownload() {
      this.downloadLoading = true
      const excel = await import('@/vendor/Export2Excel')

      const sheets = Object.entries(this.currentSheets).map(([name, sheet]) => ({
        name,
        data: [
          sheet.headers.map(h => h.label),
          ...sheet.data.map(row =>
            sheet.headers.map(h => row[h.prop])
          )
        ]
      }))

      excel.export_json_to_multiple_sheet({
        sheets,
        filename: this.activeExcel.replace('.xls', ''),
        autoWidth: true,
        bookType: 'xlsx'
      })

      this.downloadLoading = false
      
      // 保存JSON数据
      try {
        const sheetData = this.currentSheets['Running list'].data
        const jsonData = sheetData.map(row => {
          return {
            start_node: row.Departure_Station_name,
            start_value: row.Departure_Station_Distance,
            end_node: row.Arrival_Station_name,
            end_value: row.Arrival_Station_Distance,
            track_file: row.Track,
            train_file: row.Train,
            load: row.train_load,
            sequence: 1
          }
        })
        
        // 创建一个Blob对象
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        // 创建一个下载链接
        const link = document.createElement('a')
        link.href = url
        link.download = `${this.activeExcel.replace('.xls', '')}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
      } catch (error) {
        console.error('保存JSON数据失败:', error)
        this.$message.error(`保存JSON数据失败: ${error.message}`)
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.excel-control {
  margin-bottom: 20px;
}
.sheet-control {
  margin: 15px 0;
}
.export-control {
  margin-top: 20px;
}
.el-select {
  margin-left: 10px;
  width: 250px;
}
</style>
