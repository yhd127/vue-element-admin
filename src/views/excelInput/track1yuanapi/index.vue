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
    <div v-if="projectInfo" class="current-path">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>土建版本{{ projectInfo.version }}</el-breadcrumb-item>
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
          ref="sidebar"
          :active-menu-index="activeMenuIndex"
          :file-id="fileId"
          :folder-tree-data="folderTreeData"
          @menu-select="handleMenuSelect"
          @folder-click="handleFolderClick"
        />
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="18" class="right-panel">
        <div class="right-container">
          <!-- 按钮操作区域 -->
          <div class="excel-control">
            <div v-if="activeFolder" class="excel-header">
              <h3 class="excel-title">
                {{ activeFolder }} <span v-if="projectInfo" class="project-info">(项目: {{ projectInfo.project_name }}, 项目版本: {{ projectInfo.version }})</span>
              </h3>
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
                  :disabled="!currentSheets[sheetName]"
                />
              </el-select>

              <el-dropdown
                v-if="activeSheet === 'Running list'"
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
                v-if="activeSheet !== 'Gen. Param.'"
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

import { getRunningList, createRunningProfile, deleteRunningProfile, updateRunningProfile } from '@/api/runningprofile'

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

      // 项目信息相关
      projectId: null,
      projectInfo: null,

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

      // 添加folderTreeData用于存储文件夹和文件信息
      folderTreeData: [
        {
          id: 'Track',
          label: 'Track',
          children: [
            { id: 'Track-track_up.xls', label: 'track_up.xls', file: { name: 'track_up.xls', displayName: 'track_up.xls' }},
            { id: 'Track-track_down.xls', label: 'track_down.xls', file: { name: 'track_down.xls', displayName: 'track_down.xls' }}
          ]
        },
        {
          id: 'Running_profile',
          label: 'Running_profile',
          children: [] // API加载后会填充这里
        }
      ],

      // 初始化示例文件数据
      folderExamples: {
        'Track': [
          { name: 'track_up.xls', displayName: 'track_up.xls' },
          { name: 'track_down.xls', displayName: 'track_down.xls' },
          { name: 'track_down-80.xls', displayName: 'track_down-80.xls' }
        ],
        'Running_profile': [] // 不再使用本地静态数据
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
        this.activeSheet = sheetNames.length > 0 ? sheetNames[0] : null
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

    // 从路由查询参数中获取项目ID
    if (this.$route.query.projectId) {
      this.projectId = this.$route.query.projectId

      // 从localStorage获取项目信息
      const projectInfoStr = localStorage.getItem('selectedProject')
      if (projectInfoStr) {
        try {
          this.projectInfo = JSON.parse(projectInfoStr)
          console.log('加载的项目信息:', this.projectInfo)

          // 更新页面标题，显示项目名称
          document.title = `${this.projectInfo.project_name || '项目'} - 轨道数据API`
        } catch (e) {
          console.error('解析项目信息出错:', e)
        }
      }
    }

    // 初始化文件夹管理器
    this.initializeFolderManager()

    // 初始化文件夹树形数据
    this.initializeFolderTreeData()

    // 默认打开第一个文件夹
    const folderIds = getAllFolderIds()
    if (folderIds.length > 0) {
      this.activeMenuIndex = folderIds[0]
      this.activeFolder = folderIds[0]

      // 如果选择的是Running_profile文件夹，则从后端加载数据
      if (this.activeFolder === 'Running_profile') {
        this.loadRunningProfilesFromAPI()
      }
    }
  },

  methods: {
    // 初始化文件夹树形数据
    initializeFolderTreeData() {
      // 已经在data中初始化了folderTreeData，这里可以添加额外的处理逻辑
      console.log('初始化文件夹树形数据:', this.folderTreeData)

      // 为Track文件夹设置子项
      const trackFolder = this.folderTreeData.find(f => f.id === 'Track')
      if (trackFolder) {
        trackFolder.children = this.folderExamples['Track'].map(file => ({
          id: `Track-${file.name}`,
          label: file.displayName || file.name,
          file: file
        }))
      }

      // Running_profile文件夹的子项将由API加载
    },

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
          if (this.currentSheets[sheet]) {
            this.activeSheet = sheet
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
      console.log('选中菜单项:', index, '解析结果:', menuItem)

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

        // 判断是否为API数据文件
        if (menuItem.file.apiData && menuItem.folderId === 'Running_profile') {
          console.log('加载API文件:', fileName, menuItem.file)
          this.loadRunningProfileFromAPIData(fileName, menuItem.file.apiData)
        } else {
          this.loadExcelFile(fileName)
        }
      } else {
        console.log('无法识别的菜单项类型:', menuItem.type)
      }
    },

    // 处理文件夹点击事件
    handleFolderClick(folderId) {
      console.log('文件夹点击事件触发:', folderId)

      const folder = getFolderConfig(folderId)
      if (folder) {
        this.activeFolder = folderId
        this.activeExcel = null
        this.activeSheet = null

        console.log('当前选中文件夹:', this.activeFolder)

        // 如果是Running_profile文件夹，立即从API加载最新数据
        if (folderId === 'Running_profile') {
          console.log('是Running_profile文件夹，准备加载API数据')
          this.loadRunningProfilesFromAPI()
        } else {
          // 非API文件夹使用本地数据
          this.folderExcelFiles = getFolderFiles(folderId)
          console.log('文件夹内文件列表:', this.folderExcelFiles)
        }
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

      // 如果内部名称存在于数据结构中，使用内部名称
      if (this.excelFiles[this.activeExcel][internalSheetName]) {
        this.activeSheet = sheet
      } else {
        // 否则尝试使用原始名称
        this.activeSheet = sheet
      }

      console.log('Sheet changed to:', sheet, 'Internal name:', internalSheetName)
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
    },

    // 返回文件夹列表
    backToFolderList() {
      this.activeExcel = null
      this.activeSheet = null
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

    // 从后端API加载Running Profile数据
    async loadRunningProfilesFromAPI() {
      this.loading = true
      this.loadError = null

      try {
        // 从store获取用户ID (参考track0607的实现)
        const userId = this.$store.getters.userId || 0

        // 从路由或store获取项目信息
        const projectId = this.projectId || 9
        const version = this.projectInfo ? this.projectInfo.version : 1

        console.log('调用loadRunningProfilesFromAPI方法 - 用户信息:', userId, '项目信息:', projectId, version)

        // 调用API获取Running Profile数据
        const params = {
          user_id: userId,
          project_id: projectId,
          version: version
        }

        console.log('调用API参数:', params)

        // 调用API获取Running Profile数据
        const response = await getRunningList(params)
        console.log('API响应原始数据:', response)

        // 处理API返回的数据
        if (response && Array.isArray(response)) {
          // 转换API数据为文件夹文件格式
          const files = response.map(item => ({
            name: item.name || `新建运行文件_${Date.now()}`,
            displayName: item.name || `新建运行文件_${Date.now()}`,
            apiData: item, // 直接保存完整的原始API数据
            idx: item.idx // 保存ID用于后续更新/删除操作
          }))

          console.log('转换后的文件列表:', files)

          // 更新Running_profile文件夹的文件列表
          setFolderFiles('Running_profile', files)
          console.log('文件夹文件设置完成, 当前文件列表:', getFolderFiles('Running_profile'))

          // 更新folderTreeData以反映在侧边栏中
          const runningFolder = this.folderTreeData.find(folder => folder.id === 'Running_profile')
          if (runningFolder) {
            runningFolder.children = files.map(item => ({
              id: `Running_profile-${item.name}`,
              label: item.displayName,
              file: {
                name: item.name,
                displayName: item.displayName,
                apiData: item.apiData, // 确保apiData字段被正确传递
                idx: item.idx
              }
            }))
          }

          // 强制更新视图
          this.$forceUpdate()

          // 刷新侧边栏组件
          this.refreshSidebar()

          this.$message.success('从后端加载运行配置数据成功')
        } else {
          throw new Error('API返回数据格式不正确')
        }
      } catch (error) {
        console.error('加载Running Profile API错误:', error)
        this.loadError = `从API加载运行配置数据失败: ${error.message}`
        this.$message.error(this.loadError)
      } finally {
        this.loading = false
      }
    },

    // 从API数据加载Running Profile文件
    loadRunningProfileFromAPIData(fileName, apiData) {
      this.loading = true

      try {
        console.log('加载API数据到Running list:', fileName, apiData)

        // 初始化Running Profile工作表
        if (!this.excelFiles[fileName]) {
          this.$set(this.excelFiles, fileName, createRunningProfileSheets())
        }

        // 设置当前活动的Excel文件
        this.activeExcel = fileName

        // 将API数据填充到工作表中
        if (this.excelFiles[fileName]['Running list']) {
          // 确保apiData是正确的对象
          const apiObj = apiData.apiData || apiData
          console.log('使用的API数据对象:', apiObj)

          // 创建一行数据
          const rowData = {
            id: 1, // 初始ID为1
            departureStation: apiObj.departure_station_name || '',
            departureDistance: apiObj.departure_station_distance || 0,
            arrivalStation: apiObj.arrival_station_name || '',
            arrivalDistance: apiObj.arrival_station_distance || 0,
            performanceObjective: apiObj.performance_objective || 0,
            safeVisibility: apiObj.safe_visibility || 0,
            functionalVisibility: apiObj.functional_visibility || 0,
            perf: apiObj.perf || 0,
            limitVisibility: apiObj.limit_visibility || 0,
            perf2: apiObj.perf2 || 0,
            track: apiObj.track || '',
            train: apiObj.train || '',
            trainLoad: apiObj.train_load || false,
            idx: apiObj.idx // 保存ID用于后续操作
          }

          // 设置工作表数据 - 确保是数组格式
          this.$set(this.excelFiles[fileName]['Running list'], 'data', [rowData])

          // 添加调试日志
          console.log('已设置Running list工作表数据:', this.excelFiles[fileName]['Running list'].data)
        }

        // 设置默认工作表
        this.activeSheet = 'Running list'

        // 重置数据修改标记
        this.dataModified = false

        this.$message.success(`已加载运行配置: ${fileName}`)
      } catch (error) {
        console.error('加载API数据失败:', error)
        this.loadError = `加载API数据失败: ${error.message}`
        this.$message.error(this.loadError)
      } finally {
        this.loading = false
      }
    },

    // 刷新侧边栏组件
    refreshSidebar() {
      // 如果有侧边栏组件引用
      if (this.$refs.sidebar && this.$refs.sidebar.updateFolderTreeData) {
        console.log('刷新侧边栏组件')
        this.$refs.sidebar.updateFolderTreeData()
      } else {
        console.log('侧边栏组件不存在或未包含updateFolderTreeData方法，尝试强制更新视图')
        // 尝试重新创建整个侧边栏
        this.$forceUpdate()
      }
    },

    // 添加处理计算详情视图的方法
    handleViewCalculationDetail(detailData) {
      // 显示计算详情
      if (detailData) {
        this.detailData = detailData
        this.calculationDialogVisible = true
      }
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

      const maxPSRParam = this.excelFiles[this.activeExcel][genParamKey].data.find(item => item && item.paramName === 'Max PSR')
      return maxPSRParam ? Number(maxPSRParam.value) || 350 : 350
    },

    // 获取trainLength
    getTrainLength() {
      const genParamKey = this.getGenParamKey()

      if (!this.activeExcel || !this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel][genParamKey]) {
        return 0
      }

      const trainLengthParam = this.excelFiles[this.activeExcel][genParamKey].data.find(item => item && item.paramName === 'Train length')
      return trainLengthParam ? Number(trainLengthParam.value) || 0 : 0
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
