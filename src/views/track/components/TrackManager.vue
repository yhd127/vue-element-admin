<template>
  <div class="track-manager">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>土建参数管理</span>
        <el-button-group style="float: right;">
          <el-button size="mini" type="primary" @click="calculateAll">更新所有计算</el-button>
          <el-button size="mini" type="success" @click="saveData">保存</el-button>
        </el-button-group>
      </div>

      <el-form :model="trackForm" label-width="120px" size="small">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="方向">
              <el-select v-model="trackForm.direction" placeholder="请选择方向">
                <el-option label="上行" :value="1" />
                <el-option label="下行" :value="-1" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高速值">
              <el-input-number
                v-model="trackForm.highSpeed"
                :min="0"
                :max="500"
                :step="5"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="低速值">
              <el-input-number
                v-model="trackForm.lowSpeed"
                :min="0"
                :max="200"
                :step="5"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="基础延误时间">
              <el-input-number
                v-model="trackForm.baseDelay"
                :min="0"
                :max="1000"
                :step="10"
              />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="当前文件">
              <el-input v-model="trackForm.currentFile" readonly>
                <el-button slot="append" icon="el-icon-folder-opened" @click="toggleImportExport" />
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="showImportExport">
        <data-import-export
          :available-tables="availableTables"
          :data-source="allData"
          @import-start="loading = true"
          @import-end="loading = false"
          @import-success="handleImportSuccess"
          @import-error="handleImportError"
          @export-success="handleExportSuccess"
        />
      </div>

      <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
        <el-tab-pane label="轨道数据" name="tracks">
          <track-table
            title="轨道数据"
            :columns="trackColumns"
            :data="tracksData"
            :loading="loading"
            :initial-row-template="trackRowTemplate"
            @add-row="addTrackRow"
            @delete-rows="deleteTrackRows"
            @cell-change="handleTrackCellChange"
          />
        </el-tab-pane>

        <el-tab-pane label="坡度数据" name="gradients">
          <track-table
            title="坡度数据"
            :columns="gradientColumns"
            :data="gradientsData"
            :loading="loading"
            :initial-row-template="gradientRowTemplate"
            @add-row="addGradientRow"
            @delete-rows="deleteGradientRows"
            @cell-change="handleGradientCellChange"
          />
        </el-tab-pane>

        <el-tab-pane label="曲线数据" name="curves">
          <track-table
            title="曲线数据"
            :columns="curveColumns"
            :data="curvesData"
            :loading="loading"
            :initial-row-template="curveRowTemplate"
            @add-row="addCurveRow"
            @delete-rows="deleteCurveRows"
            @cell-change="handleCurveCellChange"
          />
        </el-tab-pane>

        <el-tab-pane label="站台数据" name="stations">
          <track-table
            title="站台数据"
            :columns="stationColumns"
            :data="stationsData"
            :loading="loading"
            :initial-row-template="stationRowTemplate"
            @add-row="addStationRow"
            @delete-rows="deleteStationRows"
            @cell-change="handleStationCellChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import TrackTable from './TrackTable'
import DataImportExport from './DataImportExport'
import { debounce, deepClone } from '@/utils/track/commonUtils'
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/track/fileUtils'
import { calculateJumpLength, calculateCorrectionValues, calculateDistanceFromOrigin, updateTrackRowsAfterInsert } from '@/utils/track/trackCalculations'
import { updateAllGradientFields } from '@/utils/track/gradientCalculations'
import { updateAllCurveFields } from '@/utils/track/curveCalculations'
import { updateAllStationFields } from '@/utils/track/stationCalculations'

export default {
  name: 'TrackManager',
  components: {
    TrackTable,
    DataImportExport
  },
  props: {
    projectId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      activeTab: 'tracks',
      showImportExport: false,
      trackForm: {
        direction: 1, // 1: 上行, -1: 下行
        highSpeed: 80, // 高速值，用于计算曲线的Cant不足量
        lowSpeed: 30, // 低速值，用于计算曲线的Cant过剩量
        baseDelay: 180, // 基础延误时间，用于计算站台延误
        currentFile: '未保存的文件'
      },

      // 轨道数据
      tracksData: [],
      // 坡度数据
      gradientsData: [],
      // 曲线数据
      curvesData: [],
      // 站台数据
      stationsData: [],

      // 表格列定义
      trackColumns: [
        { prop: 'Track_ID_before_jump', label: '轨道ID(起)', width: '120' },
        { prop: 'Track_ID_after_jump', label: '轨道ID(终)', width: '120' },
        { prop: 'KP_before_jump', label: 'KP值(起)', width: '120' },
        { prop: 'KP_after_jump', label: 'KP值(终)', width: '120' },
        { prop: 'Jump_length', label: '跳跃长度', width: '120', readonly: true },
        { prop: 'Correction_applied_to_KP', label: 'KP修正值', width: '120', readonly: true },
        { prop: 'Distance_from_origin', label: '距离', width: '120', readonly: true }
      ],

      gradientColumns: [
        { prop: 'KP', label: 'KP值', width: '100' },
        { prop: 'T1', label: 'T1', width: '80', readonly: true },
        { prop: 'T2', label: 'T2', width: '80', readonly: true },
        { prop: 'Track1', label: '轨道1', width: '100' },
        { prop: 'Track2', label: '轨道2', width: '100', readonly: true },
        { prop: 'KP_correction', label: 'KP修正', width: '100', readonly: true },
        { prop: 'Distance', label: '距离', width: '100', readonly: true },
        { prop: 'slope', label: '坡度值', width: '100' },
        { prop: 'Slope_permille', label: '坡度(‰)', width: '100', readonly: true }
      ],

      curveColumns: [
        { prop: 'KP', label: 'KP值', width: '100' },
        { prop: 'T1', label: 'T1', width: '80', readonly: true },
        { prop: 'T2', label: 'T2', width: '80', readonly: true },
        { prop: 'Track1', label: '轨道1', width: '100' },
        { prop: 'Track2', label: '轨道2', width: '100', readonly: true },
        { prop: 'KP_correction', label: 'KP修正', width: '100', readonly: true },
        { prop: 'Distance', label: '距离', width: '100', readonly: true },
        { prop: 'radius', label: '曲线半径', width: '100' },
        { prop: 'Radius', label: '半径值', width: '100', readonly: true },
        { prop: 'Cant', label: '超高值', width: '100' },
        { prop: 'CantActual', label: '实际超高', width: '100', readonly: true },
        { prop: 'CantDeficiency', label: '超高不足', width: '100', readonly: true },
        { prop: 'CantExcess', label: '超高过剩', width: '100', readonly: true }
      ],

      stationColumns: [
        { prop: 'KP', label: 'KP值', width: '100' },
        { prop: 'T1', label: 'T1', width: '80', readonly: true },
        { prop: 'T2', label: 'T2', width: '80', readonly: true },
        { prop: 'Track1', label: '轨道1', width: '100' },
        { prop: 'Track2', label: '轨道2', width: '100', readonly: true },
        { prop: 'KP_correction', label: 'KP修正', width: '100', readonly: true },
        { prop: 'Distance', label: '距离', width: '100', readonly: true },
        { prop: 'Station_name', label: '站名', width: '150' },
        { prop: 'Station_type', label: '站点类型', width: '100' },
        { prop: 'Station_class', label: '站点等级', width: '100' },
        { prop: 'Stopping_accuracy', label: '停车精度', width: '100', readonly: true },
        { prop: 'Delay', label: '延误时间', width: '100', readonly: true }
      ],

      // 行模板
      trackRowTemplate: {
        Track_ID_before_jump: '',
        Track_ID_after_jump: '',
        KP_before_jump: '',
        KP_after_jump: '',
        Jump_length: '',
        Correction_applied_to_KP: '',
        Distance_from_origin: ''
      },

      gradientRowTemplate: {
        KP: '',
        T1: '',
        T2: '',
        Track1: '',
        Track2: '',
        KP_correction: '',
        Distance: '',
        slope: '',
        Slope_permille: ''
      },

      curveRowTemplate: {
        KP: '',
        T1: '',
        T2: '',
        Track1: '',
        Track2: '',
        KP_correction: '',
        Distance: '',
        radius: '',
        Radius: '',
        Cant: '',
        CantActual: '',
        CantDeficiency: '',
        CantExcess: ''
      },

      stationRowTemplate: {
        KP: '',
        T1: '',
        T2: '',
        Track1: '',
        Track2: '',
        KP_correction: '',
        Distance: '',
        Station_name: '',
        Station_type: '',
        Station_class: '',
        Stopping_accuracy: '',
        Delay: ''
      }
    }
  },
  computed: {
    availableTables() {
      return [
        { label: '轨道数据', value: 'tracks' },
        { label: '坡度数据', value: 'gradients' },
        { label: '曲线数据', value: 'curves' },
        { label: '站台数据', value: 'stations' }
      ]
    },
    allData() {
      return {
        tracks: this.tracksData,
        gradients: this.gradientsData,
        curves: this.curvesData,
        stations: this.stationsData,
        settings: this.trackForm
      }
    }
  },
  watch: {
    'trackForm.direction': {
      handler: debounce(function() {
        this.calculateAll()
      }, 500)
    },
    'trackForm.highSpeed': {
      handler: debounce(function() {
        this.calculateCurveFields()
      }, 500)
    },
    'trackForm.lowSpeed': {
      handler: debounce(function() {
        this.calculateCurveFields()
      }, 500)
    },
    'trackForm.baseDelay': {
      handler: debounce(function() {
        this.calculateStationFields()
      }, 500)
    }
  },
  created() {
    // 尝试从本地存储加载数据
    this.loadFromStorage()

    // 如果提供了项目ID，则从API加载数据
    if (this.projectId) {
      this.loadProjectData(this.projectId)
    }
  },
  methods: {
    // 切换导入导出面板
    toggleImportExport() {
      this.showImportExport = !this.showImportExport
    },

    // 处理标签页变化
    handleTabChange() {
      // 每次切换标签页时，确保当前数据已更新
      this.calculateAll()
    },

    // 计算所有数据字段
    calculateAll() {
      this.calculateTrackFields()
      this.calculateGradientFields()
      this.calculateCurveFields()
      this.calculateStationFields()
    },

    // 计算轨道数据字段
    calculateTrackFields() {
      // 计算每行的跳跃长度
      this.tracksData.forEach(row => {
        row.Jump_length = calculateJumpLength(row)
      })

      // 计算每行的KP修正值
      calculateCorrectionValues(this.tracksData)

      // 计算每行的距离
      this.tracksData.forEach(row => {
        row.Distance_from_origin = calculateDistanceFromOrigin(row, this.trackForm.direction)
      })
    },

    // 计算坡度数据字段
    calculateGradientFields() {
      updateAllGradientFields(this.gradientsData, this.tracksData, this.trackForm.direction)
    },

    // 计算曲线数据字段
    calculateCurveFields() {
      updateAllCurveFields(
        this.curvesData,
        this.tracksData,
        this.trackForm.direction,
        this.trackForm.highSpeed,
        this.trackForm.lowSpeed
      )
    },

    // 计算站台数据字段
    calculateStationFields() {
      updateAllStationFields(
        this.stationsData,
        this.tracksData,
        this.trackForm.direction,
        this.trackForm.baseDelay
      )
    },

    // 添加轨道行
    addTrackRow(row) {
      this.tracksData.push(row)
      // 更新所有相关数据
      this.calculateTrackFields()
    },

    // 删除轨道行
    deleteTrackRows(rows) {
      // 获取要删除的行的索引
      const indices = rows.map(row => this.tracksData.indexOf(row))
      // 从大到小排序索引，以便从后往前删除
      indices.sort((a, b) => b - a)

      // 逐个删除行
      indices.forEach(index => {
        if (index !== -1) {
          this.tracksData.splice(index, 1)
        }
      })

      // 更新所有相关数据
      this.calculateTrackFields()
    },

    // 处理轨道单元格变化
    handleTrackCellChange(row, property) {
      const index = this.tracksData.indexOf(row)
      if (index !== -1) {
        // 更新当前行的计算字段
        row.Jump_length = calculateJumpLength(row)

        // 更新后续行的相关数据
        updateTrackRowsAfterInsert(this.tracksData, index, this.trackForm.direction)

        // 更新其他表的相关字段
        this.calculateGradientFields()
        this.calculateCurveFields()
        this.calculateStationFields()
      }
    },

    // 添加坡度行
    addGradientRow(row) {
      this.gradientsData.push(row)
      // 更新坡度行的计算字段
      this.calculateGradientFields()
    },

    // 删除坡度行
    deleteGradientRows(rows) {
      const indices = rows.map(row => this.gradientsData.indexOf(row))
      indices.sort((a, b) => b - a)

      indices.forEach(index => {
        if (index !== -1) {
          this.gradientsData.splice(index, 1)
        }
      })
    },

    // 处理坡度单元格变化
    handleGradientCellChange(row, property) {
      // 如果改变的是KP或slope字段，重新计算该行
      if (property === 'KP' || property === 'slope' || property === 'Track1') {
        const index = this.gradientsData.indexOf(row)
        if (index !== -1) {
          // 更新单行数据
          const updatedRow = this.gradientsData[index]

          // 重新计算该行的所有字段
          updateAllGradientFields([updatedRow], this.tracksData, this.trackForm.direction)
        }
      }
    },

    // 添加曲线行
    addCurveRow(row) {
      this.curvesData.push(row)
      // 更新曲线行的计算字段
      this.calculateCurveFields()
    },

    // 删除曲线行
    deleteCurveRows(rows) {
      const indices = rows.map(row => this.curvesData.indexOf(row))
      indices.sort((a, b) => b - a)

      indices.forEach(index => {
        if (index !== -1) {
          this.curvesData.splice(index, 1)
        }
      })
    },

    // 处理曲线单元格变化
    handleCurveCellChange(row, property) {
      // 如果改变的是关键字段，重新计算该行
      if (['KP', 'radius', 'Cant', 'Track1'].includes(property)) {
        const index = this.curvesData.indexOf(row)
        if (index !== -1) {
          // 更新单行数据
          const updatedRow = this.curvesData[index]

          // 重新计算该行的所有字段
          updateAllCurveFields(
            [updatedRow],
            this.tracksData,
            this.trackForm.direction,
            this.trackForm.highSpeed,
            this.trackForm.lowSpeed
          )
        }
      }
    },

    // 添加站台行
    addStationRow(row) {
      this.stationsData.push(row)
      // 更新站台行的计算字段
      this.calculateStationFields()
    },

    // 删除站台行
    deleteStationRows(rows) {
      const indices = rows.map(row => this.stationsData.indexOf(row))
      indices.sort((a, b) => b - a)

      indices.forEach(index => {
        if (index !== -1) {
          this.stationsData.splice(index, 1)
        }
      })
    },

    // 处理站台单元格变化
    handleStationCellChange(row, property) {
      // 如果改变的是关键字段，重新计算该行
      if (['KP', 'Station_type', 'Station_class', 'Track1'].includes(property)) {
        const index = this.stationsData.indexOf(row)
        if (index !== -1) {
          // 更新单行数据
          const updatedRow = this.stationsData[index]

          // 重新计算该行的所有字段
          updateAllStationFields(
            [updatedRow],
            this.tracksData,
            this.trackForm.direction,
            this.trackForm.baseDelay
          )
        }
      }
    },

    // 处理导入成功
    handleImportSuccess(importedData) {
      // 清空当前数据
      this.tracksData = []
      this.gradientsData = []
      this.curvesData = []
      this.stationsData = []

      // 加载导入的数据
      if (importedData.tracks) {
        this.tracksData = importedData.tracks
      }

      if (importedData.gradients) {
        this.gradientsData = importedData.gradients
      }

      if (importedData.curves) {
        this.curvesData = importedData.curves
      }

      if (importedData.stations) {
        this.stationsData = importedData.stations
      }

      // 加载设置
      if (importedData.settings) {
        this.trackForm = { ...this.trackForm, ...importedData.settings }
      }

      // 更新当前文件名
      this.trackForm.currentFile = '导入的文件'

      // 重新计算所有字段
      this.calculateAll()
    },

    // 处理导入错误
    handleImportError(error) {
      console.error('导入错误:', error)
    },

    // 处理导出成功
    handleExportSuccess(exportInfo) {
      // 更新当前文件名
      this.trackForm.currentFile = exportInfo.fileName

      // 保存到本地存储
      this.saveToStorage()
    },

    // 保存数据
    saveData() {
      this.saveToStorage()
      this.saveToApi()
      this.$message.success('数据已保存到本地')
    },

    // 保存数据到API
    async saveToApi() {
      try {
        // 先获取或刷新token
        await trackApi.getAuthToken()

        // 保存所有数据到API
        const result = await trackApi.saveAllTrackData(this.allData)

        if (result.success) {
          console.log('数据已保存到API:', result.message)
        } else if (result.needReauth) {
          // 如果需要重新认证，使用固定token再试一次
          trackApi.getFixedToken()
          const retryResult = await trackApi.saveAllTrackData(this.allData)
          console.log('使用固定token重试结果:', retryResult.success ? '成功' : '失败')
        } else {
          console.error('保存到API失败:', result.message)
        }
      } catch (error) {
        console.error('保存到API出错:', error)
      }
    },

    // 加载项目数据
    async loadProjectData(projectId) {
      if (!projectId) return

      try {
        this.loading = true

        // 获取token
        await trackApi.getAuthToken()

        // 从API加载数据
        const result = await trackApi.fetchAllTrackData(projectId)

        if (result.success && result.data) {
          this.handleImportSuccess(result.data)
          this.$message.success('从API加载项目数据成功')
        } else if (result.needReauth) {
          // 如果需要重新认证，使用固定token再试一次
          trackApi.getFixedToken()
          const retryResult = await trackApi.fetchAllTrackData(projectId)

          if (retryResult.success && retryResult.data) {
            this.handleImportSuccess(retryResult.data)
            this.$message.success('从API加载项目数据成功')
          } else {
            this.$message.error('加载项目数据失败:' + (retryResult.message || '未知错误'))
          }
        } else {
          this.$message.error('加载项目数据失败:' + (result.message || '未知错误'))
        }
      } catch (error) {
        console.error('加载项目数据出错:', error)
        this.$message.error('加载项目数据出错:' + error.message)
      } finally {
        this.loading = false
      }
    },

    // 保存到本地存储
    saveToStorage() {
      saveToLocalStorage('track_manager_data', this.allData)
    },

    // 从本地存储加载
    loadFromStorage() {
      const savedData = loadFromLocalStorage('track_manager_data')
      if (savedData) {
        this.handleImportSuccess(savedData)
        this.$message.success('从本地存储加载数据成功')
      }
    }
  }
}
</script>

<style scoped>
.track-manager {
  padding: 10px;
}
</style>
