<template>
  <div class="import-export-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>数据导入/导出</span>
      </div>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <div slot="header">
              <span>导入数据</span>
            </div>
            <div class="import-section">
              <el-radio-group v-model="importType" size="small" style="margin-bottom: 15px;">
                <el-radio-button label="json">JSON文件</el-radio-button>
                <el-radio-button label="excel">Excel文件</el-radio-button>
              </el-radio-group>
              
              <el-upload
                class="upload-area"
                :action="'#'"
                :auto-upload="false"
                :show-file-list="true"
                :limit="1"
                :on-change="handleFileChange"
                :on-exceed="handleExceed"
                :on-remove="handleRemove"
                :file-list="fileList"
                drag
              >
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">
                  拖拽文件到此处，或<em>点击上传</em>
                </div>
                <div class="el-upload__tip" slot="tip">
                  {{ importType === 'json' ? '只能上传JSON文件' : '只能上传Excel文件(.xlsx, .xls)' }}
                </div>
              </el-upload>
              
              <div class="button-area">
                <el-button 
                  type="primary" 
                  size="small"
                  :disabled="!selectedFile"
                  @click="importData"
                >
                  导入数据
                </el-button>
                <el-button 
                  size="small"
                  @click="resetImport"
                >
                  重置
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card shadow="hover">
            <div slot="header">
              <span>导出数据</span>
            </div>
            <div class="export-section">
              <el-radio-group v-model="exportType" size="small" style="margin-bottom: 15px;">
                <el-radio-button label="json">JSON文件</el-radio-button>
                <el-radio-button label="excel">Excel文件</el-radio-button>
              </el-radio-group>
              
              <el-form :model="exportForm" label-width="100px" size="small">
                <el-form-item label="文件名称">
                  <el-input 
                    v-model="exportForm.fileName" 
                    placeholder="请输入文件名称"
                  />
                </el-form-item>
                
                <el-form-item label="导出内容">
                  <el-checkbox-group v-model="exportForm.tables">
                    <el-checkbox 
                      v-for="table in availableTables" 
                      :key="table.value" 
                      :label="table.value"
                    >
                      {{ table.label }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
              
              <div class="button-area">
                <el-button 
                  type="primary" 
                  size="small"
                  :disabled="!canExport"
                  @click="exportData"
                >
                  导出数据
                </el-button>
                <el-button 
                  size="small"
                  @click="resetExport"
                >
                  重置
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import { parseExcelToJson, exportJsonToExcel, parseJsonFile, exportJsonToFile, isExcelFile, isJsonFile } from '@/utils/track/fileUtils'
import { deepClone } from '@/utils/track/commonUtils'

export default {
  name: 'DataImportExport',
  props: {
    availableTables: {
      type: Array,
      required: true
    },
    dataSource: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      importType: 'json',
      exportType: 'json',
      selectedFile: null,
      fileList: [],
      exportForm: {
        fileName: 'track_data_' + new Date().getTime(),
        tables: []
      }
    }
  },
  computed: {
    canExport() {
      return this.exportForm.fileName && this.exportForm.tables.length > 0
    }
  },
  methods: {
    handleFileChange(file) {
      // 检查文件类型是否符合当前选择的导入类型
      const isValidType = this.importType === 'json' 
        ? isJsonFile(file.name)
        : isExcelFile(file.name)
      
      if (!isValidType) {
        const fileType = this.importType === 'json' ? 'JSON' : 'Excel'
        this.$message.error(`请上传${fileType}文件！`)
        this.fileList = []
        this.selectedFile = null
        return
      }
      
      this.selectedFile = file
    },
    handleExceed() {
      this.$message.warning('只能上传一个文件')
    },
    handleRemove() {
      this.selectedFile = null
    },
    async importData() {
      if (!this.selectedFile) {
        this.$message.warning('请先选择文件')
        return
      }
      
      try {
        this.$emit('import-start')
        
        let importedData = null
        
        if (this.importType === 'json') {
          importedData = await parseJsonFile(this.selectedFile.raw)
        } else {
          importedData = await parseExcelToJson(this.selectedFile.raw)
        }
        
        // 发送导入成功事件
        this.$emit('import-success', importedData)
        
        this.$message.success('数据导入成功')
        this.resetImport()
      } catch (error) {
        console.error('导入数据失败:', error)
        this.$emit('import-error', error)
        this.$message.error(`导入失败: ${error.message}`)
      } finally {
        this.$emit('import-end')
      }
    },
    exportData() {
      if (!this.canExport) {
        this.$message.warning('请先填写文件名和选择要导出的表')
        return
      }
      
      try {
        this.$emit('export-start')
        
        // 准备要导出的数据
        const exportData = {}
        
        this.exportForm.tables.forEach(tableKey => {
          // 如果该表数据存在，则添加到导出数据中
          if (this.dataSource[tableKey]) {
            exportData[tableKey] = deepClone(this.dataSource[tableKey])
          }
        })
        
        if (Object.keys(exportData).length === 0) {
          this.$message.warning('没有可导出的数据')
          return
        }
        
        // 根据选择的导出类型执行导出
        if (this.exportType === 'json') {
          exportJsonToFile(exportData, this.exportForm.fileName)
        } else {
          exportJsonToExcel(exportData, this.exportForm.fileName)
        }
        
        // 发送导出成功事件
        this.$emit('export-success', {
          type: this.exportType,
          fileName: this.exportForm.fileName,
          tables: this.exportForm.tables
        })
        
        this.$message.success('数据导出成功')
      } catch (error) {
        console.error('导出数据失败:', error)
        this.$emit('export-error', error)
        this.$message.error(`导出失败: ${error.message}`)
      } finally {
        this.$emit('export-end')
      }
    },
    resetImport() {
      this.selectedFile = null
      this.fileList = []
    },
    resetExport() {
      this.exportForm.fileName = 'track_data_' + new Date().getTime()
      this.exportForm.tables = []
    }
  }
}
</script>

<style scoped>
.import-export-container {
  margin-bottom: 20px;
}
.import-section, .export-section {
  display: flex;
  flex-direction: column;
}
.upload-area {
  width: 100%;
  margin-bottom: 15px;
}
.button-area {
  margin-top: 15px;
  text-align: right;
}
</style> 