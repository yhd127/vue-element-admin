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

    <!-- 新增行表单对话框 -->
    <el-dialog
      :title="insertPosition >= 0 ? `在第${insertPosition+1}行后插入数据` : '添加新行数据'"
      :visible.sync="showRowDialog"
      width="50%"
    >
      <el-form
        ref="rowForm"
        :model="newRowData"
        label-width="180px"
        size="small"
        class="row-form"
      >
        <el-form-item
          v-for="(header, index) in currentHeaders"
          :key="index"
          :label="header.label"
          :prop="header.prop"
        >
          <el-input
            v-model="newRowData[header.prop]"
            :placeholder="'请输入' + header.label"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showRowDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRowForm">确认</el-button>
      </span>
    </el-dialog>

    <!-- 新增文件版本对话框 -->
    <el-dialog
      :title="`新增${getActiveFolderName()}文件版本`"
      :visible.sync="showNewVersionDialog"
      width="50%"
    >
      <el-form
        ref="newVersionForm"
        :model="newVersionData"
        label-width="180px"
        size="small"
        class="new-version-form"
      >
        <!-- Running_profile文件夹的表单项 -->
        <template v-if="activeFolderId === 'folder-running'">
          <el-form-item label="name" prop="name" required>
            <el-input v-model="newVersionData.name" placeholder="Please input name" />
          </el-form-item>
          <el-form-item label="departure_station_name" prop="departure_station_name">
            <el-input v-model="newVersionData.departure_station_name" placeholder="Please input departure station name" />
          </el-form-item>
          <el-form-item label="departure_station_distance" prop="departure_station_distance">
            <el-input-number v-model="newVersionData.departure_station_distance" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="arrival_station_name" prop="arrival_station_name">
            <el-input v-model="newVersionData.arrival_station_name" placeholder="Please input arrival station name" />
          </el-form-item>
          <el-form-item label="arrival_station_distance" prop="arrival_station_distance">
            <el-input-number v-model="newVersionData.arrival_station_distance" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="track" prop="track">
            <el-input v-model="newVersionData.track" placeholder="Please input track" />
          </el-form-item>
          <el-form-item label="train" prop="train">
            <el-input v-model="newVersionData.train" placeholder="Please input train" />
          </el-form-item>
          <el-form-item label="train_load" prop="train_load">
            <el-switch v-model="newVersionData.train_load" />
          </el-form-item>
          <el-form-item label="performance_objective" prop="performance_objective">
            <el-input-number v-model="newVersionData.performance_objective" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="safe_visibility" prop="safe_visibility">
            <el-input-number v-model="newVersionData.safe_visibility" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="functional_visibility" prop="functional_visibility">
            <el-input-number v-model="newVersionData.functional_visibility" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="perf" prop="perf">
            <el-input-number v-model="newVersionData.perf" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="limit_visibility" prop="limit_visibility">
            <el-input-number v-model="newVersionData.limit_visibility" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="perf2" prop="perf2">
            <el-input-number v-model="newVersionData.perf2" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="profile_type_1" prop="profile_type_1">
            <el-input-number v-model="newVersionData.profile_type_1" :precision="0" :controls="false" />
          </el-form-item>
          <el-form-item label="runing_profile_1" prop="runing_profile_1">
            <el-input-number v-model="newVersionData.runing_profile_1" :precision="0" :controls="false" />
          </el-form-item>
        </template>
        <!-- Track文件夹的表单项 - 未来可以在这里添加 -->
      </el-form>
      <span slot="footer">
        <el-button @click="showNewVersionDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingVersion" @click="submitNewVersion">确认</el-button>
      </span>
    </el-dialog>

    <!-- 主体内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧侧边栏 -->
      <el-col :span="6">
        <el-card class="folder-sidebar">
          <div slot="header" class="clearfix">
            <div class="folder-header">
              <span>文件夹</span>
              <div class="search-wrapper">
                <el-input
                  v-model="filterText"
                  size="small"
                  placeholder="搜索文件或文件夹"
                  prefix-icon="el-icon-search"
                  clearable
                  @clear="clearFilter"
                />
              </div>
            </div>
          </div>
          <!-- 使用el-menu代替el-tree -->
          <el-menu
            :default-active="activeMenuIndex"
            class="folder-menu"
            :default-openeds="expandedFolders"
            @select="handleMenuSelect"
          >
            <template v-for="folder in folderTreeData">
              <el-submenu
                :key="folder.id"
                :index="folder.id"
                :popper-append-to-body="false"
                :data-folder-id="folder.id"
              >
                <template slot="title">
                  <div class="folder-title" @click.stop="handleMenuClick(folder.id, $event)">
                    <i class="el-icon-folder" style="color: #e6a23c;" />
                    <span class="folder-name">{{ folder.label }}</span>
                    <i
                      v-if="isPermanentlyExpanded(folder.id)"
                      class="el-icon-lock"
                      style="margin-left: auto; font-size: 12px; color: #909399;"
                    />
                    <i v-if="folder.id === 'folder-running' && loadingFiles" class="el-icon-loading" style="margin-left: 5px;" />
                  </div>
                </template>
                <!-- 文件列表 -->
                <el-menu-item
                  v-for="file in folder.children"
                  :key="file.id"
                  :index="file.id"
                >
                  <i class="el-icon-document" style="color: #909399;" />
                  <span>{{ file.label }}</span>
                </el-menu-item>
              </el-submenu>
            </template>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧主内容区 -->
      <el-col :span="18" class="right-panel">
        <div class="right-container">
          <!-- 操作按钮区域 -->
          <div class="excel-control">
            <div v-if="activeFolderId" class="excel-header">
              <h3 class="excel-title">
                {{ getActiveFolderName() }} <span v-if="projectInfo" class="project-info">(项目: {{ projectInfo.project_name }}, 项目版本: {{ projectInfo.version }})</span>
              </h3>
            </div>

            <!-- 操作按钮区域 -->
            <div v-if="activeFolderId" class="button-group">
              <!-- 查看所有文件下拉按钮 -->
              <el-dropdown trigger="click" @command="handleViewAllFiles">
                <el-button type="info" class="flat-button view-all-btn">
                  查看所有文件 <i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-for="file in currentFolderFiles"
                    :key="file.id"
                    :command="file.id"
                  >
                    {{ file.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>

              <el-button
                type="success"
                class="flat-button add-version-btn"
                @click="handleAddNewVersion"
              >新增文件版本</el-button>
              <el-button
                type="danger"
                class="flat-button delete-btn"
                :disabled="!activeFile"
                @click="handleDeleteFile"
              >删除当前文件</el-button>
              <el-button
                type="success"
                class="flat-button api-save-btn"
                :disabled="!activeFile"
                :loading="savingToBackend"
                @click="handleSaveToBackend"
              >保存到后端</el-button>
            </div>
          </div>

          <!-- 未选择文件夹时的提示 -->
          <div v-if="!activeFolderId" class="empty-content">
            <i class="el-icon-folder-opened" />
            <p>请选择左侧的文件夹查看内容</p>
          </div>

          <!-- 工作表内容区域 -->
          <div v-if="activeFile && activeFolderId">
            <!-- 工作表选择器 - 修改样式 -->
            <div class="sheet-toolbar">
              <div class="toolbar-left">
                <span class="toolbar-label">选择工作表</span>
                <el-select
                  v-model="activeSheet"
                  placeholder="请选择工作表"
                  size="small"
                  class="sheet-select"
                  @change="handleSheetChange"
                >
                  <!-- Track文件夹下的7个工作表 -->
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="总体参数(Gen. Param.)"
                    value="GenParam"
                  />
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="长短链(Tracks)"
                    value="Tracks"
                  />
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="坡度(Gradient)"
                    value="Gradient"
                  />
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="车站(Stations)"
                    value="Stations"
                  />
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="线路限速(PSR)"
                    value="PSR"
                  />
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="分相区(Unbridgeable gap)"
                    value="UnbridgeableGap"
                  />
                  <el-option
                    v-if="activeFolderId === 'folder-track'"
                    label="轨道区段(Block description)"
                    value="BlockDescription"
                  />

                  <!-- Running_profile文件夹下的1个工作表 -->
                  <el-option
                    v-if="activeFolderId === 'folder-running'"
                    label="Running list"
                    value="RunningList"
                  />
                </el-select>
                <el-button
                  v-if="activeSheet !== 'GenParam'"
                  size="small"
                  type="primary"
                  icon="el-icon-plus"
                  class="insert-btn"
                  @click="handleInsertLastRow"
                >下行插入</el-button>
                <el-dropdown
                  v-if="activeSheet === 'RunningList'"
                  trigger="click"
                  @command="handleCalculateCommand"
                >
                  <el-button
                    size="small"
                    type="warning"
                    icon="el-icon-cpu"
                    class="calc-all-btn"
                    style="margin-left: 8px;"
                  >
                    计算所有行 <i class="el-icon-arrow-down el-icon--right" />
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="travelTime">计算通行时间</el-dropdown-item>
                    <el-dropdown-item command="minHeadway" :disabled="!globalTravelTimeCalculated">计算最小间隔时间</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </div>

            <!-- 工作表内容 - 直接使用组件，不添加额外标题 -->
            <div class="sheet-content">
              <component
                :is="activeSheet"
                ref="currentComponent"
                :active-sheet="activeSheet"
                :file-data="activeFileData"
                @insert-row="handleInsertRow"
                @travel-time-calculated="handleTravelTimeCalculated"
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import GenParam from './components/GenParam'
import Tracks from './components/Tracks'
import Gradient from './components/Gradient'
import Stations from './components/Stations'
import PSR from './components/PSR'
import UnbridgeableGap from './components/UnbridgeableGap'
import BlockDescription from './components/BlockDescription'
import RunningList from './components/RunningList'
import { getRunningList, createRunningProfile, deleteRunningProfile, updateRunningProfile } from '../../../api/runningprofile'

export default {
  name: 'Track0607',
  components: {
    GenParam,
    Tracks,
    Gradient,
    Stations,
    PSR,
    UnbridgeableGap,
    BlockDescription,
    RunningList
  },
  data() {
    return {
      filterText: '',
      activeMenuIndex: '',
      expandedFolders: [],
      permanentlyExpandedFolders: [],
      activeFolderId: '',
      projectId: null,
      projectInfo: null,
      // 固定的两个文件夹
      folderTreeData: [
        {
          id: 'folder-track',
          label: 'Track',
          children: [
            { id: 'track-file-1', label: '示例轨道文件1' },
            { id: 'track-file-2', label: '示例轨道文件2' }
          ]
        },
        {
          id: 'folder-running',
          label: 'Running_profile',
          children: [
            { id: 'running-file-1', label: '示例运行文件1' },
            { id: 'running-file-2', label: '示例运行文件2' }
          ]
        }
      ],
      // 当前选中的文件
      activeFile: null,
      // 当前选中文件的数据
      activeFileData: null,
      // 当前选中的工作表
      activeSheet: '',
      // 新增表单对话框相关数据
      showRowDialog: false,
      newRowData: {},
      currentHeaders: [],
      insertPosition: -1,
      // 是否正在加载文件列表
      loadingFiles: false,
      // 新增文件版本相关数据
      showNewVersionDialog: false,
      submittingVersion: false,
      newVersionData: {
        name: '',
        departure_station_name: 'string',
        departure_station_distance: 0,
        arrival_station_name: 'string',
        arrival_station_distance: 0,
        performance_objective: 0,
        safe_visibility: 0,
        functional_visibility: 0,
        perf: 0,
        limit_visibility: 0,
        perf2: 0,
        track: 'string',
        train: 'string',
        train_load: true,
        profile_type_1: 0,
        runing_profile_1: 0,
        min_version: 0,
        max_version: 0,
        creator: 0,
        revisor: 0,
        project_id: 0
      },
      savingToBackend: false,
      currentFolderFiles: [], // 当前文件夹下的文件列表
      globalTravelTimeCalculated: false
    }
  },
  computed: {
    // 根据活动工作表获取对应表头
    getActiveComponentHeaders() {
      if (!this.activeSheet) return []

      // 根据活动工作表返回不同的表头数据
      switch (this.activeSheet) {
        case 'GenParam':
          return [
            { prop: 'paramName', label: '参数名称' },
            { prop: 'value', label: '值' },
            { prop: 'description', label: '描述' }
          ]
        case 'Tracks':
          return [
            { prop: 'Track_ID_before_jump', label: 'Track_ID_before_jump' },
            { prop: 'Track_ID_after_jump', label: 'Track_ID_after_jump' },
            { prop: 'KP_before_jump', label: 'KP_before_jump' },
            { prop: 'KP_after_jump', label: 'KP_after_jump' }
          ]
        case 'Gradient':
          return [
            { prop: 'KP', label: 'KP (m)' },
            { prop: 'slope', label: '坡度 (%)' }
          ]
        case 'Stations':
          return [
            { prop: 'KP_of_platform_center', label: 'KP of platform center' },
            { prop: 'Name_of_station', label: 'Name of station' }
          ]
        case 'PSR':
          return [
            { prop: 'KP', label: 'KP (m)' },
            { prop: 'PSR', label: 'PSR (km/h)' }
          ]
        case 'BlockDescription':
          return [
            { prop: 'Rule', label: 'Rule' },
            { prop: 'SubBlock_Start', label: 'Start_KP' },
            { prop: 'SubBlock_End', label: 'End' },
            { prop: 'SubBlock_Track', label: 'Track' },
            { prop: 'Overlap_Value', label: 'Value' },
            { prop: 'Overlap_Track', label: 'Track' },
            { prop: 'Overlap_Sens', label: 'Sens' }
          ]
        case 'UnbridgeableGap':
          return [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Unbridgable_gap', label: 'Unbridgable_gap' }
          ]
        case 'RunningList':
          return [
            { prop: 'departureStation', label: 'Departure Station name' },
            { prop: 'departureDistance', label: 'Departure Station Distance' },
            { prop: 'arrivalStation', label: 'Arrival Station name' },
            { prop: 'arrivalDistance', label: 'Arrival Station Distance' }
          ]
        default:
          return []
      }
    }
  },
  watch: {
    // 监听搜索关键字变化
    filterText(val) {
      this.applyMenuFilter(val)
    }
  },
  created() {
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
          document.title = `${this.projectInfo.project_name || '项目'} - 轨道数据`
        } catch (e) {
          console.error('解析项目信息出错:', e)
        }
      }
    }
  },
  methods: {
    goBack() {
      this.$router.push('/excelInput/project')
    },
    clearFilter() {
      this.filterText = ''
      this.applyMenuFilter('')
    },
    applyMenuFilter(value) {
      if (!value || value.trim() === '') {
        // 如果没有搜索值，显示所有菜单项
        this.showAllMenuItems()
        return
      }

      const searchText = value.toLowerCase().trim()

      // 遍历所有菜单项，筛选匹配的
      const menuItems = document.querySelectorAll('.folder-menu .el-submenu')
      menuItems.forEach(submenu => {
        const folderName = submenu.querySelector('.folder-name').textContent.toLowerCase()
        const menuFiles = Array.from(submenu.querySelectorAll('.el-menu-item span')).map(el => el.textContent.toLowerCase())

        // 如果文件夹名称匹配或者任何文件名匹配，则显示此菜单
        const folderMatch = folderName.includes(searchText)
        const fileMatch = menuFiles.some(fileName => fileName.includes(searchText))

        if (folderMatch || fileMatch) {
          submenu.style.display = ''

          // 如果是文件匹配，需要展开父菜单
          if (fileMatch && !folderMatch) {
            const submenuTitle = submenu.querySelector('.el-submenu__title')
            if (submenuTitle) {
              // 模拟鼠标悬停展开菜单
              const event = new MouseEvent('mouseenter', {
                bubbles: true,
                cancelable: true,
                view: window
              })
              submenuTitle.dispatchEvent(event)
            }
          }

          // 只显示匹配的文件
          const menuItemList = submenu.querySelectorAll('.el-menu-item')
          menuItemList.forEach(item => {
            const fileName = item.querySelector('span').textContent.toLowerCase()
            item.style.display = fileName.includes(searchText) ? '' : 'none'
          })
        } else {
          submenu.style.display = 'none'
        }
      })
    },
    showAllMenuItems() {
      const menuItems = document.querySelectorAll('.folder-menu .el-submenu, .folder-menu .el-menu-item')
      menuItems.forEach(item => {
        item.style.display = ''
      })
    },
    isPermanentlyExpanded(folderId) {
      return this.permanentlyExpandedFolders.includes(folderId)
    },
    handleMenuClick(folderId, event) {
      event.stopPropagation()
      this.activeFolderId = folderId

      const isPermanent = this.permanentlyExpandedFolders.includes(folderId)

      // 如果文件夹已经固定展开，则取消固定并收起
      if (isPermanent) {
        this.permanentlyExpandedFolders = this.permanentlyExpandedFolders.filter(id => id !== folderId)
        this.expandedFolders = this.expandedFolders.filter(id => id !== folderId)

        this.$nextTick(() => {
          const lockIcon = document.querySelector(`.el-submenu[data-folder-id="${folderId}"] .el-icon-lock`)
          if (lockIcon) {
            lockIcon.style.display = 'none'
          }
        })
      } else {
        // 如果文件夹未展开，则展开并固定
        if (!this.permanentlyExpandedFolders.includes(folderId)) {
          this.permanentlyExpandedFolders.push(folderId)
        }
        if (!this.expandedFolders.includes(folderId)) {
          this.expandedFolders.push(folderId)
        }

        this.$nextTick(() => {
          const submenu = document.querySelector(`.el-submenu[data-folder-id="${folderId}"]`)
          if (submenu) {
            let lockIcon = submenu.querySelector('.el-icon-lock')
            if (!lockIcon) {
              const folderTitle = submenu.querySelector('.folder-title')
              if (folderTitle) {
                lockIcon = document.createElement('i')
                lockIcon.className = 'el-icon-lock'
                lockIcon.style.marginLeft = 'auto'
                lockIcon.style.fontSize = '12px'
                lockIcon.style.color = '#909399'
                folderTitle.appendChild(lockIcon)
              }
            } else {
              lockIcon.style.display = ''
            }
          }
        })
      }

      // 如果点击的是Running_profile文件夹，调用API获取文件列表
      if (folderId === 'folder-running') {
        this.fetchRunningFiles()
      }

      // 更新当前文件夹文件列表
      this.updateCurrentFolderFiles()
    },
    handleMenuSelect(index) {
      console.log('选中菜单项:', index)
      // 判断选中的是文件夹还是文件
      if (index.startsWith('folder-')) {
        this.activeFolderId = index
        this.activeFile = null
        this.activeFileData = null
        this.activeSheet = ''
      } else {
        // 处理文件选择
        const folderId = this.getFolderIdByFileId(index)
        if (folderId) {
          this.activeFolderId = folderId
          const selectedFile = this.findFileById(index)
          this.activeFile = selectedFile

          // 设置当前文件数据，如果是从API获取的文件，则data属性中包含完整数据
          if (selectedFile && selectedFile.data) {
            this.activeFileData = selectedFile.data
          } else {
            this.activeFileData = null
          }

          // 根据所选文件所在的文件夹设置默认工作表
          if (folderId === 'folder-track') {
            this.activeSheet = 'GenParam'
          } else if (folderId === 'folder-running') {
            this.activeSheet = 'RunningList'
          }
        }
      }
    },
    findFileById(fileId) {
      for (const folder of this.folderTreeData) {
        const file = folder.children.find(file => file.id === fileId)
        if (file) {
          return file
        }
      }
      return null
    },
    getFolderIdByFileId(fileId) {
      for (const folder of this.folderTreeData) {
        const fileExists = folder.children.some(file => file.id === fileId)
        if (fileExists) {
          return folder.id
        }
      }
      return null
    },
    getActiveFolderName() {
      const folder = this.folderTreeData.find(f => f.id === this.activeFolderId)
      return folder ? folder.label : ''
    },
    // 工作表切换处理
    handleSheetChange(value) {
      this.activeSheet = value
    },
    // 新增方法:在末尾添加新行
    handleInsertLastRow() {
      this.newRowData = {}
      this.insertPosition = -1

      // 设置显示的字段
      this.currentHeaders = this.getActiveComponentHeaders

      // 显示表单对话框
      this.showRowDialog = true
    },

    // 新增方法:在指定位置插入新行
    handleInsertRow(index) {
      this.newRowData = {}
      this.insertPosition = index

      // 设置显示的字段
      this.currentHeaders = this.getActiveComponentHeaders

      // 显示表单对话框
      this.showRowDialog = true
    },

    // 新增方法:提交新增行表单
    submitRowForm() {
      // 构建事件数据，传递给子组件
      const rowData = {
        ...this.newRowData,
        index: this.insertPosition
      }

      // 通过事件通知子组件添加新行
      this.$root.$emit('add-new-row', this.activeSheet, rowData)

      // 关闭对话框
      this.showRowDialog = false
    },

    // 添加获取Running Profile文件列表的方法
    fetchRunningFiles() {
      if (!this.projectId) return

      this.loadingFiles = true

      const params = {
        project_id: parseInt(this.projectId) || 0,
        version: this.projectInfo ? parseInt(this.projectInfo.version) : 1,
        user_id: this.$store.getters.userId || 0
      }

      getRunningList(params)
        .then(response => {
          const runningFolder = this.folderTreeData.find(folder => folder.id === 'folder-running')
          if (runningFolder) {
            runningFolder.children = response.map(item => ({
              id: `running-file-${item.idx}`,
              label: item.name,
              data: item
            }))
            // 更新当前文件夹文件列表
            this.updateCurrentFolderFiles()
          }
        })
        .catch(error => {
          console.error('获取Running Profile文件列表失败:', error)
          this.$message.error('获取文件列表失败，请重试')
        })
        .finally(() => {
          this.loadingFiles = false
        })
    },

    // 处理添加新版本按钮点击
    handleAddNewVersion() {
      // 重置表单数据
      this.resetNewVersionForm()

      // 根据当前文件夹设置默认值
      if (this.activeFolderId === 'folder-running') {
        this.newVersionData.name = `新建运行文件_${new Date().getTime()}`
        this.newVersionData.project_id = this.projectId || 0
      } else if (this.activeFolderId === 'folder-track') {
        // Track文件夹的默认值设置 - 未来可以在这里添加
      }

      // 显示对话框
      this.showNewVersionDialog = true
    },

    // 重置新版本表单
    resetNewVersionForm() {
      this.newVersionData = {
        name: '',
        departure_station_name: 'string',
        departure_station_distance: 0,
        arrival_station_name: 'string',
        arrival_station_distance: 0,
        performance_objective: 0,
        safe_visibility: 0,
        functional_visibility: 0,
        perf: 0,
        limit_visibility: 0,
        perf2: 0,
        track: 'string',
        train: 'string',
        train_load: true,
        profile_type_1: 0,
        runing_profile_1: 0,
        min_version: 0,
        max_version: 0,
        creator: 0,
        revisor: 0,
        project_id: 0
      }
    },

    // 提交新版本表单
    submitNewVersion() {
      // 根据当前文件夹类型调用不同的API
      if (this.activeFolderId === 'folder-running') {
        this.submittingVersion = true

        // 准备URL查询参数，从系统中获取而不是硬编码
        const params = {
          project_id: parseInt(this.projectId) || 0,
          version: this.projectInfo ? parseInt(this.projectInfo.version) : 1,
          user_id: this.$store.getters.userId || 0
        }

        // 设置项目ID (在请求体中也需要包含)
        this.newVersionData.project_id = params.project_id

        // 调用API创建Running Profile文件
        createRunningProfile(this.newVersionData, params)
          .then(response => {
            this.$message.success('新文件版本创建成功')
            this.showNewVersionDialog = false

            // 刷新文件列表
            this.fetchRunningFiles()
          })
          .catch(error => {
            console.error('创建新文件版本失败:', error)
            this.$message.error('创建新文件版本失败，请重试')
          })
          .finally(() => {
            this.submittingVersion = false
          })
      } else if (this.activeFolderId === 'folder-track') {
        // Track文件夹的API调用 - 未来可以在这里添加
        this.$message.info('Track文件夹的新增文件版本功能尚未实现')
      }
    },
    // 处理删除当前文件
    handleDeleteFile() {
      if (!this.activeFile) return

      // 确认删除
      this.$confirm(`确认删除文件 "${this.activeFile.label}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        if (this.activeFolderId === 'folder-running') {
          // 获取要删除的Running Profile文件ID
          const fileId = this.activeFile.data ? this.activeFile.data.idx : null
          if (!fileId) {
            this.$message.error('无法获取文件ID，删除失败')
            return
          }

          // 获取用户ID
          const userId = this.$store.getters.userId || 0

          // 调用删除API
          deleteRunningProfile(fileId, userId)
            .then(response => {
              this.$message.success('文件删除成功')

              // 清除当前选中文件
              this.activeFile = null
              this.activeFileData = null

              // 刷新文件列表
              this.fetchRunningFiles()
            })
            .catch(error => {
              console.error('删除文件失败:', error)
              this.$message.error('删除文件失败，请重试')
            })
        } else if (this.activeFolderId === 'folder-track') {
          // Track文件夹的删除API调用 - 未来可以在这里添加
          this.$message.info('Track文件夹的删除功能尚未实现')
        }
      }).catch(() => {
        // 取消删除
      })
    },
    handleSaveToBackend() {
      if (!this.activeFile || !this.activeFileData) {
        this.$message.warning('当前没有选中文件或文件数据为空')
        return
      }

      this.savingToBackend = true

      if (this.activeFolderId === 'folder-running') {
        // 获取要更新的Running Profile文件ID
        const fileId = this.activeFileData.idx
        if (!fileId) {
          this.$message.error('无法获取文件ID，保存失败')
          this.savingToBackend = false
          return
        }

        // 获取用户ID
        const userId = this.$store.getters.userId || 0

        // 准备保存数据 - 获取组件中的最新数据
        const componentInstance = this.$refs.currentComponent
        let updatedData = { ...this.activeFileData }

        // 如果组件实例存在并且有sheetData
        if (componentInstance && componentInstance.sheetData && componentInstance.sheetData.length > 0) {
          // 将组件中的数据合并到updatedData中
          const sheetData = componentInstance.sheetData[0]
          updatedData = {
            ...updatedData,
            departure_station_name: sheetData.departure_station_name,
            departure_station_distance: sheetData.departure_station_distance,
            arrival_station_name: sheetData.arrival_station_name,
            arrival_station_distance: sheetData.arrival_station_distance,
            track: sheetData.track,
            train: sheetData.train,
            train_load: sheetData.train_load
          }
        }

        // 调用更新API
        updateRunningProfile(fileId, updatedData, userId)
          .then(response => {
            this.$message.success('文件保存成功')

            // 更新当前文件数据
            this.activeFileData = response

            // 刷新文件列表
            this.fetchRunningFiles()
          })
          .catch(error => {
            console.error('保存文件失败:', error)
            this.$message.error('保存文件失败，请重试')
          })
          .finally(() => {
            this.savingToBackend = false
          })
      } else if (this.activeFolderId === 'folder-track') {
        // Track文件夹的保存API调用 - 未来可以在这里添加
        this.$message.info('Track文件夹的保存功能尚未实现')
        this.savingToBackend = false
      }
    },
    // 处理查看所有文件
    handleViewAllFiles(fileId) {
      if (this.activeFolderId === 'folder-running') {
        // 获取要查看的Running Profile文件ID
        const selectedFile = this.findFileById(fileId)
        if (selectedFile) {
          this.activeFile = selectedFile
          this.activeFileData = selectedFile.data
          this.activeSheet = 'RunningList'
        }
      } else if (this.activeFolderId === 'folder-track') {
        // 处理Track文件夹的文件选择
        const selectedFile = this.findFileById(fileId)
        if (selectedFile) {
          this.activeFile = selectedFile
          this.activeFileData = selectedFile.data
          this.activeSheet = 'GenParam'
        }
      }
    },
    // 更新当前文件夹文件列表
    updateCurrentFolderFiles() {
      const folder = this.folderTreeData.find(f => f.id === this.activeFolderId)
      if (folder) {
        this.currentFolderFiles = folder.children
      } else {
        this.currentFolderFiles = []
      }
    },
    // 处理计算所有行命令
    handleCalculateCommand(command) {
      if (command === 'travelTime') {
        this.$refs.currentComponent.calculateAllTravelTime()
      } else if (command === 'minHeadway') {
        this.$refs.currentComponent.calculateAllMinHeadway()
      }
    },
    // 处理通行时间计算完成事件
    handleTravelTimeCalculated(value) {
      this.globalTravelTimeCalculated = value
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
</style>
