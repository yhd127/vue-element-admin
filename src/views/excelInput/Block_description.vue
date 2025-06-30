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
      <span>确定要删除文件 <strong>{{ deleteTarget }}</strong> 吗？</span>
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

    <!-- Sheet选择器 -->
    <div v-if="activeExcel" class="sheet-control">
      <div class="sheet-buttons-container">
        <div class="sheet-buttons">
          <el-button
            v-for="(sheet, name) in currentSheets"
            :key="name"
            :class="activeSheet === name ? 'active-sheet' : 'inactive-sheet'"
            round
            @click="activeSheet = name"
          >
            {{ name }}
          </el-button>
        </div>
      </div>
      <el-button
        :disabled="!activeSheet"
        style="margin-left: 15px"
        @click="addNewRow"
      >新增行</el-button>
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

    <!-- 导出按钮 -->
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
      showDeleteConfirm: false,
      deleteTarget: ''
    }
  },

  computed: {
    currentSheets() {
      return this.activeExcel ? this.excelFiles[this.activeExcel] : {}
    }
  },

  watch: {
    showDeleteConfirm(val) {
      if (val) this.deleteTarget = this.activeExcel
    }
  },

  created() {
    const excelNames = Object.keys(this.excelFiles)
    if (excelNames.length > 0) {
      this.activeExcel = excelNames[0]
      const sheetNames = Object.keys(this.excelFiles[this.activeExcel])
      if (sheetNames.length > 0) {
        this.activeSheet = sheetNames[0]
      }
    }
  },

  methods: {
    confirmCreateExcel() {
      const fullName = `${this.newExcelName}.xls`
      if (this.excelFiles[fullName]) {
        this.$message.error('文件名已存在')
        return
      }

      this.$set(this.excelFiles, fullName, this.createDefaultSheets())
      this.activeExcel = fullName
      this.activeSheet = Object.keys(this.createDefaultSheets())[0]
      this.showNewExcelDialog = false
      this.newExcelName = ''
    },

    confirmDelete() {
      this.$delete(this.excelFiles, this.deleteTarget)
      if (this.activeExcel === this.deleteTarget) {
        const files = Object.keys(this.excelFiles)
        this.activeExcel = files.length ? files[0] : null
        this.activeSheet = this.activeExcel
          ? Object.keys(this.excelFiles[this.activeExcel])[0] : null
      }
      this.showDeleteConfirm = false
    },

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

    addNewRow() {
      const sheet = this.currentSheets[this.activeSheet]
      const newRow = sheet.headers.reduce((row, h) => {
        row[h.prop] = ''
        return row
      }, {})
      sheet.data.push(newRow)
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
          ...sheet.data.map(row => sheet.headers.map(h => row[h.prop]))
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
  position: sticky;
  top: 0;
  background: white;
  z-index: 1000;
  padding: 15px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin: 15px 0;
  display: flex;
  align-items: center;
}

.sheet-buttons-container {
  flex: 1;
  overflow-x: auto;
}

.sheet-buttons {
  display: flex;
  gap: 8px;
  padding: 0 10px;
}

.active-sheet {
  background: #409EFF !important;
  color: white !important;
  border-color: #409EFF !important;
}

.inactive-sheet {
  background: white;
  transition: all 0.3s;
}

.inactive-sheet:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.export-control {
  margin-top: 20px;
  text-align: center;
}

/* 隐藏滚动条 */
.sheet-buttons-container::-webkit-scrollbar {
  display: none;
}
</style>
