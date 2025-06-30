轨道<template>
  <div class="app-container">
    <div class="sheet-control">
      <el-button @click="addNewSheet">新增Sheet</el-button>
      <el-button :disabled="!activeSheet" @click="addNewRow">新增行</el-button>
      <el-select v-model="activeSheet" placeholder="请选择工作表">
        <el-option
          v-for="(sheet, name) in sheets"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
    </div>

    <!-- 动态表格 -->
    <div v-for="(sheet, name) in sheets" v-show="activeSheet === name" :key="name">
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
          <template slot-scope="scope">
            <el-input
              v-model="scope.row[header.prop]"
              placeholder="请输入内容"
              @change="handleInputChange"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template slot-scope="scope">
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
    <div class="export-control">
      <FilenameOption v-model="filename" />
      <AutoWidthOption v-model="autoWidth" />
      <BookTypeOption v-model="bookType" />
      <el-button
        :loading="downloadLoading"
        type="primary"
        @click="handleDownload"
      >
        导出完整Excel
      </el-button>
    </div>
  </div>
</template>

<script>
import { parseTime } from '@/utils'
import FilenameOption from './components/FilenameOption'
import AutoWidthOption from './components/AutoWidthOption'
import BookTypeOption from './components/BookTypeOption'

export default {
  components: { FilenameOption, AutoWidthOption, BookTypeOption },
  data() {
    return {
      sheets: {
        '参数设置': {
          headers: [
            { prop: 'paramName', label: '参数名称' },
            { prop: 'value', label: '参数值' },
            { prop: 'description', label: '参数说明' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: [
            { paramName: 'Direction', value: '', description: '1 if increasing KP, -1 if decreasing KP' },
            { paramName: 'Train length', value: '', description: '列车长度' }
          ]
        },
        '轨道数据': {
          headers: [
            { prop: 'trackID', label: '轨道ID' },
            { prop: 'startKP', label: '起始KP' },
            { prop: 'endKP', label: '终止KP' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'Gradient': {
          headers: [
            { prop: 'KP', label: 'KP' },
            { prop: 'slope', label: '坡度（％）' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        '车站数据': {
          headers: [
            { prop: 'KPofPlatformCenter', label: '站中心里程' },
            { prop: 'NameofStation', label: '站台名称' },
            { prop: 'KPofSSP', label: '停车点里程' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        '限速': {
          headers: [
            { prop: 'KP', label: 'KP' },
            { prop: 'PSR', label: '限速（km/h）' },
            { prop: 'filename', label: '参数所属文件名' }
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
            { prop: 'PSR3', label: 'PSR3' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        '安全速度': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'speed', label: '速度（m/s）' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'functionalSpeed': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'speed', label: '速度（m/s）' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'limitSpeed': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'speed', label: '速度（m/s）' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'realGradient': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'gradient', label: 'gradient' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'compensatedGradient': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'gradient', label: 'gradient' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'adherence': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'tunnel', label: 'gradient' },
            { prop: 'adherence', label: 'adherence' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'correspondence': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'trackNum', label: 'trackNum' },
            { prop: 'kliometricPoint', label: 'kliometricPoint' },
            { prop: 'sensOrientation', label: 'sensOrientation' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'unbridgeableGap': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'unbridgeableGap', label: 'unbridgeableGap' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'blockGradient': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'maxGradient', label: 'maxGradient' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        },
        'beacon': {
          headers: [
            { prop: 'distance', label: 'distance' },
            { prop: 'beaconType', label: 'beaconType' },
            { prop: 'filename', label: '参数所属文件名' }
          ],
          data: []
        }
      },
      activeSheet: '参数设置',
      filename: '',
      autoWidth: true,
      bookType: 'xlsx',
      downloadLoading: false
    }
  },
  methods: {
    // 新增Sheet
    addNewSheet() {
      const sheetName = `Sheet${Object.keys(this.sheets).length + 1}`
      this.$set(this.sheets, sheetName, {
        headers: [],
        data: []
      })
      this.activeSheet = sheetName
    },

    // 新增行功能
    addNewRow() {
      if (!this.activeSheet) return
      const currentSheet = this.sheets[this.activeSheet]
      const newRow = currentSheet.headers.reduce((row, header) => {
        row[header.prop] = ''
        return row
      }, {})

      currentSheet.data.push(newRow)
    },
    // 删除行功能
    handleDeleteRow(index) {
      this.sheets[this.activeSheet].data.splice(index, 1)
    },

    // 自动保存（通过数据响应式实现）
    handleInputChange() {
      // 这里可以添加额外的保存逻辑，如自动保存到后台
      console.log('数据已自动保存')
    },

    // 导出功能保持不变
    async handleDownload() {
      this.downloadLoading = true
      const excel = await import('@/vendor/Export2Excel')

      const sheets = Object.entries(this.sheets).map(([sheetName, sheet]) => ({
        name: sheetName,
        data: [
          sheet.headers.map(h => h.label),
          ...sheet.data.map(row =>
            sheet.headers.map(h => row[h.prop])
          )
        ]
      }))

      excel.export_json_to_multiple_sheet({
        sheets,
        filename: this.filename,
        autoWidth: this.autoWidth,
        bookType: this.bookType
      })

      this.downloadLoading = false
    }
  }
}
</script>
