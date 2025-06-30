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
export default {
  data() {
    return {
      excelFiles: {
        'track_down.xls': this.createDefaultSheets(),
        'track_down-80.xls': this.createDefaultSheets()
      },
      activeExcel: null,
      activeSheet: null,
      showNewExcelDialog: false,
      newExcelName: '',
      downloadLoading: false,
      showDeleteConfirm: false, // 控制删除确认弹窗显示
      deleteTarget: '' // 记录待删除文件名
    }
  },

  computed: {
    currentSheets() {
      return this.activeExcel ? this.excelFiles[this.activeExcel] : {}
    }
  },

  watch: {
  // 监听删除确认弹窗的显示状态
    showDeleteConfirm(val) {
      if (val) { // 当弹窗显示时
      // 将当前选中的Excel文件名设为待删除目标
        this.deleteTarget = this.activeExcel
      }
    }
  },

  methods: {
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

    // 初始化默认Sheet结构
    createDefaultSheets() {
      return {
        'Gen. Param.': {
          headers: [
            { prop: 'paramName', label: '参数名称' },
            { prop: 'value', label: '参数值' },
            { prop: 'description', label: '参数说明' }
          ],
          data: [
            { paramName: 'Direction', value: '-1', description: '1 if increasing KP, -1 if decreasing KP' },
            { paramName: 'Train length', value: '', description: '列车长度' }
          ]
        },
        'Tracks': {
          headers: [
            { prop: 'KP_before_jump', label: 'KP before jump(m)' },
            { prop: 'KP_after_jump', label: 'KP after jump(m)' },
            { prop: 'Track ID after jump', label: 'Track ID after jump' },
            { prop: 'Distance', label: 'Distance(m)' }
          ],
          data: []
        },
        'Gradient': {
          headers: [
            { prop: 'KP', label: 'KP (m)' },
            { prop: 'slope', label: 'Slope (%)' }
          ],
          data: []
        },
        'Station': {
          headers: [
            { prop: 'KP_of_platform_center', label: 'KP of platform center(m)' },
            { prop: 'Name_of_station', label: 'Name of station' },
            { prop: 'KP_of_SSP', label: 'KP of SSP(m)' }
          ],
          data: []
        },
        'PSR': {
          headers: [
            { prop: 'KP', label: 'KP(m)' },
            { prop: 'PSR', label: 'PSR (km/h)' }
          ],
          data: []
        },
        'Func.PSR': {
          headers: [
            { prop: 'Dist1', label: 'Dist1' },
            { prop: 'PSR1', label: 'PSR1' },
            { prop: 'Dist2', label: 'Dist2' },
            { prop: 'PSR2', label: 'PSR2' },
            { prop: 'Dist3', label: 'Dist3' },
            { prop: 'PSR3', label: 'PSR3' }
          ],
          data: []
        },
        'Safe Speed': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'speed', label: 'Speed (m/s)' }
          ],
          data: []
        },
        'Functional Speed': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Speed', label: 'Speed (m/s)' }
          ],
          data: []
        },
        'Limit Speed': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Speed', label: 'Speed (m/s)' }
          ],
          data: []
        },
        'Real gradient': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Gradient', label: 'Gradient' }
          ],
          data: []
        },
        'Compensated gradient': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Gradient', label: 'Gradient' }
          ],
          data: []
        },
        'adherence': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Tunnel', label: 'Tunnel' },
            { prop: 'Adherence', label: 'Adherence' }
          ],
          data: []
        },
        'correspondence (KP Track)': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'track_number', label: 'track number' },
            { prop: 'Kilometric_Point', label: 'Kilometric Point' },
            { prop: 'Sens_orientation', label: 'Sens / orientation' }
          ],
          data: []
        },
        'Unbridgeable gap': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Unbridgable_gap', label: 'Unbridgable_gap' }
          ],
          data: []
        },
        'Block Gradient': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Max_Gradient ', label: 'Max Gradient' }
          ],
          data: []
        },
        'beacon': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'beaconType', label: 'beaconType' }
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
