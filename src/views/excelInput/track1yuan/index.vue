<template>
  <div class="app-container">
    <!-- 返回按钮 -->
    <el-button
      style="margin-bottom: 15px"
      icon="el-icon-back"
      @click="goBack"
    >
      返回列表
    </el-button>

    <!-- 当前路径提示 -->
    <div v-if="selectedFile" class="current-path">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ selectedFile.displayName || selectedFile.file }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="activeFolder">{{ activeFolder }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="activeExcel">{{ activeExcel }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="activeSheet">{{ activeSheet }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="loading || apiLoading" class="loading-status">
      <i class="el-icon-loading" /> {{ apiLoading ? '正在处理API数据...' : '正在加载轨道数据...' }}
    </div>

    <!-- API同步状态 -->
    <el-alert
      v-if="syncStatus"
      :title="syncStatus"
      type="info"
      show-icon
      class="sync-status"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="loadError"
      title="数据加载错误"
      type="error"
      :description="loadError"
      show-icon
      class="error-alert"
    />

    <!-- 主体内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧侧边栏 -->
      <el-col :span="6">
        <Sidebar
          :active-menu-index="activeMenuIndex"
          :file-id="fileId"
          @menu-select="handleMenuSelect"
          @folder-click="handleFolderClick"
        />
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="18" class="right-panel">
        <div class="right-container">
          <!-- 按钮操作区域 -->
          <div class="excel-control">
            <!-- 显示Excel文件名 -->
            <div v-if="activeExcel" class="excel-header">
              <h3 class="excel-title">当前文件: {{ activeExcel }}</h3>
            </div>

            <!-- 操作按钮区域 -->
            <div v-if="activeFolder" class="button-group">
              <!-- 添加查看所有文件下拉菜单 -->
              <el-dropdown trigger="click" @command="handleExcelSelect">
                <el-button type="info">
                  查看所有文件 <i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-for="fileName in Object.keys(excelFiles)"
                    :key="fileName"
                    :command="fileName"
                    :disabled="fileName === activeExcel"
                  >
                    {{ fileName }}
                    <span v-if="fileName === 'api_data.xls'" style="color: #67C23A; margin-left: 5px;">[API]</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>

              <!-- Running_profile文件夹的按钮 -->
              <template v-if="isRunningProfileFile()">
                <el-button @click="showNewExcelDialog = true">新增文件版本</el-button>
                <el-button
                  type="danger"
                  :disabled="!activeExcel"
                  @click="showDeleteConfirm = true"
                >删除当前文件</el-button>
                <el-button
                  type="success"
                  :loading="apiLoading"
                  :disabled="!activeExcel || activeSheet !== 'Running list' || !dataModified"
                  @click="saveRunningProfileToAPI()"
                >
                  保存到后端
                </el-button>
              </template>

              <!-- Track文件夹的按钮 -->
              <template v-else>
                <el-button @click="showNewExcelDialog = true">新增版本</el-button>
                <el-button
                  type="danger"
                  :disabled="!activeExcel"
                  @click="showDeleteConfirm = true"
                >删除当前文件</el-button>
                <el-button
                  type="info"
                  icon="el-icon-back"
                  @click="backToFolderList"
                >
                  返回文件夹
                </el-button>
              </template>
            </div>
          </div>

          <!-- Sheet选择器 -->
          <div v-if="activeExcel" class="sheet-toolbar">
            <div class="toolbar-left">
              <span class="toolbar-label">选择工作表</span>
              <el-select
                v-model="activeSheet"
                placeholder="请选择工作表"
                size="small"
                class="sheet-select"
                @change="handleSheetChange"
              >
                <el-option
                  v-for="sheetName in getAvailableSheets()"
                  :key="sheetName"
                  :label="sheetName"
                  :value="sheetName"
                />
              </el-select>

              <el-dropdown
                v-if="isRunningProfileSheet(activeSheet)"
                trigger="click"
                @command="handleCalculateCommand"
              >
                <el-button type="warning" size="small" :loading="calculatingAllRows">
                  计算所有行 <i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="travelTime">计算通行时间</el-dropdown-item>
                  <el-dropdown-item command="minHeadway" :disabled="!globalTravelTimeCalculated">计算最小间隔时间</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>

              <el-button
                v-if="!isGenParamSheet(activeSheet)"
                size="small"
                type="primary"
                icon="el-icon-plus"
                class="insert-btn"
                @click="handleInsertLastRow"
              >末行插入</el-button>
            </div>
          </div>

          <!-- 在当前工作表选择器下方添加未选择文件夹时的提示 -->
          <div v-if="!activeExcel && !loading" class="empty-content">
            <i class="el-icon-folder-opened" />
            <p>请选择左侧的文件夹查看内容</p>
          </div>

          <!-- 动态表格区域 - 根据activeSheet动态加载不同的工作表组件 -->
          <div v-if="activeExcel && activeSheet">
            <!-- 使用不同的组件来显示不同的工作表 -->
            <GenParamSheet
              v-if="activeSheet === 'Gen. Param.' || activeSheet === '总体参数(Gen. Param.)'"
              :sheet-data="currentSheets[activeSheet]"
              @data-modified="handleDataModified"
              @direction-changed="handleDirectionChanged"
              @line-speed-changed="handleLineSpeedChanged"
              @max-psr-changed="handleMaxPsrChanged"
            />

            <TracksSheet
              v-else-if="activeSheet === 'Tracks' || activeSheet === '长短链(Tracks)'"
              ref="tracksSheet"
              :sheet-data="currentSheets[activeSheet]"
              :direction-value="getDirectionValue()"
              @data-modified="handleDataModified"
              @track-id-changed="handleTrackIdChanged"
              @calculation-fields-changed="handleCalculationFieldsChanged"
              @row-added="handleTrackRowAdded"
              @row-deleted="handleTrackRowAdded"
            />

            <GradientSheet
              v-else-if="activeSheet === 'Gradient' || activeSheet === '坡度(Gradient)'"
              ref="gradientSheet"
              :sheet-data="currentSheets[activeSheet]"
              :tracks-data="getTracksData()"
              :direction-value="getDirectionValue()"
              @data-modified="handleDataModified"
              @insert-row="handleInsertRow"
              @delete-row="handleDeleteRow"
            />

            <StationsSheet
              v-else-if="activeSheet === 'Stations' || activeSheet === '车站(Stations)'"
              ref="stationsSheet"
              :sheet-data="currentSheets[activeSheet]"
              :tracks-data="getTracksData()"
              :direction-value="getDirectionValue()"
              :train-length="getTrainLength()"
              @data-modified="handleDataModified"
              @insert-row="handleInsertRow"
              @delete-row="handleDeleteRow"
            />

            <PSRSheet
              v-else-if="activeSheet === 'PSR' || activeSheet === '线路限速(PSR)'"
              ref="psrSheet"
              :sheet-data="currentSheets[activeSheet]"
              :tracks-data="getTracksData()"
              :direction-value="getDirectionValue()"
              :max-psr="getMaxPSR()"
              @data-modified="handleDataModified"
              @insert-row="handleInsertRow"
              @delete-row="handleDeleteRow"
            />

            <BlockDescriptionSheet
              v-else-if="activeSheet === 'Block description' || activeSheet === '轨道区段(Block description)'"
              :sheet-data="currentSheets[activeSheet]"
              :tracks-data="getTracksData()"
              :direction-value="getDirectionValue()"
              @data-modified="handleDataModified"
              @insert-row="handleInsertRow"
              @delete-row="handleDeleteRow"
            />

            <RunningListSheet
              v-else-if="activeSheet === 'Running list'"
              ref="runningListSheet"
              :sheet-data="currentSheets[activeSheet]"
              :tracks-data="getTracksData()"
              :stations-data="getStationsData()"
              :direction-value="getDirectionValue()"
              :max-psr="getMaxPSR()"
              @data-modified="handleDataModified"
              @insert-row="handleInsertRow"
              @delete-row="handleDeleteRow"
              @view-detail="handleViewCalculationDetail"
            />

            <UnbridgeableGapSheet
              v-else-if="activeSheet === 'Unbridgeable gap' || activeSheet === '分相区(Unbridgeable gap)'"
              :sheet-data="currentSheets[activeSheet]"
              @data-modified="handleDataModified"
              @insert-row="handleInsertRow"
              @delete-row="handleDeleteRow"
            />

            <!-- 常规表格结构(用于未专门实现组件的其他工作表) -->
            <el-table
              v-else
              :data="currentSheets[activeSheet].data"
              border
              style="width: 100%; margin-top: 20px"
              :cell-class-name="cellClassName"
            >
              <el-table-column
                v-for="(header, index) in currentSheets[activeSheet].headers"
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
                      :placeholder="isFieldDisabled(header.prop, activeSheet) ? '' : '请输入内容'"
                      :disabled="isFieldDisabled(header.prop, activeSheet)"
                      class="cell-input text-center"
                      @input="handleInputChange(header.prop, scope.row, scope.$index)"
                    />
                  </el-tooltip>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="230" align="center">
                <template #default="scope">
                  <div class="operation-buttons">
                    <!-- 只在 Running list 工作表中显示计算按钮 -->
                    <el-button
                      v-if="isRunningProfileFile() && activeSheet === 'Running list'"
                      size="mini"
                      :type="getCalculationButtonType(scope.row)"
                      :loading="isCalculating(scope.row)"
                      @click="handleSingleRowCalculate(scope.row, scope.$index)"
                    >
                      {{ getCalculationButtonText(scope.row) }}
                    </el-button>
                    <el-button
                      size="mini"
                      type="primary"
                      icon="el-icon-plus"
                      class="insert-btn"
                      @click="handleInsertRow(scope.$index)"
                    >下行插入</el-button>
                    <el-button
                      size="mini"
                      type="danger"
                      @click="handleDeleteRow(scope.$index)"
                    >删除</el-button>
                  </div>
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
              保存
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 新建Excel弹窗 -->
    <NewExcelDialog
      :visible.sync="showNewExcelDialog"
      @confirm="confirmCreateExcel"
      @cancel="showNewExcelDialog = false"
    />

    <!-- 删除确认弹窗 -->
    <DeleteConfirmDialog
      :visible.sync="showDeleteConfirm"
      :delete-target="deleteTarget"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- 新增行表单对话框 -->
    <InsertRowDialog
      :visible.sync="showRowDialog"
      :headers="currentHeaders"
      :insert-position="insertPosition"
      @confirm="submitRowForm"
      @cancel="showRowDialog = false"
    />

    <!-- 计算功能对话框 -->
    <CalculationDetailDialog
      :visible.sync="calculationDialogVisible"
      :detail-data="detailData"
      @data-changed="handleDetailDataChanged"
      @recalculate="recalculateIntervals"
      @view-image="handleViewImage"
      @export-excel="handleExportExcel"
    />

    <!-- 图片预览对话框 -->
    <ImagePreviewDialog
      :visible.sync="imagePreviewVisible"
      :image-info="previewImageInfo"
    />
  </div>
</template>

<script>
import Sidebar from './sidebar.vue'
import GenParamSheet from './components/GenParamSheet'
import TracksSheet from './components/TracksSheet'
import GradientSheet from './components/GradientSheet'
import StationsSheet from './components/StationsSheet'
import PSRSheet from './components/PSRSheet'
import BlockDescriptionSheet from './components/BlockDescriptionSheet'
import RunningListSheet from './components/RunningListSheet'
import UnbridgeableGapSheet from './components/UnbridgeableGapSheet'
import NewExcelDialog from './dialogs/NewExcelDialog.vue'
import DeleteConfirmDialog from './dialogs/DeleteConfirmDialog.vue'
import InsertRowDialog from './dialogs/InsertRowDialog.vue'
import CalculationDetailDialog from './dialogs/CalculationDetailDialog.vue'
import ImagePreviewDialog from './dialogs/ImagePreviewDialog.vue'
import { createDefaultSheets, createRunningProfileSheets, transformJSONData, addAutoIncrementIds, downloadExcel, getInternalSheetName, getDisplaySheetName } from './utils/fileHandlers'

import {
  calculateTravelTime,
  calculateMinHeadway,
  calculateAllTravelTimes,
  calculateAllMinHeadways,
  formatDetailData
} from './utils/calculationHandlers'

import {
  calculateJumpLength,
  calculateCorrectionValue,
  calculateDistanceFromOrigin
} from './calculations/tracksCalculations'

// 导入文件夹管理服务
import {
  initFolderManager,
  getFolderTreeData,
  setFolderFiles,
  getFolderFiles,
  getAllFolderFiles,
  getAvailableSheetsByFolderId,
  getDefaultSheetByFolderId,
  parseMenuId
} from './services/folderManager'

import {
  folderConfig,
  getAllFolderIds,
  getFolderConfig
} from './config/folders'

export default {
  name: 'Track1',

  components: {
    Sidebar,
    GenParamSheet,
    TracksSheet,
    GradientSheet,
    StationsSheet,
    PSRSheet,
    BlockDescriptionSheet,
    RunningListSheet,
    UnbridgeableGapSheet,
    NewExcelDialog,
    DeleteConfirmDialog,
    InsertRowDialog,
    CalculationDetailDialog,
    ImagePreviewDialog
  },

  data() {
    return {
      // 数据状态
      loading: false,
      loadError: null,
      trackData: null,
      fileId: null,
      selectedFile: null,

      excelFiles: {},
      activeExcel: null,
      activeSheet: null,
      showNewExcelDialog: false,
      newExcelName: '',
      downloadLoading: false,
      showDeleteConfirm: false,
      deleteTarget: '',

      // 添加缺少的数据属性
      showRowDialog: false,
      currentHeaders: [],
      insertPosition: 0,

      // API相关
      apiLoading: false,
      dataModified: false,
      syncStatus: '',
      trackRecords: [],
      authToken: null,

      // 计算功能相关
      calculationDialogVisible: false,
      calculationState: {
        travelTime: {
          status: '',
          percentage: 0,
          enabled: true
        },
        minHeadway: {
          status: '',
          percentage: 0,
          enabled: false
        }
      },
      calculationResults: {
        travelTime: null,
        minHeadway: null
      },
      selectedCalculationRow: null,
      calculatedRows: {},
      calculatingAllRows: false,
      globalTravelTimeCalculated: false,
      detailData: {
        module1: {
          intervalTitle: '发车间隔',
          time1: '0',
          time2: '0',
          time3: '0',
          interval: '0'
        },
        module2: [
          {
            intervalTitle: '区间间隔',
            startPoint: '',
            endPoint: '',
            bottleneckPosition: '',
            clearPosition: '',
            dangerPosition: '',
            bottleneckToClearTime: '0',
            clearDelayTime: '0',
            sectionInterval: '0'
          }
        ],
        module3: {
          intervalTitle: '接车间隔',
          entranceBottleneck: '',
          stopPoint: '',
          platformStopTime: '0',
          frontTrainToClearTime: '0',
          clearDelayTime: '0',
          receiveTrainTime: '0',
          rearTrainToStopTime: '0',
          trainInterval: '0'
        }
      },
      imagePreviewVisible: false,
      previewImageInfo: null,
      showCalculation: false,

      // 文件夹和文件管理 - 使用文件夹管理服务初始化
      activeFolder: null,
      folderExcelFiles: [],
      activeMenuIndex: '',

      // 初始化示例文件数据
      folderExamples: {
        'Track': [
          { name: 'track_up.xls', displayName: 'track_up.xls' },
          { name: 'track_down.xls', displayName: 'track_down.xls' },
          { name: 'track_down-80.xls', displayName: 'track_down-80.xls' }
        ],
        'Running_profile': [
          { name: 'running_profile.xls', displayName: 'running_profile.xls' }
        ]
      }
    }
  },

  computed: {
    currentSheets() {
      if (!this.activeExcel || !this.excelFiles[this.activeExcel]) return {}

      // 获取原始工作表数据
      const originalSheets = this.excelFiles[this.activeExcel]

      // 创建一个新的对象，包含原始数据和映射后的数据
      const sheets = {}

      // 复制原始数据
      Object.keys(originalSheets).forEach(key => {
        sheets[key] = originalSheets[key]

        // 添加中文名称的映射
        const displayName = getDisplaySheetName(key)
        if (displayName !== key) {
          sheets[displayName] = originalSheets[key]
        }
      })

      return sheets
    },

    // 添加获取Direction值的计算属性
    directionValue() {
      const genParamKey = this.getGenParamKey()

      if (this.excelFiles[this.activeExcel] &&
          this.excelFiles[this.activeExcel][genParamKey]) {
        const directionParam = this.excelFiles[this.activeExcel][genParamKey].data.find(
          item => item.paramName === 'Direction'
        )
        return directionParam ? Number(directionParam.value) || 1 : 1
      }
      return 1
    }
  },

  watch: {
    showDeleteConfirm(val) {
      if (val) this.deleteTarget = this.activeExcel
    },

    // 添加对Direction值变化的监听
    directionValue(newVal, oldVal) {
      if (newVal !== oldVal) {
        // 当方向值变化时，更新所有依赖它的计算
        this.$nextTick(() => {
          // 更新Tracks表的计算
          if (this.$refs.tracksSheet) {
            this.$refs.tracksSheet.updateAllCalculations()
          }

          // 更新其他表的计算
          this.updateAllCalculations()
        })
      }
    },

    // 监听activeExcel变化
    activeExcel(newVal) {
      if (newVal) {
        const sheetNames = Object.keys(this.excelFiles[newVal] || {})
        // 获取第一个工作表的内部名称
        const firstSheetName = sheetNames.length > 0 ? sheetNames[0] : null
        // 将内部名称转换为显示名称
        this.activeSheet = firstSheetName ? getDisplaySheetName(firstSheetName) : null
      } else {
        this.activeSheet = null
      }
    },

    // 监听activeSheet变化
    activeSheet(newVal) {
      // 当切换到Tracks表时初始化Track_ID_before_jump
      if (newVal === 'Tracks' && this.activeExcel && this.excelFiles[this.activeExcel] &&
          this.excelFiles[this.activeExcel]['Tracks']) {
        this.$nextTick(() => {
          this.initializeTrackIDBeforeJump()
        })
      }
    }
  },

  created() {
    // 从路由参数获取文件ID
    this.fileId = this.$route.params.id

    // 从localStorage获取选择的文件信息
    const fileInfo = localStorage.getItem('selectedTrackFile')
    if (fileInfo) {
      this.selectedFile = JSON.parse(fileInfo)
      document.title = `Track详情 - ${this.selectedFile.displayName || this.selectedFile.file}`
    }

    // 初始化文件夹管理器
    this.initializeFolderManager()

    // 默认打开第一个文件夹
    const folderIds = getAllFolderIds()
    if (folderIds.length > 0) {
      this.activeMenuIndex = folderIds[0]
      this.activeFolder = folderIds[0]
    }
  },

  methods: {
    // 初始化文件夹管理器
    initializeFolderManager() {
      initFolderManager()

      // 设置文件夹示例数据
      Object.keys(this.folderExamples).forEach(folderId => {
        setFolderFiles(folderId, this.folderExamples[folderId])
      })
    },

    // 返回到列表页面
    goBack() {
      this.$router.push('/excelInput/project')
    },

    // 加载轨道数据 - 不再自动调用
    async loadTrackData() {
      if (!this.selectedFile) return

      this.loading = true
      this.loadError = null

      try {
        // 如果从列表页面直接选择了特定文件，准备文件夹但不自动加载文件
        if (this.selectedFile && this.selectedFile.file) {
          // 默认进入Track文件夹
          this.activeFolder = 'Track'
          this.folderExcelFiles = this.folderFiles['Track'] || []

          // 不自动加载文件，让用户从侧边栏选择
        }
      } catch (error) {
        this.loadError = `加载数据失败: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    // 加载特定Excel文件
    async loadExcelFile(excelName) {
      this.loading = true
      this.loadError = null

      try {
        // 转换文件名，从.xls变为.json
        const jsonFileName = excelName.replace('.xls', '.json')

        // 构建文件路径：/data/[文件夹名]/[文件名.json]
        const filePath = `/data/${this.activeFolder}/${jsonFileName}`

        const response = await fetch(filePath)
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`)
        }

        const rawData = await response.json()

        // 检查是否已经存在相同名称的Excel文件
        if (!this.excelFiles[excelName]) {
          // 根据当前文件夹类型选择不同的初始化函数
          if (this.activeFolder === 'Running_profile') {
            this.excelFiles[excelName] = createRunningProfileSheets()
          } else {
            this.excelFiles[excelName] = createDefaultSheets()
          }
        }

        // 设置当前活动的Excel文件
        this.activeExcel = excelName

        // 处理数据
        this.populateExcelData(rawData)

        this.trackData = rawData

        // 根据文件夹类型设置默认工作表
        const availableSheets = this.getAvailableSheets()
        // 找到第一个存在于currentSheets中的可用工作表
        for (const sheet of availableSheets) {
          const internalSheetName = getInternalSheetName(sheet)
          if (this.currentSheets[internalSheetName]) {
            this.activeSheet = sheet // 使用显示名称
            break
          }
        }

        // 重置数据修改标记
        this.dataModified = false
      } catch (error) {
        this.loadError = `加载数据失败: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    // 填充Excel数据
    populateExcelData(rawData) {
      if (rawData) {
        // 转换数据
        const transformedData = transformJSONData(rawData)

        // 填充到Excel文件中
        Object.keys(transformedData).forEach(sheetName => {
          if (this.excelFiles[this.activeExcel][sheetName]) {
            // 添加自增ID
            if (this.activeFolder === 'Track' && ['Tracks', 'Gradient', 'Stations', 'PSR', 'Block description', 'Unbridgeable gap'].includes(sheetName)) {
              transformedData[sheetName] = addAutoIncrementIds(transformedData[sheetName], sheetName)
            } else if (this.activeFolder === 'Running_profile' && sheetName === 'Running list') {
              transformedData[sheetName] = addAutoIncrementIds(transformedData[sheetName], sheetName)
            }

            this.excelFiles[this.activeExcel][sheetName].data = transformedData[sheetName]
          }
        })

        // 初始化Track_ID_before_jump
        if (this.activeFolder === 'Track' && this.excelFiles[this.activeExcel]['Tracks']) {
          this.initializeTrackIDBeforeJump()
        }
      }
    },

    // 初始化Track_ID_before_jump字段
    initializeTrackIDBeforeJump() {
      const tracksSheet = this.excelFiles[this.activeExcel]['Tracks']
      if (!tracksSheet || !tracksSheet.data || !Array.isArray(tracksSheet.data) || tracksSheet.data.length === 0) {
        return
      }

      const tracksData = tracksSheet.data

      // 第一行特殊处理
      const firstRow = tracksData[0]
      if (firstRow) {
        const trackIdAfterJump = firstRow.Track_ID_after_jump
        firstRow.Track_ID_before_jump = trackIdAfterJump || ''
      }

      // 其他行的Track_ID_before_jump等于上一行的Track_ID_after_jump
      for (let i = 1; i < tracksData.length; i++) {
        const prevRow = tracksData[i - 1]
        const currentRow = tracksData[i]

        const prevValue = prevRow.Track_ID_after_jump
        if (!prevValue) {
          currentRow.Track_ID_before_jump = ''
        } else {
          currentRow.Track_ID_before_jump = prevValue
        }
      }

      // 初始化其他计算字段
      this.initializeCalculatedFields(tracksData)
    },

    // 初始化Jump length、Correction和Distance字段
    initializeCalculatedFields(tracksData) {
      if (!tracksData || !Array.isArray(tracksData)) return

      // 首先计算所有Jump length
      for (let i = 0; i < tracksData.length; i++) {
        const row = tracksData[i]
        row.Jump_length = calculateJumpLength(row)
      }

      // 然后计算所有Correction applied to KP
      for (let i = 0; i < tracksData.length; i++) {
        const row = tracksData[i]
        row.Correction_applied_to_KP = calculateCorrectionValue(tracksData, i)
      }

      // 最后计算所有Distance from track origin to jump point
      const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
        item => item.paramName === 'Direction'
      )
      const directionValue = directionParam ? Number(directionParam.value) || 1 : 1

      for (let i = 0; i < tracksData.length; i++) {
        const row = tracksData[i]
        row.Distance_from_track_origin_to_jump_point = calculateDistanceFromOrigin(row, directionValue)
      }
    },

    // 从API获取轨道记录
    async fetchTrackRecords() {
      this.apiLoading = true
      this.syncStatus = '正在从API加载轨道数据...'

      try {
        const result = await fetchTrackRecords(this.selectedFile?.projectId || 1, 'down')

        if (result.success) {
          this.trackRecords = result.data
          this.syncStatus = result.message

          // 转换API数据到Excel格式
          const excelData = convertApiTrackDataToExcel(result.data)
          if (excelData) {
            this.$set(this.excelFiles, 'api_data.xls', {
              ...createDefaultSheets(),
              ...excelData
            })

            // 切换到新文件
            this.activeExcel = 'api_data.xls'
            this.activeSheet = 'Tracks'

            this.$message.success('数据已从API加载并创建api_data.xls文件')
          }

          // 数据加载完成后重置修改标记
          this.dataModified = false
        } else {
          this.syncStatus = result.message
          this.$message.error(result.message)
        }
      } catch (error) {
        this.syncStatus = `API数据加载失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 从API获取运行配置数据
    async getRunningProfileFromAPI() {
      this.apiLoading = true
      this.syncStatus = '正在从API加载运行配置数据...'

      try {
        const result = await getRunningProfileFromAPI(this.selectedFile?.projectId || 1)

        if (result.success) {
          this.syncStatus = result.message

          // 转换API数据到Excel格式
          const excelData = convertApiTrackDataToExcel(result.data)
          if (excelData) {
            const runningProfileSheets = {
              ...createRunningProfileSheets(),
              ...excelData
            }

            // 添加到excelFiles对象
            this.$set(this.excelFiles, 'api_running_profile.xls', runningProfileSheets)

            // 切换到新文件
            this.activeExcel = 'api_running_profile.xls'
            this.activeSheet = 'Running list'

            this.$message.success('数据已从API加载并创建api_running_profile.xls文件')
          }

          // 重置数据修改标记
          this.dataModified = false
        } else {
          this.syncStatus = result.message
          this.$message.error(result.message)
        }
      } catch (error) {
        this.syncStatus = `API数据加载失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 保存数据到API
    async saveTrackToApi() {
      if (!this.activeExcel || !this.activeSheet || this.activeSheet !== 'Tracks') {
        this.$message.warning('请先选择Tracks工作表')
        return
      }

      // 检查数据是否被修改
      if (!this.dataModified) {
        this.$message.info('未进行数据修改')
        return
      }

      this.apiLoading = true
      this.syncStatus = '正在保存数据到API...'

      try {
        const tracksData = this.currentSheets['Tracks'].data
        if (!tracksData || !Array.isArray(tracksData)) {
          throw new Error('无效的轨道数据')
        }

        const genParamSheet = this.excelFiles[this.activeExcel]['Gen. Param.']
        if (!genParamSheet || !genParamSheet.data) {
          throw new Error('无效的Gen. Param.数据')
        }

        const directionParam = genParamSheet.data.find(item => item && item.paramName === 'Direction')
        const directionValue = directionParam ? Number(directionParam.value) || 1 : 1

        // 保存数据
        const result = await saveTrackToApi(
          tracksData,
          this.selectedFile?.projectId || 1,
          directionValue
        )

        if (result.success) {
          // 成功保存后重置修改标记
          this.dataModified = false
          this.$message.success(result.message)
          this.syncStatus = result.message
        } else {
          this.$message.error(result.message)
          this.syncStatus = result.message
        }
      } catch (error) {
        this.syncStatus = `API数据保存失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 保存运行配置数据到API
    async saveRunningProfileToAPI() {
      if (!this.activeExcel || !this.activeSheet || this.activeSheet !== 'Running list') {
        this.$message.warning('请先选择Running list工作表')
        return
      }

      // 检查数据是否被修改
      if (!this.dataModified) {
        this.$message.info('未进行数据修改')
        return
      }

      this.apiLoading = true
      this.syncStatus = '正在保存运行配置数据到API...'

      try {
        const runningListData = this.currentSheets['Running list'].data
        if (!runningListData || !Array.isArray(runningListData)) {
          throw new Error('无效的运行配置数据')
        }

        // 保存数据
        const result = await saveTrackToApi(
          runningListData,
          this.selectedFile?.projectId || 1,
          this.directionValue
        )

        if (result.success) {
          // 成功保存后重置修改标记
          this.dataModified = false
          this.$message.success(result.message)
          this.syncStatus = result.message
        } else {
          this.$message.error(result.message)
          this.syncStatus = result.message
        }
      } catch (error) {
        this.syncStatus = `API数据保存失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 处理新建Excel
    confirmCreateExcel() {
      const fullName = `${this.newExcelName}.xls`
      if (this.excelFiles[fullName]) {
        this.$message.error('文件名已存在')
        return
      }

      // 根据当前文件夹类型选择不同的初始化函数
      if (this.activeFolder === 'Running_profile') {
        this.$set(this.excelFiles, fullName, createRunningProfileSheets())
      } else {
        this.$set(this.excelFiles, fullName, createDefaultSheets())
      }
      this.activeExcel = fullName

      // 默认选择第一个工作表
      const sheetNames = this.activeFolder === 'Running_profile'
        ? Object.keys(createRunningProfileSheets())
        : Object.keys(createDefaultSheets())
      this.activeSheet = sheetNames.length > 0 ? sheetNames[0] : null

      this.showNewExcelDialog = false
      this.newExcelName = ''
    },

    // 处理删除确认
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

    // 处理菜单选择
    handleMenuSelect(index) {
      // 使用解析函数分析选中的菜单ID
      const menuItem = parseMenuId(index)

      if (menuItem.type === 'folder') {
        // 如果是文件夹，显示文件夹内容
        this.activeFolder = menuItem.folderId
        this.folderExcelFiles = getFolderFiles(menuItem.folderId)
        this.activeMenuIndex = index

        // 清空当前选择
        this.activeExcel = null
        this.activeSheet = null
      } else if (menuItem.type === 'file') {
        // 如果是文件，加载该文件
        this.activeFolder = menuItem.folderId
        this.folderExcelFiles = getFolderFiles(menuItem.folderId)
        this.activeMenuIndex = index

        // 加载文件
        const fileName = menuItem.file.name
        this.loadExcelFile(fileName)
      }
    },

    // 处理文件夹点击事件
    handleFolderClick(folderId) {
      const folder = getFolderConfig(folderId)
      if (folder) {
        this.activeFolder = folderId
        this.activeExcel = null
        this.activeSheet = null
        this.folderExcelFiles = getFolderFiles(folderId)
      }
    },

    // 判断是否为Running_profile文件
    isRunningProfileFile() {
      return this.activeFolder === 'Running_profile'
    },

    // 获取可用的工作表
    getAvailableSheets() {
      if (!this.activeExcel || !this.excelFiles[this.activeExcel]) return []

      // 使用文件夹配置服务获取可用工作表
      if (this.activeFolder) {
        // 返回可用工作表列表（使用新的中文名称）
        return getAvailableSheetsByFolderId(this.activeFolder)
      }

      return []
    },

    // 判断是否是Running list工作表
    isRunningProfileSheet(sheetName) {
      return sheetName === 'Running list' || getInternalSheetName(sheetName) === 'Running list'
    },

    // 判断是否是Gen. Param.工作表
    isGenParamSheet(sheetName) {
      return sheetName === 'Gen. Param.' || getInternalSheetName(sheetName) === 'Gen. Param.' ||
             sheetName === '总体参数(Gen. Param.)'
    },

    // 处理工作表变更
    handleSheetChange(sheet) {
      // 将显示名称转换为内部名称
      const internalSheetName = getInternalSheetName(sheet)

      // 如果内部名称存在于数据结构中，使用显示名称
      if (this.excelFiles[this.activeExcel][internalSheetName]) {
        this.activeSheet = sheet
      } else {
        // 否则尝试使用原始名称
        this.activeSheet = sheet
      }

      console.log('Sheet changed to:', sheet, 'Internal name:', internalSheetName)
    },

    // 返回文件夹列表
    backToFolderList() {
      this.activeExcel = null
      this.activeSheet = null
    },

    // 处理下载/保存
    async handleDownload() {
      this.downloadLoading = true
      try {
        const result = await downloadExcel(this.currentSheets, this.activeExcel)
        if (result.success) {
          this.$message.success(result.message)
        } else {
          this.$message.error(result.message)
        }
      } catch (error) {
        this.$message.error(`下载失败: ${error.message}`)
      } finally {
        this.downloadLoading = false
      }
    },

    // 数据修改处理函数
    handleDataModified() {
      this.dataModified = true
    },

    // 处理Tracks表行添加或删除事件
    handleTrackRowAdded() {
      // 标记数据已修改
      this.dataModified = true

      // 只有在Track文件夹下才需要更新相关工作表
      if (this.activeFolder !== 'Track') return

      // 更新Gradient表的计算
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gradient']) {
        // 获取Gradient表数据
        const gradientData = this.excelFiles[this.activeExcel]['Gradient'].data
        if (gradientData && Array.isArray(gradientData)) {
          // 临时切换到Gradient表进行计算
          const originalSheet = this.activeSheet
          this.activeSheet = 'Gradient'

          // 更新所有Gradient行的计算字段
          for (let i = 0; i < gradientData.length; i++) {
            // 更新T1, T2值
            if (this.$refs.gradientSheet) {
              this.$refs.gradientSheet.updateT1(i)
              this.$refs.gradientSheet.updateT2(i)
              this.$refs.gradientSheet.updateTrack2(i)
              this.$refs.gradientSheet.updateKPCorrection(i)
              this.$refs.gradientSheet.updateDistance(i)
            }
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalSheet
        }
      }

      // 更新Stations表的计算
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Stations']) {
        // 获取Stations表数据
        const stationsData = this.excelFiles[this.activeExcel]['Stations'].data
        if (stationsData && Array.isArray(stationsData)) {
          // 临时切换到Stations表进行计算
          const originalSheet = this.activeSheet
          this.activeSheet = 'Stations'

          // 更新所有Stations行的计算字段
          for (let i = 0; i < stationsData.length; i++) {
            // 更新T1, T2值
            if (this.$refs.stationsSheet) {
              this.$refs.stationsSheet.updateT1(i)
              this.$refs.stationsSheet.updateT2(i)
              this.$refs.stationsSheet.updateTrack2(i)
              this.$refs.stationsSheet.updateKPCorrection(i)
              this.$refs.stationsSheet.updateDistanceOfPFCenter(i)
              this.$refs.stationsSheet.updateDistanceOfSSP(i)
            }
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalSheet
        }
      }

      // 更新PSR表的计算
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['PSR']) {
        // 获取PSR表数据
        const psrData = this.excelFiles[this.activeExcel]['PSR'].data
        if (psrData && Array.isArray(psrData)) {
          // 临时切换到PSR表进行计算
          const originalSheet = this.activeSheet
          this.activeSheet = 'PSR'

          // 更新所有PSR行的计算字段
          for (let i = 0; i < psrData.length; i++) {
            // 更新T1, T2值
            if (this.$refs.psrSheet) {
              this.$refs.psrSheet.updateT1(i)
              this.$refs.psrSheet.updateT2(i)
              this.$refs.psrSheet.updateTrack2(i)
              this.$refs.psrSheet.updateKPCorrection(i)
              this.$refs.psrSheet.updateDistance(i)
              this.$refs.psrSheet.updatePSRMs(i)
            }
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalSheet
        }
      }
    },

    // 处理Track ID变更事件
    handleTrackIdChanged() {
      // 当Track ID变更时，需要更新其他依赖的表格
      this.handleTrackRowAdded() // 复用相同的逻辑更新所有相关工作表
    },

    // 处理计算字段变更事件
    handleCalculationFieldsChanged() {
      // 当计算相关字段变更时，更新其他依赖的表格
      this.handleTrackRowAdded() // 复用相同的逻辑更新所有相关工作表
    },

    // 处理方向参数变更
    handleDirectionChanged(value) {
      // 更新Tracks表的Distance_from_track_origin_to_jump_point
      this.updateAllDistancesFromOrigin()

      // 更新Gradient表的所有计算字段
      this.updateAllGradientT1() // 更新T1
      this.updateAllGradientT2() // 更新T2
      this.updateAllGradientTrack2() // 更新Track2
      this.updateAllGradientKPCorrections() // 更新KP_correction
      this.updateAllGradientDistances() // 更新Distance

      // 更新Stations表的所有计算字段
      this.updateAllStationsFields()

      // 更新PSR表的T1和T2值
      this.updateAllPSRTValues()

      // 更新PSR表的Track2和PSR_ms值
      this.updateAllPSRTrack2AndPsrMs()

      // 更新PSR表的KP_correction和Distance值
      this.updateAllPSRKPCorrectionsAndDistances()

      // 显示提示
      this.$message.success(`方向值已更新为${value}，所有计算字段已重新计算`)
      this.handleDataModified()
    },

    // 处理最大PSR变更
    handleMaxPsrChanged(value) {
      // 更新PSR表的PSR_ms值
      this.updateAllPSRTrack2AndPsrMs()

      // 显示提示
      this.$message.success(`Max PSR值已更新为${value}，PSR表中的PSR_ms值已重新计算`)
      this.handleDataModified()
    },

    // 添加用于更新所有Tracks行的从轨道原点到跳跃点的距离
    updateAllDistancesFromOrigin() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Tracks) {
        const tracksRows = this.excelFiles[this.activeExcel].Tracks.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Tracks' // 临时设置为Tracks表以便计算

        for (let i = 0; i < tracksRows.length; i++) {
          // 更新各行的计算字段
          this.updateDistanceFromOrigin(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 更新单行的从轨道原点到跳跃点的距离
    updateDistanceFromOrigin(index) {
      if (this.activeSheet === 'Tracks' && this.currentSheets[this.activeSheet] && this.currentSheets[this.activeSheet].data) {
        const row = this.currentSheets[this.activeSheet].data[index]

        // 应用计算公式
        const kpAfterJump = Number(row.KP_after_jump) || 0
        const correctionAppliedToKP = Number(row.Correction_applied_to_KP) || 0
        const directionValue = this.getDirectionValue()

        row.Distance_from_track_origin_to_jump_point = (kpAfterJump + correctionAppliedToKP) * directionValue
      }
    },

    // 添加用于更新所有Gradient行的T1值的方法
    updateAllGradientT1() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientT1(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的T2值的方法
    updateAllGradientT2() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientT2(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的Track2值的方法
    updateAllGradientTrack2() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientTrack2(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的KP_correction值的方法
    updateAllGradientKPCorrections() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientKPCorrection(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的Distance值的方法
    updateAllGradientDistances() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientDistance(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 单行更新Gradient的T1
    updateGradientT1(index) {
      if (this.activeSheet === 'Gradient' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const tracksData = this.excelFiles[this.activeExcel].Tracks ? this.excelFiles[this.activeExcel].Tracks.data : []

        // 应用T1计算逻辑
        const kpValue = Number(row.KP) || 0
        const direction = this.getDirectionValue()

        // 查找适当的Track ID
        let foundTrackID = null
        for (let i = 0; i < tracksData.length; i++) {
          const track = tracksData[i]
          const kpAfterJump = Number(track.KP_after_jump) || 0
          const correctionAppliedToKP = Number(track.Correction_applied_to_KP) || 0
          const distanceFromOrigin = (kpAfterJump + correctionAppliedToKP) * direction

          // 根据方向判断KP是否在范围内
          if ((direction > 0 && kpValue >= distanceFromOrigin) ||
              (direction < 0 && kpValue <= distanceFromOrigin)) {
            foundTrackID = track.Track_ID_after_jump
          }
        }

        row.T1 = foundTrackID || ''
      }
    },

    // 单行更新Gradient的T2
    updateGradientT2(index) {
      if (this.activeSheet === 'Gradient' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        // T2等于T1的简单情况
        row.T2 = row.T1 || ''
      }
    },

    // 单行更新Gradient的Track2
    updateGradientTrack2(index) {
      if (this.activeSheet === 'Gradient' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        // Track2等于T1的简单情况
        row.Track2 = row.T1 || ''
      }
    },

    // 单行更新Gradient的KP_correction
    updateGradientKPCorrection(index) {
      if (this.activeSheet === 'Gradient' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const tracksData = this.excelFiles[this.activeExcel].Tracks ? this.excelFiles[this.activeExcel].Tracks.data : []

        // 应用KP_correction计算逻辑
        const kpValue = Number(row.KP) || 0
        const trackID = row.Track2 || ''
        let correctionValue = 0

        // 查找对应的Track记录并获取correction值
        for (let i = 0; i < tracksData.length; i++) {
          if (tracksData[i].Track_ID_after_jump === trackID) {
            correctionValue = Number(tracksData[i].Correction_applied_to_KP) || 0
            break
          }
        }

        row.KP_correction = correctionValue
      }
    },

    // 单行更新Gradient的Distance
    updateGradientDistance(index) {
      if (this.activeSheet === 'Gradient' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]

        // 应用Distance计算逻辑
        const kpValue = Number(row.KP) || 0
        const kpCorrection = Number(row.KP_correction) || 0
        const direction = this.getDirectionValue()

        row.Distance = (kpValue + kpCorrection) * direction
      }
    },

    // 更新所有Stations表的计算字段
    updateAllStationsFields() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Stations) {
        const stationsRows = this.excelFiles[this.activeExcel].Stations.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Stations' // 临时设置为Stations表以便计算

        for (let i = 0; i < stationsRows.length; i++) {
          this.updateStationsT1(i)
          this.updateStationsT2(i)
          this.updateStationsTrack2(i)
          this.updateStationsKPCorrection(i)
          this.updateStationsDistanceOfPFCenter(i)
          this.updateStationsDistanceOfSSP(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 单行更新Stations的T1
    updateStationsT1(index) {
      if (this.activeSheet === 'Stations' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const tracksData = this.excelFiles[this.activeExcel].Tracks ? this.excelFiles[this.activeExcel].Tracks.data : []

        // 应用T1计算逻辑，类似于Gradient的T1计算
        const kpValue = Number(row.KP_of_SSP) || 0
        const direction = this.getDirectionValue()

        // 查找适当的Track ID
        let foundTrackID = null
        for (let i = 0; i < tracksData.length; i++) {
          const track = tracksData[i]
          const kpAfterJump = Number(track.KP_after_jump) || 0
          const correctionAppliedToKP = Number(track.Correction_applied_to_KP) || 0
          const distanceFromOrigin = (kpAfterJump + correctionAppliedToKP) * direction

          // 根据方向判断KP是否在范围内
          if ((direction > 0 && kpValue >= distanceFromOrigin) ||
              (direction < 0 && kpValue <= distanceFromOrigin)) {
            foundTrackID = track.Track_ID_after_jump
          }
        }

        row.T1 = foundTrackID || ''
      }
    },

    // 单行更新Stations的T2
    updateStationsT2(index) {
      if (this.activeSheet === 'Stations' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        // T2等于T1的简单情况
        row.T2 = row.T1 || ''
      }
    },

    // 单行更新Stations的Track2
    updateStationsTrack2(index) {
      if (this.activeSheet === 'Stations' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        // Track2等于T1的简单情况
        row.Track2 = row.T1 || ''
      }
    },

    // 单行更新Stations的KP_correction
    updateStationsKPCorrection(index) {
      if (this.activeSheet === 'Stations' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const tracksData = this.excelFiles[this.activeExcel].Tracks ? this.excelFiles[this.activeExcel].Tracks.data : []

        // 应用KP_correction计算逻辑
        const trackID = row.Track2 || ''
        let correctionValue = 0

        // 查找对应的Track记录并获取correction值
        for (let i = 0; i < tracksData.length; i++) {
          if (tracksData[i].Track_ID_after_jump === trackID) {
            correctionValue = Number(tracksData[i].Correction_applied_to_KP) || 0
            break
          }
        }

        row.KP_correction = correctionValue
      }
    },

    // 单行更新Stations的Distance_of_PF_center
    updateStationsDistanceOfPFCenter(index) {
      if (this.activeSheet === 'Stations' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]

        // 应用Distance_of_PF_center计算逻辑
        const kpValue = Number(row.KP_of_platform_center) || 0
        const kpCorrection = Number(row.KP_correction) || 0
        const direction = this.getDirectionValue()

        row.Distance_of_PF_center = (kpValue + kpCorrection) * direction
      }
    },

    // 单行更新Stations的Distance_of_SSP
    updateStationsDistanceOfSSP(index) {
      if (this.activeSheet === 'Stations' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]

        // 应用Distance_of_SSP计算逻辑
        const kpValue = Number(row.KP_of_SSP) || 0
        const kpCorrection = Number(row.KP_correction) || 0
        const direction = this.getDirectionValue()

        row.Distance_of_SSP = (kpValue + kpCorrection) * direction
      }
    },

    // 添加用于更新所有PSR行的T1和T2值的方法
    updateAllPSRTValues() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].PSR) {
        const psrRows = this.excelFiles[this.activeExcel].PSR.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'PSR' // 临时设置为PSR表以便计算

        for (let i = 0; i < psrRows.length; i++) {
          this.updatePSRT1(i)
          this.updatePSRT2(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 单行更新PSR的T1
    updatePSRT1(index) {
      if (this.activeSheet === 'PSR' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const tracksData = this.excelFiles[this.activeExcel].Tracks ? this.excelFiles[this.activeExcel].Tracks.data : []

        // 应用T1计算逻辑，类似于Gradient的T1计算
        const kpValue = Number(row.KP) || 0
        const direction = this.getDirectionValue()

        // 查找适当的Track ID
        let foundTrackID = null
        for (let i = 0; i < tracksData.length; i++) {
          const track = tracksData[i]
          const kpAfterJump = Number(track.KP_after_jump) || 0
          const correctionAppliedToKP = Number(track.Correction_applied_to_KP) || 0
          const distanceFromOrigin = (kpAfterJump + correctionAppliedToKP) * direction

          // 根据方向判断KP是否在范围内
          if ((direction > 0 && kpValue >= distanceFromOrigin) ||
              (direction < 0 && kpValue <= distanceFromOrigin)) {
            foundTrackID = track.Track_ID_after_jump
          }
        }

        row.T1 = foundTrackID || ''
      }
    },

    // 单行更新PSR的T2
    updatePSRT2(index) {
      if (this.activeSheet === 'PSR' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        // T2等于T1的简单情况
        row.T2 = row.T1 || ''
      }
    },

    // 添加用于更新所有PSR行的Track2和PSR_ms值的方法
    updateAllPSRTrack2AndPsrMs() {
      if (this.excelFiles[this.activeExcel]) {
        const psrKey = this.activeExcel === '总体参数(Gen. Param.)' ? '线路限速(PSR)' : 'PSR'
        if (this.excelFiles[this.activeExcel][psrKey]) {
          const psrRows = this.excelFiles[this.activeExcel][psrKey].data
          const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
          this.activeSheet = psrKey // 临时设置为PSR表以便计算

          for (let i = 0; i < psrRows.length; i++) {
            this.updatePSRTrack2(i)
            this.updatePSRMs(i)
          }

          this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
        }
      }
    },

    // 单行更新PSR的Track2
    updatePSRTrack2(index) {
      if (this.activeSheet === 'PSR' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        // Track2等于T1的简单情况
        row.Track2 = row.T1 || ''
      }
    },

    // 单行更新PSR的PSR_ms
    updatePSRMs(index) {
      if (this.activeSheet === 'PSR' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const psrValue = row.PSR

        // 获取Gen. Param.表中的Max PSR值，使用getMaxPSR方法获取最新值
        const maxPSR = this.getMaxPSR()

        // 如果PSR是文本
        if (psrValue !== '' && psrValue !== undefined && isNaN(Number(psrValue))) {
          row.PSR_ms = (maxPSR / 3.6).toFixed(2)
          return
        }

        // 如果PSR为空
        if (psrValue === '' || psrValue === undefined) {
          // 获取前一行的PSR_ms值
          if (index > 0) {
            const prevRow = this.currentSheets[this.activeSheet].data[index - 1]
            row.PSR_ms = prevRow.PSR_ms
          } else {
            row.PSR_ms = ''
          }
          return
        }

        // 其他情况：PSR/3.6
        const numericPSR = Number(psrValue) || 0
        row.PSR_ms = (numericPSR / 3.6).toFixed(2)
      }
    },

    // 添加用于更新所有PSR行的KP correction和Distance值的方法
    updateAllPSRKPCorrectionsAndDistances() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].PSR) {
        const psrRows = this.excelFiles[this.activeExcel].PSR.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'PSR' // 临时设置为PSR表以便计算

        for (let i = 0; i < psrRows.length; i++) {
          this.updatePSRKPCorrection(i)
          this.updatePSRDistance(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 单行更新PSR的KP_correction
    updatePSRKPCorrection(index) {
      if (this.activeSheet === 'PSR' && this.currentSheets[this.activeSheet]) {
        const row = this.currentSheets[this.activeSheet].data[index]
        const tracksData = this.excelFiles[this.activeExcel].Tracks ? this.excelFiles[this.activeExcel].Tracks.data : []

        // 应用KP_correction计算逻辑
        const trackID = row.Track2 || ''
        let correctionValue = 0

        // 查找对应的Track记录并获取correction值
        for (let i = 0; i < tracksData.length; i++) {
          if (tracksData[i].Track_ID_after_jump === trackID) {
            correctionValue = Number(tracksData[i].Correction_applied_to_KP) || 0
            break
          }
        }

        row.KP_correction = correctionValue
      }
    },

    // 单行更新PSR的Distance
    updatePSRDistance(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP
        const kpCorrection = currentRow.KP_correction

        // 获取Direction值
        const dir = this.getDirectionValue()

        // 如果KP是文本类型
        if (kpValue !== '' && kpValue !== undefined && isNaN(Number(kpValue))) {
          currentRow.Distance = -100000
          return
        }

        // 如果KP为空
        if (kpValue === '' || kpValue === undefined) {
          // 获取前一行的Distance值
          let prevDistance = 100000
          if (index > 0) {
            const prevRow = this.currentSheets[this.activeSheet].data[index - 1]
            if (prevRow.Distance !== '' && prevRow.Distance !== undefined && !isNaN(Number(prevRow.Distance))) {
              prevDistance = Number(prevRow.Distance)
            }
          }

          // 取MAX(100000, 前一行的Distance+1)
          currentRow.Distance = Math.max(100000, prevDistance + 1)
        } else {
          // 如果KP_correction为#N/A，则Distance也为#N/A
          if (kpCorrection === '#N/A') {
            currentRow.Distance = '#N/A'
            return
          }

          // 计算(KP + KP_correction) * dir
          const numericKP = Number(kpValue) || 0
          const numericCorrection = Number(kpCorrection) || 0
          currentRow.Distance = (numericKP + numericCorrection) * dir
        }
      }
    },

    // 处理线路速度变更
    handleLineSpeedChanged(value) {
      // 当线路速度变更时，需要更新依赖的计算
      // 这里可以添加相关更新逻辑
      this.$message.success(`线路速度值已更新为${value}，相关计算已更新`)
      this.handleDataModified()
    },

    // 获取当前活动文件的方向值
    getDirectionValue() {
      const genParamKey = this.getGenParamKey()

      if (!this.activeExcel || !this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel][genParamKey]) {
        return 1
      }

      const directionParam = this.excelFiles[this.activeExcel][genParamKey].data.find(
        item => item.paramName === 'Direction' || item.paramName === '方向'
      )
      return directionParam ? Number(directionParam.value) || 1 : 1
    },

    // 在末尾插入新行
    handleInsertLastRow() {
      if (!this.activeSheet || !this.currentSheets[this.activeSheet]) return

      // 创建一个空白行
      const emptyRow = {}
      this.currentSheets[this.activeSheet].headers.forEach(header => {
        emptyRow[header.prop] = ''
      })

      // 设置自增ID
      if (this.activeFolder === 'Track' && ['Tracks', 'Gradient', 'Stations', 'PSR', 'Block description', 'Unbridgeable gap'].includes(this.activeSheet)) {
        const currentData = this.currentSheets[this.activeSheet].data
        // 在末尾添加时，使用最后一行ID+1
        const lastId = currentData.length > 0
          ? parseInt(currentData[currentData.length - 1].id) || 0
          : 0
        emptyRow.id = lastId + 1
      } else if (this.activeFolder === 'Running_profile' && this.activeSheet === 'Running list') {
        const currentData = this.currentSheets[this.activeSheet].data
        // 在末尾添加时，使用最后一行ID+1
        const lastId = currentData.length > 0
          ? parseInt(currentData[currentData.length - 1].id) || 0
          : 0
        emptyRow.id = lastId + 1
      }

      // 将新行添加到表格数据中
      this.currentSheets[this.activeSheet].data.push(emptyRow)

      // 标记数据已修改
      this.dataModified = true

      // 自动计算相关字段（如果当前是Tracks表，则调用专门的更新方法）
      if (this.activeFolder === 'Track') {
        if (this.activeSheet === 'Tracks') {
          // 获取当前末行索引
          const lastIndex = this.currentSheets[this.activeSheet].data.length - 1

          // 更新TracksSheet组件
          if (this.$refs.tracksSheet) {
            // 更新所有track ID
            this.$refs.tracksSheet.updateAllTrackIdsBeforeJump()

            // 更新所有Correction值
            this.$refs.tracksSheet.updateAllCorrectionValues()

            // 更新所有Distance值
            this.$refs.tracksSheet.updateAllDistancesFromOrigin()
          }

          // 手动触发row-added事件以便更新其他工作表
          this.handleTrackRowAdded()

          this.$nextTick(() => {
            // 通知TracksSheet组件数据已修改
            if (this.$refs.tracksSheet) {
              this.$refs.tracksSheet.$emit('data-modified')
              this.$refs.tracksSheet.$emit('row-added')
            }
          })
        } else if (['Gradient', 'Stations', 'PSR', 'Block description', 'Unbridgeable gap'].includes(this.activeSheet)) {
          // 对于其他表格，触发自动计算
          this.$nextTick(() => {
            const lastIndex = this.currentSheets[this.activeSheet].data.length - 1

            if (this.activeSheet === 'Gradient' && this.$refs.gradientSheet) {
              this.$refs.gradientSheet.updateT1(lastIndex)
              this.$refs.gradientSheet.updateT2(lastIndex)
              this.$refs.gradientSheet.updateTrack2(lastIndex)
              this.$refs.gradientSheet.updateKPCorrection(lastIndex)
              this.$refs.gradientSheet.updateDistance(lastIndex)
            } else if (this.activeSheet === 'Stations' && this.$refs.stationsSheet) {
              this.$refs.stationsSheet.updateT1(lastIndex)
              this.$refs.stationsSheet.updateT2(lastIndex)
              this.$refs.stationsSheet.updateTrack2(lastIndex)
              this.$refs.stationsSheet.updateKPCorrection(lastIndex)
              this.$refs.stationsSheet.updateDistanceOfPFCenter(lastIndex)
              this.$refs.stationsSheet.updateDistanceOfSSP(lastIndex)
            } else if (this.activeSheet === 'PSR' && this.$refs.psrSheet) {
              this.$refs.psrSheet.updateT1(lastIndex)
              this.$refs.psrSheet.updateT2(lastIndex)
              this.$refs.psrSheet.updateTrack2(lastIndex)
              this.$refs.psrSheet.updateKPCorrection(lastIndex)
              this.$refs.psrSheet.updateDistance(lastIndex)
              this.$refs.psrSheet.updatePSRMs(lastIndex)
            }
          })
        }
      }

      this.$message.success('已在末尾添加新行')
    },

    // 插入行通用处理函数
    handleInsertRow(index) {
      // 对于Tracks表，使用专用组件的方法
      if (this.activeFolder === 'Track' && this.activeSheet === 'Tracks') return

      // 其他表格的通用插入逻辑 - 不再显示表单
      if (!this.activeSheet || !this.currentSheets[this.activeSheet]) return

      // 创建一个空白行
      const emptyRow = {}
      this.currentSheets[this.activeSheet].headers.forEach(header => {
        emptyRow[header.prop] = ''
      })

      // 设置新行ID - 应该是插入位置后一行的ID
      if (this.activeFolder === 'Track' && ['Gradient', 'Stations', 'PSR', 'Block description', 'Unbridgeable gap'].includes(this.activeSheet)) {
        const currentData = this.currentSheets[this.activeSheet].data

        // 使用插入位置后一行的ID
        const insertID = index < currentData.length - 1
          ? parseInt(currentData[index + 1].id) || 0
          : (parseInt(currentData[index].id) || 0) + 1

        emptyRow.id = insertID

        // 将插入行后的所有行ID递增1
        for (let i = 0; i < currentData.length; i++) {
          if (i > index) {
            if (currentData[i].id !== undefined && currentData[i].id !== null && currentData[i].id !== '') {
              currentData[i].id = parseInt(currentData[i].id) + 1
            }
          }
        }
      } else if (this.activeFolder === 'Running_profile' && this.activeSheet === 'Running list') {
        const currentData = this.currentSheets[this.activeSheet].data

        // 使用插入位置后一行的ID
        const insertID = index < currentData.length - 1
          ? parseInt(currentData[index + 1].id) || 0
          : (parseInt(currentData[index].id) || 0) + 1

        emptyRow.id = insertID

        // 将插入行后的所有行ID递增1
        for (let i = 0; i < currentData.length; i++) {
          if (i > index) {
            if (currentData[i].id !== undefined && currentData[i].id !== null && currentData[i].id !== '') {
              currentData[i].id = parseInt(currentData[i].id) + 1
            }
          }
        }
      }

      // 插入新行
      this.currentSheets[this.activeSheet].data.splice(index + 1, 0, emptyRow)

      // 标记数据已修改
      this.dataModified = true

      this.$message.success(`已在第 ${index + 1} 行后插入新行`)
    },

    // 删除行
    handleDeleteRow(index) {
      // 显示删除确认对话框
      this.showInsertRowDialog = false
      this.deleteRowIndex = index
      this.$confirm(`确认删除第 ${index + 1} 行?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除行
        this.currentSheets[this.activeSheet].data.splice(index, 1)

        // 删除后重新分配ID
        this.currentSheets[this.activeSheet].data.forEach((row, idx) => {
          row.id = idx + 1
        })

        // 更新数据修改状态
        this.handleDataModified()

        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },

    // 计算所有行（适用于Running list工作表）
    calculateAllRows() {
      if (!this.$refs.runningListSheet) {
        this.$message.error('找不到Running list组件')
        return
      }

      // 调用RunningListSheet组件的calculateAllRows方法
      this.$refs.runningListSheet.calculateAllRows()
    },

    // 处理图片预览
    handleImagePreview(imageUrl) {
      // ... existing code ...
    },

    // 获取轨道数据
    getTracksData() {
      const tracksKey = this.getTracksKey()
      return this.excelFiles[this.activeExcel]?.[tracksKey]?.data || []
    },

    // 获取Stations数据
    getStationsData() {
      const stationsKey = this.getStationsKey()
      return this.excelFiles[this.activeExcel]?.[stationsKey]?.data || []
    },

    // 获取最大PSR值
    getMaxPSR() {
      const genParamKey = this.getGenParamKey()

      if (!this.activeExcel || !this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel][genParamKey]) {
        return 350
      }

      const maxPSRParam = this.excelFiles[this.activeExcel][genParamKey].data.find(
        item => item && (item.paramName === 'Max PSR' || item.paramName === '最大PSR')
      )
      return maxPSRParam ? Number(maxPSRParam.value) || 350 : 350
    },

    // 获取计算按钮类型
    getCalculationButtonType(row) {
      if (this.isCalculating(row)) {
        return 'warning'
      }

      if (this.isCalculated(row)) {
        return 'success'
      }

      return 'primary'
    },

    // 获取计算按钮文本
    getCalculationButtonText(row) {
      if (this.isCalculating(row)) {
        return '计算中...'
      }

      if (this.isCalculated(row)) {
        return '查看结果'
      }

      return '计算'
    },

    // 判断行是否正在计算
    isCalculating(row) {
      const index = this.getRowIndex(row)
      return this.calculatedRows[index] && this.calculatedRows[index].calculating
    },

    // 判断行是否已经计算
    isCalculated(row) {
      const index = this.getRowIndex(row)
      return this.calculatedRows[index] && this.calculatedRows[index].calculated
    },

    // 获取行索引
    getRowIndex(row) {
      if (!this.currentSheets || !this.currentSheets[this.activeSheet]) return -1
      return this.currentSheets[this.activeSheet].data.findIndex(r => r === row)
    },

    // 处理单个行的计算
    handleSingleRowCalculate(row, rowIndex) {
      if (this.isCalculated(row)) {
        // 已计算过，显示结果
        this.showCalculationResults(row, rowIndex)
      } else {
        // 未计算，开始计算
        this.startCalculationForRow(row, rowIndex)
      }
    },

    // 显示计算结果
    showCalculationResults(row, rowIndex) {
      this.selectedCalculationRow = { data: row, index: rowIndex }
      this.calculationDialogVisible = true
    },

    // 开始为单行计算
    startCalculationForRow(row, rowIndex) {
      // 设置当前选中的行
      this.selectedCalculationRow = { data: row, index: rowIndex }

      // 标记行为计算中
      if (!this.calculatedRows[rowIndex]) {
        this.calculatedRows[rowIndex] = {}
      }
      this.calculatedRows[rowIndex].calculating = true

      // 重置计算状态
      this.calculationState.travelTime.status = 'warning'
      this.calculationState.travelTime.percentage = 0
      this.calculationState.minHeadway.status = ''
      this.calculationState.minHeadway.percentage = 0
      this.calculationState.minHeadway.enabled = false

      // 重置计算结果
      this.calculationResults.travelTime = null
      this.calculationResults.minHeadway = null

      // 显示计算对话框
      this.calculationDialogVisible = true

      // 执行通行时间计算
      this.calculateTravelTimeForRow()
    },

    // 计算通行时间
    async calculateTravelTimeForRow() {
      if (!this.selectedCalculationRow) return

      const row = this.selectedCalculationRow.data
      const rowIndex = this.selectedCalculationRow.index

      this.calculationState.travelTime.status = 'warning'
      this.calculationState.travelTime.percentage = 30

      try {
        // 从localStorage获取项目ID
        const projectInfo = localStorage.getItem('selectedProject')
        const projectId = projectInfo ? JSON.parse(projectInfo).id : ''

        // 调用计算函数
        const result = await calculateTravelTime(row, rowIndex, projectId)

        if (result.success) {
          this.calculationState.travelTime.status = 'success'
          this.calculationState.travelTime.percentage = 100
          this.calculationResults.travelTime = result.data

          // 允许计算最小间隔时间
          this.calculationState.minHeadway.enabled = true

          // 标记行已计算
          this.calculatedRows[rowIndex] = {
            calculating: false,
            calculated: true,
            travelTimeResult: result
          }
        } else {
          this.calculationState.travelTime.status = 'exception'
          this.calculationState.travelTime.percentage = 100
          this.$message.error(result.message)
        }
      } catch (error) {
        this.calculationState.travelTime.status = 'exception'
        this.calculationState.travelTime.percentage = 100
        this.$message.error('计算通行时间出错: ' + (error.message || '未知错误'))
      }
    },

    // 计算最小间隔时间
    async calculateMinHeadwayForRow() {
      if (!this.selectedCalculationRow || !this.calculationState.minHeadway.enabled) return

      const row = this.selectedCalculationRow.data
      const rowIndex = this.selectedCalculationRow.index
      const travelTimeResult = this.calculatedRows[rowIndex].travelTimeResult

      this.calculationState.minHeadway.status = 'warning'
      this.calculationState.minHeadway.percentage = 30

      try {
        // 从localStorage获取项目ID
        const projectInfo = localStorage.getItem('selectedProject')
        const projectId = projectInfo ? JSON.parse(projectInfo).id : ''

        // 调用计算函数
        const result = await calculateMinHeadway(row, rowIndex, projectId, travelTimeResult)

        if (result.success) {
          this.calculationState.minHeadway.status = 'success'
          this.calculationState.minHeadway.percentage = 100
          this.calculationResults.minHeadway = result.data

          // 更新详细数据
          this.detailData = formatDetailData(result.data.detailData)

          // 标记行计算完成
          this.calculatedRows[rowIndex].minHeadwayResult = result
        } else {
          this.calculationState.minHeadway.status = 'exception'
          this.calculationState.minHeadway.percentage = 100
          this.$message.error(result.message)
        }
      } catch (error) {
        this.calculationState.minHeadway.status = 'exception'
        this.calculationState.minHeadway.percentage = 100
        this.$message.error('计算最小间隔时间出错: ' + (error.message || '未知错误'))
      }
    },

    // 处理全局计算命令
    handleCalculateCommand(command) {
      if (command === 'travelTime') {
        this.calculateAllRowsTravelTime()
      } else if (command === 'minHeadway') {
        this.calculateAllRowsMinHeadway()
      }
    },

    // 计算所有行的通行时间 - 循环调用每行的计算按钮
    async calculateAllRowsTravelTime() {
      if (this.calculatingAllRows) return

      // 获取当前工作表的所有行数据
      const rows = this.currentSheets[this.activeSheet].data
      if (!rows || rows.length === 0) {
        this.$message.warning('没有可计算的数据行')
        return
      }

      this.calculatingAllRows = true

      try {
        // 循环调用每行的计算函数
        const runningListSheet = this.$refs.runningListSheet
        if (runningListSheet && typeof runningListSheet.handleSingleRowCalculate === 'function') {
          // 创建一个延迟执行的函数
          const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            // 调用RunningListSheet组件的单行计算方法
            runningListSheet.handleSingleRowCalculate(row, i)

            // 短暂延迟以防止界面卡顿
            await delay(100)
          }

          this.$message.success('所有行计算触发完成')
          this.globalTravelTimeCalculated = true
        } else {
          throw new Error('运行表格组件未找到或缺少计算方法')
        }
      } catch (error) {
        this.$message.error('计算所有行通行时间出错: ' + (error.message || '未知错误'))
      } finally {
        this.calculatingAllRows = false
      }
    },

    // 计算所有行的最小间隔时间
    async calculateAllRowsMinHeadway() {
      if (this.calculatingAllRows || !this.globalTravelTimeCalculated) return

      // 获取当前工作表的所有行数据
      const rows = this.currentSheets[this.activeSheet].data
      if (!rows || rows.length === 0) {
        this.$message.warning('没有可计算的数据行')
        return
      }

      // 检查是否所有行都已计算通行时间
      const allHaveTravelTime = Object.values(this.calculatedRows).every(row => row.travelTimeResult)
      if (!allHaveTravelTime) {
        this.$message.warning('请先为所有行计算通行时间')
        return
      }

      this.calculatingAllRows = true

      try {
        // 获取RunningListSheet组件实例
        const runningListSheet = this.$refs.runningListSheet
        if (!runningListSheet) {
          throw new Error('找不到Running list组件')
        }

        // 首先选择第一行并显示计算对话框
        if (rows.length > 0) {
          const firstRow = rows[0]
          runningListSheet.selectedCalculationRow = { data: firstRow, index: 0 }

          // 确保对话框可见
          runningListSheet.calculationDialogVisible = true
        }

        // 创建一个延迟执行的函数
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

        // 循环处理每一行
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          // 设置当前选中的行
          runningListSheet.selectedCalculationRow = { data: row, index: i }

          // 调用RunningListSheet组件的计算方法
          runningListSheet.calculateMinHeadwayForRow()

          // 短暂延迟以防止界面卡顿
          await delay(500)
        }

        this.$message.success('所有行最小间隔时间计算完成')
      } catch (error) {
        this.$message.error('计算所有行最小间隔时间出错: ' + (error.message || '未知错误'))
      } finally {
        this.calculatingAllRows = false
      }
    },

    // 处理详细数据变更
    handleDetailDataChanged(newData) {
      this.detailData = newData
    },

    // 重新计算间隔
    recalculateIntervals() {
      // 此处应该调用API重新计算间隔，但目前简化处理
      this.$message.info('重新计算间隔')
    },

    // 查看图片
    handleViewImage(moduleType, index) {
      // 根据模块类型和索引获取对应的图片
      let imageInfo = null

      if (moduleType === 1 && this.calculationResults.minHeadway && this.calculationResults.minHeadway.images) {
        // 发车模块
        imageInfo = {
          path: this.calculationResults.minHeadway.images[0] || '',
          title: '发车模块图片'
        }
      } else if (moduleType === 2 && this.calculationResults.minHeadway && this.calculationResults.minHeadway.images) {
        // 区间模块
        const imageIndex = 1 + index // 区间图片从索引1开始
        imageInfo = {
          path: this.calculationResults.minHeadway.images[imageIndex] || '',
          title: `区间模块图片 ${index + 1}`
        }
      } else if (moduleType === 3 && this.calculationResults.minHeadway && this.calculationResults.minHeadway.images) {
        // 接车模块
        const imageIndex = this.calculationResults.minHeadway.images.length - 1 // 最后一张是接车模块
        imageInfo = {
          path: this.calculationResults.minHeadway.images[imageIndex] || '',
          title: '接车模块图片'
        }
      }

      if (imageInfo && imageInfo.path) {
        this.previewImageInfo = imageInfo
        this.imagePreviewVisible = true
      } else {
        this.$message.warning('没有可用的图片')
      }
    },

    // 导出Excel
    handleExportExcel(moduleType, index) {
      // 根据模块类型和索引获取对应的Excel文件并下载
      if (this.calculationResults.minHeadway && this.calculationResults.minHeadway.excelFiles) {
        const excelFile = this.calculationResults.minHeadway.excelFiles[moduleType - 1]

        if (excelFile) {
          // 下载Excel文件
          window.open(excelFile, '_blank')
        } else {
          this.$message.warning('没有可用的Excel文件')
        }
      } else {
        this.$message.warning('没有可用的Excel文件')
      }
    },

    // 当Gen. Param.表变化时更新所有相关计算
    updateAllCalculations() {
      // 更新所有依赖方向参数的计算
      if (this.excelFiles[this.activeExcel]) {
        // 更新Gradient表的计算
        if (this.excelFiles[this.activeExcel]['Gradient']) {
          // 这里需要调用相关方法更新Gradient表的计算
        }

        // 更新Stations表的计算
        if (this.excelFiles[this.activeExcel]['Stations']) {
          // 这里需要调用相关方法更新Stations表的计算
        }

        // 更新PSR表的计算
        if (this.excelFiles[this.activeExcel]['PSR']) {
          // 这里需要调用相关方法更新PSR表的计算
        }
      }
    },

    // 获取trainLength
    getTrainLength() {
      const genParamKey = this.getGenParamKey()

      if (!this.activeExcel || !this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel][genParamKey]) {
        return 0
      }

      const trainLengthParam = this.excelFiles[this.activeExcel][genParamKey].data.find(item => item && item.paramName === 'Train length')
      return trainLengthParam ? Number(trainLengthParam.value) || 0 : 0
    },

    // 处理Excel文件选择
    handleExcelSelect(fileName) {
      if (fileName && this.excelFiles[fileName]) {
        this.activeExcel = fileName

        // 根据文件夹类型设置默认工作表
        const availableSheets = this.getAvailableSheets()
        // 找到第一个存在于currentSheets中的可用工作表
        for (const sheet of availableSheets) {
          if (this.currentSheets[sheet]) {
            this.activeSheet = sheet
            break
          }
        }

        // 显示通知
        this.$message.success(`已切换到文件：${fileName}`)
      }
    },

    // 提交行表单
    submitRowForm(formData) {
      if (!this.activeSheet || !this.currentSheets[this.activeSheet]) return

      try {
        // 创建新行数据
        const newRow = { ...formData }

        // 设置自增ID
        if (['Tracks', 'Gradient', 'Stations', 'PSR', 'Block description', 'Unbridgeable gap', 'Running list'].includes(this.activeSheet)) {
          const currentData = this.currentSheets[this.activeSheet].data

          // 使用插入位置后一行的ID或者当前位置ID+1
          const insertID = this.insertPosition < currentData.length - 1
            ? parseInt(currentData[this.insertPosition + 1].id) || 0
            : (parseInt(currentData[this.insertPosition].id) || 0) + 1

          newRow.id = insertID

          // 将插入行后的所有行ID递增1
          for (let i = 0; i < currentData.length; i++) {
            if (i > this.insertPosition) {
              if (currentData[i].id !== undefined && currentData[i].id !== null && currentData[i].id !== '') {
                currentData[i].id = parseInt(currentData[i].id) + 1
              }
            }
          }
        }

        // 插入新行
        this.currentSheets[this.activeSheet].data.splice(this.insertPosition + 1, 0, newRow)

        // 标记数据已修改
        this.dataModified = true

        // 关闭对话框
        this.showRowDialog = false

        this.$message.success(`已在第 ${this.insertPosition + 1} 行后插入新行`)
      } catch (error) {
        console.error('插入行时出错:', error)
        this.$message.error('插入行失败: ' + error.message)
      }
    },

    // 获取Gen. Param.的键名
    getGenParamKey() {
      // 首先尝试使用英文键名
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
        return 'Gen. Param.'
      }

      // 然后尝试使用中文键名
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['总体参数(Gen. Param.)']) {
        return '总体参数(Gen. Param.)'
      }

      // 默认返回英文键名
      return 'Gen. Param.'
    },

    // 获取Tracks的键名
    getTracksKey() {
      // 首先尝试使用英文键名
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Tracks']) {
        return 'Tracks'
      }

      // 然后尝试使用中文键名
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['长短链(Tracks)']) {
        return '长短链(Tracks)'
      }

      // 默认返回英文键名
      return 'Tracks'
    },

    // 获取Stations的键名
    getStationsKey() {
      // 首先尝试使用英文键名
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Stations']) {
        return 'Stations'
      }

      // 然后尝试使用中文键名
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['车站(Stations)']) {
        return '车站(Stations)'
      }

      // 默认返回英文键名
      return 'Stations'
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

/* 面包屑导航样式 */
.current-path {
  margin-bottom: 15px;
  padding: 10px 0;
}

.folder-sidebar {
  margin-bottom: 20px;
  background-color: #ffffff;
}

.folder-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.folder-header span {
  margin-bottom: 8px;
}

.search-wrapper {
  width: 100%;
  margin: 8px 0;
}

.folder-menu {
  border-right: none;
  background-color: #ffffff;
}

.folder-title {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.folder-name {
  margin-left: 5px;
  flex: 1;
}

.right-panel {
  display: flex;
  flex-direction: column;
}

.right-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.excel-control {
  margin-bottom: 20px;
}

.excel-header {
  margin-bottom: 15px;
}

.excel-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
}

.project-info {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
  margin-left: 10px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.button-group .el-button {
  margin-right: 0;
}

/* 扁平化按钮样式 */
.flat-button {
  border-radius: 2px !important;
  padding: 8px 16px;
  font-size: 14px;
}

/* 按钮样式定制 */
.view-all-btn {
  background-color: #909399 !important;
  border-color: #909399 !important;
  color: white !important;
}

.add-version-btn {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
}

.delete-btn {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.back-btn {
  background-color: #909399 !important;
  border-color: #909399 !important;
  color: white !important;
}

.api-load-btn {
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.api-save-btn {
  background-color: #67c23a !important;
  border-color: #67c23a !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #909399;
}

.empty-content i {
  font-size: 64px;
  margin-bottom: 20px;
}

.el-submenu /deep/ .el-submenu__title {
  height: 40px;
  line-height: 40px;
  padding-left: 15px !important;
}

.el-submenu /deep/ .el-submenu__title:hover,
.el-submenu /deep/ .el-submenu__title:focus {
  background-color: #f5f7fa !important;
}

.el-menu-item {
  height: 36px;
  line-height: 36px;
  padding-left: 40px !important;
}

.el-menu-item:hover,
.el-menu-item:focus {
  background-color: #f5f7fa !important;
}

.el-menu-item.is-active {
  color: #409EFF;
  background-color: #ecf5ff !important;
}

/* 工作表相关样式 */
.sheet-toolbar {
  margin-top: 15px;
  margin-bottom: 15px;
  padding: 8px 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-label {
  margin-right: 10px;
  font-weight: bold;
}

.sheet-select {
  margin-right: 10px;
  min-width: 200px;
}

.insert-btn {
  margin-left: auto;
}

.sheet-content {
  margin-top: 20px;
}

/* 新增表单相关样式 */
.row-form {
  max-height: 400px;
  overflow-y: auto;
}

/* 新增表单样式 */
.new-version-form {
  max-height: 400px;
  overflow-y: auto;
}

/* 导出按钮控制区样式 */
.export-control {
  margin-top: 20px;
  text-align: center;
}
</style>
