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

    <!-- 删除Excel确认弹窗 -->
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

    <!-- 新增Sheet弹窗 -->
    <el-dialog
      title="新建Sheet"
      :visible.sync="showNewSheetDialog"
      width="30%"
    >
      <el-form>
        <el-form-item label="Sheet名称" required>
          <el-input
            v-model="newSheetName"
            placeholder="请输入Sheet名称"
            clearable
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showNewSheetDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!newSheetName"
          @click="addNewSheet"
        >确认</el-button>
      </span>
    </el-dialog>

    <!-- 重命名Sheet弹窗 -->
    <div class="app-container">
      <el-dialog
        title="重命名Sheet"
        :visible.sync="showRenameSheetDialog"
        width="30%"
      >
        <el-form>
          <el-form-item label="新名称" required>
            <el-input
              v-model="newSheetName"
              placeholder="请输入新名称"
              clearable
            />
          </el-form-item>
        </el-form>
        <span slot="footer">
          <el-button @click="showRenameSheetDialog = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!newSheetName"
            @click="confirmRenameSheet"
          >确认</el-button>
        </span>
      </el-dialog>

      <!-- 删除Sheet确认弹窗 -->
      <el-dialog
        title="删除Sheet确认"
        :visible.sync="showDeleteSheetConfirm"
        width="30%"
      >
        <span>确定要删除Sheet <strong>{{ activeSheet }}</strong> 吗？该操作不可恢复！</span>
        <span slot="footer">
          <el-button @click="showDeleteSheetConfirm = false">取消</el-button>
          <el-button
            type="danger"
            @click="confirmDeleteSheet"
          >确认删除</el-button>
        </span>
      </el-dialog>

      <!-- Sheet管理 -->
      <div v-if="activeExcel" class="sheet-control">

        <el-button @click="handleAddSheetClick">新增Sheet</el-button>
        <el-button :disabled="!activeSheet" @click="addNewRow">新增行</el-button>
        <el-button
          :disabled="!activeSheet"
          @click="showRenameSheetDialog = true"
        >重命名Sheet</el-button>
        <el-button
          :disabled="!activeSheet"
          type="danger"
          @click="showDeleteSheetConfirm = true"
        >删除Sheet</el-button>

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
  </div></template>

<script>
export default {

  data() {
    return {
      excelFiles: {
        'Station.xls': this.createDefaultSheets()
      },
      activeExcel: null,
      activeSheet: null,
      showNewExcelDialog: false,
      newExcelName: '',
      downloadLoading: false,
      showDeleteConfirm: false, // 控制删除确认弹窗显示
      deleteTarget: '', // 记录待删除文件名
      showRenameSheetDialog: false,
      newSheetName: '',
      showDeleteSheetConfirm: false,
      showNewSheetDialog: false
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
  // 新增created生命周期钩子
  created() {
    // 在组件创建时自动选择第一个Excel文件和第一个Sheet
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
            { prop: 'Station_Number', label: 'Station Number' },
            { prop: 'Station_Name', label: 'Station Name' }
          ],
          data: []
        }
      }
    },

    handleExcelChange() {
      this.activeSheet = Object.keys(this.currentSheets)[0]
    },

    // 点击新增Sheet按钮时触发
    handleAddSheetClick() {
      if (!this.activeExcel) {
        this.$message.warning('请先选择Excel文件')
        return
      }
      const sheets = Object.keys(this.currentSheets)
      if (sheets.length === 0) {
        this.$message.warning('当前文件没有可参考的Sheet')
        return
      }
      this.showNewSheetDialog = true
    },

    // 实际创建新Sheet的方法
    addNewSheet() {
      const newName = this.newSheetName.trim()
      if (!newName) {
        this.$message.error('Sheet名称不能为空')
        return
      }

      const sheets = this.excelFiles[this.activeExcel]
      if (sheets[newName]) {
        this.$message.error('Sheet名称已存在')
        return
      }

      // 动态获取第一个Sheet的headers结构
      const firstSheet = Object.values(sheets)[0]
      const clonedHeaders = JSON.parse(JSON.stringify(firstSheet.headers))

      this.$set(sheets, newName, {
        headers: clonedHeaders,
        data: []
      })

      this.activeSheet = newName
      this.showNewSheetDialog = false
      this.newSheetName = ''
    },

    addNewRow() {
      const currentSheet = this.currentSheets[this.activeSheet]
      const newRow = currentSheet.headers.reduce((row, header) => {
        row[header.prop] = ''
        return row
      }, {})
      currentSheet.data.push(newRow)
    },

    // 重命名Sheet逻辑
    confirmRenameSheet() {
      const newName = this.newSheetName.trim()
      if (!newName) {
        this.$message.error('新名称不能为空')
        return
      }

      const sheets = this.excelFiles[this.activeExcel]
      if (sheets[newName]) {
        this.$message.error('该名称已存在，请重新输入')
        return
      }

      // 创建新对象保持响应式
      const newSheets = { ...sheets }
      const currentData = newSheets[this.activeSheet]
      delete newSheets[this.activeSheet]
      newSheets[newName] = currentData

      this.$set(this.excelFiles, this.activeExcel, newSheets)
      this.activeSheet = newName
      this.showRenameSheetDialog = false
      this.newSheetName = ''
    },

    // 删除Sheet逻辑
    confirmDeleteSheet() {
      const sheets = { ...this.excelFiles[this.activeExcel] }
      delete sheets[this.activeSheet]

      this.$set(this.excelFiles, this.activeExcel, sheets)

      // 更新当前激活的Sheet
      const remainingSheets = Object.keys(sheets)
      this.activeSheet = remainingSheets.length > 0
        ? remainingSheets[0]
        : null

      this.showDeleteSheetConfirm = false
      this.$message.success('Sheet删除成功')
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
