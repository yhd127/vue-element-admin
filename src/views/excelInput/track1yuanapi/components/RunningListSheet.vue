<template>
  <div class="running-list-sheet">
    <el-table
      :data="sheetData.data"
      :max-height="700"
      :border="true"
      style="width: 100%"
      @cell-dblclick="handleCellDblClick"
    >
      <!-- ID列 -->
      <el-table-column
        prop="id"
        label="ID"
        width="60"
        align="center"
      >
        <template slot-scope="scope">
          <span class="disabled-cell id-cell">{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      
      <!-- 数据列 -->
      <el-table-column
        prop="departureStation"
        label="Departure Station name"
        min-width="180"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.departureStation"
            placeholder="请输入..."
            @input="() => handleInputChange('departureStation', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="departureDistance"
        label="Departure Station Distance"
        min-width="180"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.departureDistance"
            placeholder="请输入..."
            @input="() => handleInputChange('departureDistance', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="arrivalStation"
        label="Arrival Station name"
        min-width="180"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.arrivalStation"
            placeholder="请输入..."
            @input="() => handleInputChange('arrivalStation', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="arrivalDistance"
        label="Arrival Station Distance"
        min-width="180"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.arrivalDistance"
            placeholder="请输入..."
            @input="() => handleInputChange('arrivalDistance', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="track"
        label="Track"
        min-width="120"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.track"
            placeholder="请输入..."
            @input="() => handleInputChange('track', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="train"
        label="Train"
        min-width="120"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.train"
            placeholder="请输入..."
            @input="() => handleInputChange('train', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="trainLoad"
        label="train load [0 1]"
        width="120"
        align="center"
      >
        <template slot-scope="scope">
          <el-input 
            v-model="scope.row.trainLoad" 
            placeholder="请输入..."
            @input="() => handleInputChange('trainLoad', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="stationStopTime"
        label="Station Stop Time"
        min-width="140"
        align="center"
      >
        <template slot-scope="scope">
          <el-input
            v-model="scope.row.stationStopTime"
            placeholder="请输入..."
            @input="() => handleInputChange('stationStopTime', scope.row, scope.$index)"
          ></el-input>
        </template>
      </el-table-column>
      
      <!-- 操作列 - 移到最后，不固定 -->
      <el-table-column label="操作" width="320" align="center">
        <template slot-scope="scope">
          <div class="operation-buttons">
            <el-button
              size="mini"
              :type="getCalculationButtonType(scope.row)"
              @click="handleSingleRowCalculate(scope.row, scope.$index)"
              :loading="isCalculating(scope.row)"
            >{{ getCalculationButtonText(scope.row) }}</el-button>
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-plus"
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

    <!-- 计算功能对话框 -->
    <el-dialog
      title="计算功能"
      :visible.sync="calculationDialogVisible"
      width="80%"
      custom-class="calculation-dialog"
    >
      <div class="calculation-panel-dialog">
        <div class="calculation-header">
          <h3>选择计算类型</h3>
          <p v-if="selectedCalculationRow">正在计算: {{ selectedCalculationRow.data.departureStation }} 到 {{ selectedCalculationRow.data.arrivalStation }}</p>
        </div>
        <el-divider />

        <div class="calculation-content">
          <!-- 左侧：通行时间计算 -->
          <div class="calculation-column">
            <el-button
              type="primary"
              class="calculation-button"
              :disabled="calculationState.travelTime.status === 'warning'"
              @click="calculateTravelTimeForRow"
            >
              计算通行时间
            </el-button>
            
            <el-progress 
              v-if="calculationState.travelTime.status" 
              :percentage="calculationState.travelTime.percentage"
              :status="calculationState.travelTime.status"
              type="circle"
            ></el-progress>
            
            <div v-if="calculationResults.travelTime" class="result-box">
              <div class="result-inner">
                <p class="result-title">结果: {{ calculationResults.travelTime.time }}</p>
                <p class="result-details">{{ calculationResults.travelTime.details }}</p>
              </div>
              
              <div class="result-actions">
                <el-button size="small" @click="exportResultToExcel('travelTime')">
                  输出Excel文件
                </el-button>
                <el-button size="small" @click="exportResultToImage('travelTime')">
                  图片文件
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 分隔线 -->
          <el-divider direction="vertical" class="column-divider"></el-divider>
          
          <!-- 右侧：最小间隔时间计算 -->
          <div class="calculation-column">
            <el-button
              type="primary"
              class="calculation-button"
              :disabled="!calculationState.minHeadway.enabled || calculationState.minHeadway.status === 'warning'"
              @click="calculateMinHeadwayForRow"
            >
              计算最小间隔时间
            </el-button>
            
            <el-progress 
              v-if="calculationState.minHeadway.status" 
              :percentage="calculationState.minHeadway.percentage"
              :status="calculationState.minHeadway.status"
              type="circle"
            ></el-progress>
            
            <div v-if="calculationResults.minHeadway" class="result-box">
              <div class="result-inner">
                <p class="result-title">结果: {{ calculationResults.minHeadway.time }}</p>
                <p class="result-details">{{ calculationResults.minHeadway.details }}</p>
              </div>
              
              <div class="result-actions">
                <el-button size="small" @click="viewDetailResults">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 添加图片预览对话框 -->
    <el-dialog
      :visible.sync="imagePreviewVisible"
      :title="previewImageInfo ? previewImageInfo.title : '图片预览'"
      fullscreen
      :show-close="true"
      :append-to-body="true"
      custom-class="full-screen-image-dialog"
    >
      <div class="full-screen-image-container">
        <img v-if="previewImageInfo" :src="previewImageInfo.path" class="full-screen-image" />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="imagePreviewVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadImageFromPreview">下载图片</el-button>
      </span>
    </el-dialog>
    
    <!-- 添加JSON预览对话框 -->
    <el-dialog
      title="运行配置数据"
      :visible.sync="jsonPreviewVisible"
      :dangerouslyUseHTMLString="true"
      :center="true"
      custom-class="json-preview-dialog"
    >
      <div class="json-preview-container">
        <table class="json-table">
          <tbody>
            <tr v-for="(value, key) in previewJsonData" :key="key">
              <td class="key-cell">{{ key }}</td>
              <td class="value-cell">{{ value === null ? 'null' : value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsonPreviewVisible = false">取消</el-button>
        <el-button type="primary" @click="downloadExcelFile">下载Excel</el-button>
      </span>
    </el-dialog>
    
    <!-- 添加详情表单对话框 -->
    <el-dialog
      title="计算结果详情"
      :visible.sync="detailFormVisible"
      width="80%"
      class="detail-dialog"
    >
      <div class="detail-container">
        <!-- 发车模块 -->
        <div class="detail-module" data-title="发车模块">
          <div class="module-content" style="width: 100%; max-width: 100%;">
            <div class="left-column">
              <div class="label-item">
                <span>发车间隔</span>
                <el-input v-model="detailFormData.module1.intervalTitle" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="middle-column">
              <div class="label-item">
                <span>发车点至出清点时间</span>
                <el-input v-model="detailFormData.module1.time1" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>出清延迟时间</span>
                <el-input v-model="detailFormData.module1.time2" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>发车进路办理时间</span>
                <el-input v-model="detailFormData.module1.time3" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
            </div>
            <div class="right-column">
              <div class="label-item">
                <span>发车时间间隔</span>
                <el-input v-model="detailFormData.module1.interval" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="action-column" style="position: relative; padding: 0; width: 20%;">
              <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 140px;">
                <el-button size="small" type="primary" @click="viewImage(1, 0)" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;">查看图片</el-button>
                <el-button size="small" type="success" @click="exportExcel(1, 0)" style="width: 140px; margin: 0; display: block; box-sizing: border-box;">导出Excel</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 区间模块 (动态生成1-3个) -->
        <div
          v-for="(item, index) in detailFormData.module2"
          :key="`section-${index}`"
          class="detail-module"
          :data-title="`区间模块 ${index + 1}`"
        >
          <div class="module-content" style="width: 100%; max-width: 100%;">
            <div class="left-column">
              <div class="label-item">
                <span>区间间隔</span>
                <el-input v-model="item.intervalTitle" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="section-middle-left">
              <div class="label-item">
                <span>区段起始点</span>
                <el-input v-model="item.startPoint" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
              <div class="label-item">
                <span>区段终点</span>
                <el-input v-model="item.endPoint" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="middle-column">
              <div class="label-item">
                <span>瓶颈点位置</span>
                <el-input v-model="item.bottleneckPosition" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
              <div class="label-item">
                <span>出清点位置</span>
                <el-input v-model="item.clearPosition" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
              <div class="label-item">
                <span>危险点位置</span>
                <el-input v-model="item.dangerPosition" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="section-middle-right">
              <div class="label-item">
                <span>瓶颈点至出清点时间</span>
                <el-input v-model="item.bottleneckToClearTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>出清延迟时间</span>
                <el-input v-model="item.clearDelayTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
            </div>
            <div class="right-column">
              <div class="label-item">
                <span>区段时间间隔</span>
                <el-input v-model="item.sectionInterval" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="action-column" style="position: relative; padding: 0; width: 20%;">
              <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 140px;">
                <el-button size="small" type="primary" @click="viewImage(2, index)" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;">查看图片</el-button>
                <el-button size="small" type="success" @click="exportExcel(2, index)" style="width: 140px; margin: 0; display: block; box-sizing: border-box;">导出Excel</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 接车模块 -->
        <div class="detail-module" data-title="接车模块">
          <div class="module-content" style="width: 100%; max-width: 100%;">
            <div class="left-column">
              <div class="label-item">
                <span>接车间隔</span>
                <el-input v-model="detailFormData.module3.intervalTitle" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="section-middle-left">
              <div class="label-item">
                <span>进站瓶颈点</span>
                <el-input v-model="detailFormData.module3.entranceBottleneck" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
              <div class="label-item">
                <span>停车点</span>
                <el-input v-model="detailFormData.module3.stopPoint" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="middle-column">
              <div class="label-item">
                <span>站台停车时间</span>
                <el-input v-model="detailFormData.module3.platformStopTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>前车从发车点至股道出清点时间</span>
                <el-input v-model="detailFormData.module3.frontTrainToClearTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>出清延迟时间</span>
                <el-input v-model="detailFormData.module3.clearDelayTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>接车进路办理时间</span>
                <el-input v-model="detailFormData.module3.receiveTrainTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
              <div class="label-item">
                <span>后车从瓶颈点至停车点时间</span>
                <el-input v-model="detailFormData.module3.rearTrainToStopTime" size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#67c23a'}" />
              </div>
            </div>
            <div class="right-column">
              <div class="label-item">
                <span>接车时间间隔</span>
                <el-input v-model="detailFormData.module3.trainInterval" disabled size="small" style="text-align: center;" :input-style="{textAlign: 'center', color: '#409EFF', fontWeight: 'bold'}" />
              </div>
            </div>
            <div class="action-column" style="position: relative; padding: 0; width: 20%;">
              <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 140px;">
                <el-button size="small" type="primary" @click="viewImage(3, 0)" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;">查看图片</el-button>
                <el-button size="small" type="success" @click="exportExcel(3, 0)" style="width: 140px; margin: 0; display: block; box-sizing: border-box;">导出Excel</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { 
  calculateTravelTime,
  calculateMinHeadway,
  formatDetailData
} from '../calculations/runningListCalculations'

export default {
  name: 'RunningListSheet',
  props: {
    sheetData: {
      type: Object,
      required: true
    },
    tracksData: {
      type: Array,
      default: () => []
    },
    stationsData: {
      type: Array,
      default: () => []
    },
    directionValue: {
      type: [Number, String],
      default: 1
    },
    maxPSR: {
      type: [Number, String],
      default: 350
    }
  },
  
  data() {
    return {
      // 计算相关状态
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
      detailData: null,
      isCalculatingAll: false,
      imagePreviewVisible: false,
      previewImageUrl: '',
      jsonPreviewVisible: false,
      previewJsonData: {},
      exportType: null,
      previewImageType: null,
      previewImageInfo: null,
      detailFormVisible: false,
      detailFormData: {
        module1: {
          intervalTitle: '发车间隔',
          time1: '45.0 秒',
          time2: '5.0 秒',
          time3: '8.5 秒',
          interval: '58.5 秒'
        },
        module2: [
          {
            intervalTitle: '区间间隔 1',
            startPoint: '1000.0 m',
            endPoint: '3500.0 m',
            bottleneckPosition: '1200.0 m',
            clearPosition: '3200.0 m',
            dangerPosition: '1800.0 m',
            bottleneckToClearTime: '35.5 秒',
            clearDelayTime: '2.0 秒',
            sectionInterval: '37.5 秒'
          },
          {
            intervalTitle: '区间间隔 2',
            startPoint: '3500.0 m',
            endPoint: '6000.0 m',
            bottleneckPosition: '4000.0 m',
            clearPosition: '5800.0 m',
            dangerPosition: '4500.0 m',
            bottleneckToClearTime: '40.0 秒',
            clearDelayTime: '2.5 秒',
            sectionInterval: '42.5 秒'
          }
        ],
        module3: {
          intervalTitle: '接车间隔',
          entranceBottleneck: '14800.0 m',
          stopPoint: '15000.0 m',
          platformStopTime: '30.0 秒',
          frontTrainToClearTime: '25.5 秒',
          clearDelayTime: '3.0 秒',
          receiveTrainTime: '10.0 秒',
          rearTrainToStopTime: '35.0 秒',
          trainInterval: '73.5 秒'
        }
      }
    }
  },
  
  created() {
    // 组件创建时初始化计算值
    this.$nextTick(() => {
      this.initializeCalculatedValues()
    })
  },
  
  watch: {
    // 监听方向值变化
    directionValue() {
      this.initializeCalculatedValues()
    },
    
    // 监听最大PSR值变化
    maxPSR() {
      this.initializeCalculatedValues()
    },
    
    // 监听Tracks表数据变化
    tracksData: {
      handler() {
        this.initializeCalculatedValues()
      },
      deep: true
    },
    
    // 监听Stations表数据变化
    stationsData: {
      handler() {
        this.initializeCalculatedValues()
      },
      deep: true
    },
    
    // 监听数据变化
    'sheetData.data': {
      handler(newVal) {
        if (newVal && Array.isArray(newVal) && newVal.length > 0) {
          this.initializeCalculatedValues()
        }
      },
      deep: true
    }
  },
  
  methods: {
    /**
     * 初始化所有计算值
     */
    initializeCalculatedValues() {
      // 只需对数据执行必要的初始化
      if (this.sheetData && this.sheetData.length > 0) {
        console.log('初始化RunningList计算字段');
        this.initializeRunningListCalculations();
      }
    },
    
    // 初始化RunningList计算 - 添加此缺失的函数
    initializeRunningListCalculations() {
      // 此方法用于初始化运行列表的计算字段
      // 根据需要进行计算初始化
      console.log('初始化运行列表计算');
      
      // 遍历所有行，初始化计算字段
      this.sheetData.forEach((row, index) => {
        // 这里可以根据需要添加具体的计算逻辑
        // 目前仅记录日志，不执行实际计算
        console.log(`初始化第 ${index + 1} 行计算`);
      });
    },
    
    cellClassName({ column, row }) {
      // ID列居中
      if (column.property === 'id') {
        return 'id-column'
      }
      // 为计算字段添加不同的样式
      const calculatedFields = [
        'TravelTime', 'Speed', 'Arrival', 'Departure'
      ]
      if (calculatedFields.includes(column.property)) {
        return 'calculated-cell'
      }
      return ''
    },
    
    getColumnMinWidth(prop) {
      const minWidthMap = {
        'id': 80,
        'Origin': 150,
        'Destination': 150,
        'Track_ID': 80,
        'Start_KP': 100,
        'End_KP': 100,
        'Position': 100,
        'Speed': 80,
        'Slope': 80,
        'Traction': 80,
        'Weight': 80,
        'Length': 80,
        'Time': 80,
        'Distance': 80,
        'Acc': 80
      }
      return minWidthMap[prop] || 100
    },
    
    shouldShowTooltip(value) {
      if (value === null || value === undefined || value === '') return false
      return String(value).length > 10
    },
    
    isFieldDisabled(prop) {
      // 这些字段是计算得出的，用户不能直接编辑
      const disabledFields = [
        'TravelTime', 'Speed', 'Arrival', 'Departure', 'id'
      ]
      return disabledFields.includes(prop)
    },
    
    handleCellDblClick(row, column) {
      // 双击单元格的处理逻辑，如有需要可以实现
    },
    
    handleInputChange(prop, row, index) {
      // 处理输入变化并计算相关字段
      if (['departureStation', 'arrivalStation', 'Distance', 'StopTime'].includes(prop)) {
        this.updateCalculatedValues(row, index)
      }
      
      // 发出数据修改事件
      this.$emit('data-modified')
    },
    
    updateCalculatedValues(row, index) {
      // 计算行程时间
      row.TravelTime = calculateTravelTime(row, this.sheetData.data, index)
      
      // 计算速度
      row.Speed = calculateSpeed(row, this.sheetData.data, index)
      
      // 计算到达时间
      row.Arrival = calculateArrival(row, this.sheetData.data, index)
      
      // 计算出发时间
      row.Departure = calculateDeparture(row)
      
      // 如果当前行更新了，也需要更新后续行
      this.updateFollowingRows(index + 1)
    },
    
    updateFollowingRows(startIndex) {
      if (!this.sheetData || !this.sheetData.data) return
      
      for (let i = startIndex; i < this.sheetData.data.length; i++) {
        const row = this.sheetData.data[i]
        
        // 计算行程时间
        row.TravelTime = calculateTravelTime(row, this.sheetData.data, i)
        
        // 计算速度
        row.Speed = calculateSpeed(row, this.sheetData.data, i)
        
        // 计算到达时间
        row.Arrival = calculateArrival(row, this.sheetData.data, i)
        
        // 计算出发时间
        row.Departure = calculateDeparture(row)
      }
    },
    
    handleInsertRow(index) {
      // 通知父组件在指定位置插入新行
      this.$emit('insert-row', index)
    },
    
    handleDeleteRow(index) {
      // 通知父组件删除指定行
      this.$emit('delete-row', index)
    },
    
    // 获取计算按钮类型
    getCalculationButtonType(row) {
      if (this.isCalculating(row)) {
        return 'warning'
      }
      
      if (this.isCalculated(row)) {
        return 'success'
      }
      
      return 'warning'
    },
    
    // 获取计算按钮文本
    getCalculationButtonText(row) {
      const rowId = this.getRowId(row)
      
      // 如果正在计算（无论是通行时间还是最小间隔时间）
      if (this.isCalculating(row)) {
        return '计算中...'
      }
      
      // 如果已计算过通行时间
      if (this.calculatedRows[rowId] && this.calculatedRows[rowId].travelTimeResult) {
        // 如果已计算过最小间隔时间
        if (this.calculatedRows[rowId] && this.calculatedRows[rowId].minHeadwayResult) {
          return '查看最小间隔时间结果'
        }
        // 只计算了通行时间
        return '查看通行时间结果'
      }
      
      // 默认情况
      return '计算'
    },
    
    // 判断行是否正在计算
    isCalculating(row) {
      const rowId = this.getRowId(row)
      // 检查是否正在计算通行时间，或者是否正在计算最小间隔时间
      return (this.calculatedRows[rowId] && this.calculatedRows[rowId].calculating) || 
             (this.selectedCalculationRow && 
              this.selectedCalculationRow.data === row && 
              this.calculationState.minHeadway.status === 'warning')
    },
    
    // 判断行是否已经计算
    isCalculated(row) {
      const rowId = this.getRowId(row)
      return this.calculatedRows[rowId] && this.calculatedRows[rowId].calculated
    },
    
    // 获取行ID
    getRowId(row) {
      return row.id || this.sheetData.data.findIndex(r => r === row)
    },
    
    // 处理单行计算
    handleSingleRowCalculate(row, rowIndex) {
      if (this.isCalculated(row)) {
        // 如果已计算，显示结果
        this.showCalculationResults(row, rowIndex)
      } else {
        // 如果未计算，开始计算
        this.startCalculation(row, rowIndex)
      }
    },
    
    // 显示计算结果
    showCalculationResults(row, rowIndex) {
      this.selectedCalculationRow = { data: row, index: rowIndex }
      
      // 如果已经计算过通行时间
      const rowId = this.getRowId(row)
      if (this.calculatedRows[rowId] && this.calculatedRows[rowId].travelTimeResult) {
        this.calculationResults.travelTime = {
          time: `${this.calculatedRows[rowId].travelTimeResult}秒`,
          details: `从 ${row.departureStation} 到 ${row.arrivalStation} 的通行时间计算完成`
        }
        
        this.calculationState.travelTime.status = 'success'
        this.calculationState.travelTime.percentage = 100
        this.calculationState.minHeadway.enabled = true
      }
      
      // 如果已经计算过最小间隔时间
      if (this.calculatedRows[rowId] && this.calculatedRows[rowId].minHeadwayResult) {
        this.calculationResults.minHeadway = {
          time: `${this.calculatedRows[rowId].minHeadwayResult.minHeadway}分钟`,
          details: `从 ${row.departureStation} 到 ${row.arrivalStation} 的最小间隔时间计算完成`
        }
        
        this.calculationState.minHeadway.status = 'success'
        this.calculationState.minHeadway.percentage = 100
        this.detailData = this.calculatedRows[rowId].minHeadwayResult.detailData
      }
      
      this.calculationDialogVisible = true
    },
    
    // 开始计算
    startCalculation(row, rowIndex) {
      // 设置当前选中的行
      this.selectedCalculationRow = { data: row, index: rowIndex }
      
      // 重置计算状态
      this.resetCalculationState()
      
      // 标记行正在计算
      const rowId = this.getRowId(row)
      this.$set(this.calculatedRows, rowId, {
        calculating: true,
        calculated: false
      })
      
      // 显示计算对话框
      this.calculationDialogVisible = true
      
      // 自动触发通行时间计算
      this.$nextTick(() => {
        this.calculateTravelTimeForRow()
      })
    },
    
    // 重置计算状态
    resetCalculationState() {
      this.calculationState.travelTime.status = ''
      this.calculationState.travelTime.percentage = 0
      this.calculationState.travelTime.enabled = true
      
      this.calculationState.minHeadway.status = ''
      this.calculationState.minHeadway.percentage = 0
      this.calculationState.minHeadway.enabled = false
      
      this.calculationResults.travelTime = null
      this.calculationResults.minHeadway = null
      this.detailData = null
    },
    
    // 计算通行时间
    calculateTravelTimeForRow() {
      if (!this.selectedCalculationRow) return
      
      const row = this.selectedCalculationRow.data
      const rowIndex = this.selectedCalculationRow.index
      const rowId = this.getRowId(row)
      
      // 设置为计算中状态
      this.calculationState.travelTime.status = 'warning'
      this.calculationState.travelTime.percentage = 30
      
      // 模拟异步计算
      setTimeout(() => {
        // 调用计算函数
        const travelTime = calculateTravelTime(row, rowIndex)
        
        // 更新状态
        this.calculationState.travelTime.status = 'success'
        this.calculationState.travelTime.percentage = 100
        
        // 保存结果
        this.calculationResults.travelTime = {
          time: `${travelTime}秒`,
          details: `从 ${row.departureStation} 到 ${row.arrivalStation} 的通行时间计算完成`
        }
        
        // 更新行计算状态
        this.$set(this.calculatedRows, rowId, {
          calculating: false,
          calculated: true,
          travelTimeResult: travelTime
        })
        
        // 启用最小间隔时间计算
        this.calculationState.minHeadway.enabled = true
        
        // 通知成功
        this.$message.success('通行时间计算完成！')
      }, 2000) // 模拟2秒的计算时间
    },
    
    // 计算最小间隔时间
    calculateMinHeadwayForRow() {
      if (!this.selectedCalculationRow || !this.calculationState.minHeadway.enabled) return
      
      const row = this.selectedCalculationRow.data
      const rowIndex = this.selectedCalculationRow.index
      const rowId = this.getRowId(row)
      const travelTime = this.calculatedRows[rowId].travelTimeResult
      
      // 设置为计算中状态
      this.calculationState.minHeadway.status = 'warning'
      this.calculationState.minHeadway.percentage = 30
      
      // 模拟异步计算
      setTimeout(() => {
        // 调用计算函数
        const result = calculateMinHeadway(row, rowIndex, travelTime)
        
        // 更新状态
        this.calculationState.minHeadway.status = 'success'
        this.calculationState.minHeadway.percentage = 100
        
        // 保存结果
        this.calculationResults.minHeadway = {
          time: `${result.minHeadway}分钟`,
          details: `从 ${row.departureStation} 到 ${row.arrivalStation} 的最小间隔时间计算完成`
        }
        
        // 保存详细数据
        this.detailData = result.detailData
        
        // 更新行计算状态
        this.$set(this.calculatedRows, rowId, {
          ...this.calculatedRows[rowId],
          minHeadwayResult: result,
          calculating: false,  // 确保设置为非计算中状态
          calculated: true     // 确保设置为已计算状态
        })
        
        // 通知成功
        this.$message.success('最小间隔时间计算完成！')
      }, 2500) // 模拟2.5秒的计算时间
    },
    
    // 查看详细结果
    viewDetailResults() {
      if (!this.detailData) {
        this.$message.warning('没有可显示的详细数据');
        return;
      }
      
      // 获取出发站和到达站
      if (this.selectedCalculationRow && this.selectedCalculationRow.data) {
        const departureStation = this.extractStationCode(this.selectedCalculationRow.data.departureStation || '');
        const arrivalStation = this.extractStationCode(this.selectedCalculationRow.data.arrivalStation || '');
        
        // 加载xjwb.json数据
        this.loadDetailData(departureStation, arrivalStation);
      } else {
        // 如果没有选中行，使用默认数据
        this.setDefaultDetailData();
        this.detailFormVisible = true;
      }
      
      // 关闭当前计算对话框
      this.calculationDialogVisible = false;
    },
    
    // 从xjwb.json加载详细数据
    loadDetailData(departureStation, arrivalStation) {
      // 构造文件路径
      const folderName = `${departureStation}-${arrivalStation}的时间间隔数据以及图片`;
      const filePath = `/data/result/min_time/${folderName}/xjwb.json`;
      
      // 显示加载中消息
      const loading = this.$loading({
        lock: true,
        text: '加载详细数据中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      // 加载JSON文件
      fetch(filePath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP错误 ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // 更新发车模块数据
          this.detailFormData.module1 = {
            intervalTitle: '发车间隔',
            time1: `${data.departure.timeFromDepartureToBlockClear} 秒`,
            time2: `${data.departure.cleanDelayTime} 秒`,
            time3: `${data.departure.departureRouteTime} 秒`,
            interval: `${data.departure.timeFromDepartureToBlockClear + data.departure.cleanDelayTime + data.departure.departureRouteTime} 秒`
          };
          
          // 更新区间模块数据 - 动态生成
          this.detailFormData.module2 = data.blocks.map((block, index) => ({
            intervalTitle: `区间间隔 ${index + 1}`,
            startPoint: `${block.blockStartDistance} m`,
            endPoint: `${block.blockEndDistance} m`,
            bottleneckPosition: `${block.blockBottleneckPoint} m`,
            clearPosition: `${block.blockClearPoint} m`,
            dangerPosition: `${block.blockDangerPoint} m`,
            bottleneckToClearTime: `${block.timeFromBottleneckToBlockClear} 秒`,
            clearDelayTime: `${block.cleanDelayTime} 秒`,
            sectionInterval: `${block.timeFromBottleneckToBlockClear + block.cleanDelayTime} 秒`
          }));
          
          // 更新接车模块数据
          this.detailFormData.module3 = {
            intervalTitle: '接车间隔',
            entranceBottleneck: `${data.arriver.blockBottleneckPoint} m`,
            stopPoint: `${data.arriver.stationStopPoint} m`,
            platformStopTime: `${data.arriver.stionStopTime} 秒`, // 注意这里保留原始拼写错误
            frontTrainToClearTime: `${data.arriver.blockClearPoint} 秒`,
            clearDelayTime: `${data.arriver.timeClearDelay} 秒`,
            receiveTrainTime: `${data.arriver.arriverRouteTime} 秒`,
            rearTrainToStopTime: `${data.arriver.timeFromBottleneckToStop} 秒`,
            trainInterval: `${data.arriver.stionStopTime + data.arriver.blockClearPoint + data.arriver.timeClearDelay + data.arriver.arriverRouteTime + data.arriver.timeFromBottleneckToStop} 秒`
          };
          
          // 关闭加载提示
          loading.close();
          
          // 显示详情表单
          this.detailFormVisible = true;
        })
        .catch(error => {
          // 关闭加载提示
          loading.close();
          console.error('加载数据失败:', error);
          this.$message.error(`加载数据失败: ${error.message}`);
          
          // 使用默认数据
          this.setDefaultDetailData();
          this.detailFormVisible = true;
        });
    },
    
    // 设置默认的详情数据
    setDefaultDetailData() {
      this.detailFormData = {
        module1: {
          intervalTitle: '发车间隔',
          time1: '45.0 秒',
          time2: '5.0 秒',
          time3: '8.5 秒',
          interval: '58.5 秒'
        },
        module2: [
          {
            intervalTitle: '区间间隔 1',
            startPoint: '1000.0 m',
            endPoint: '3500.0 m',
            bottleneckPosition: '1200.0 m',
            clearPosition: '3200.0 m',
            dangerPosition: '1800.0 m',
            bottleneckToClearTime: '35.5 秒',
            clearDelayTime: '2.0 秒',
            sectionInterval: '37.5 秒'
          },
          {
            intervalTitle: '区间间隔 2',
            startPoint: '3500.0 m',
            endPoint: '6000.0 m',
            bottleneckPosition: '4000.0 m',
            clearPosition: '5800.0 m',
            dangerPosition: '4500.0 m',
            bottleneckToClearTime: '40.0 秒',
            clearDelayTime: '2.5 秒',
            sectionInterval: '42.5 秒'
          }
        ],
        module3: {
          intervalTitle: '接车间隔',
          entranceBottleneck: '14800.0 m',
          stopPoint: '15000.0 m',
          platformStopTime: '30.0 秒',
          frontTrainToClearTime: '25.5 秒',
          clearDelayTime: '3.0 秒',
          receiveTrainTime: '10.0 秒',
          rearTrainToStopTime: '35.0 秒',
          trainInterval: '73.5 秒'
        }
      };
    },
    
    // 获取区间模块数量
    getBlockCount(jsonData) {
      if (jsonData && jsonData.blocks && Array.isArray(jsonData.blocks)) {
        return jsonData.blocks.length;
      }
      return 0;
    },
    
    // 查看图片
    viewImage(module, index) {
      // 获取当前选中行的数据
      const currentRow = this.selectedCalculationRow ? this.selectedCalculationRow.data : null;
      if (!currentRow) {
        this.$message.error('未找到行数据，无法查看图片');
        return;
      }

      // 获取出发站和到达站
      const departureStation = this.extractStationCode(currentRow.departureStation || '');
      const arrivalStation = this.extractStationCode(currentRow.arrivalStation || '');
      
      const folderName = `${departureStation}-${arrivalStation}的时间间隔数据以及图片`;
      
      // 基础路径
      const basePath = `/data/result/min_time/${folderName}/`;
      
      let title = '';
      let fileName = '';
      let path = '';
      
      // 根据模块类型和索引确定图片路径
      if (module === 1) {
        // 发车模块
        title = '发车模块图片';
        fileName = '发车.png';
        path = `${basePath}发车.png`;
      } else if (module === 2) {
        // 区间模块 - 使用提供的索引生成图片名称
        title = `区间模块图片 ${index + 1}`;
        fileName = `block-${index+1}.png`;
        path = `${basePath}${fileName}`;
      } else if (module === 3) {
        // 接车模块
        title = '接车模块图片';
        fileName = '接车.png';
        path = `${basePath}接车.png`;
      }
      
      // 设置图片预览信息
      this.previewImageInfo = {
        title,
        path
      };
      
      // 显示图片预览对话框
      this.imagePreviewVisible = true;
    },
    
    // 导出Excel
    exportExcel(module, index) {
      // 获取当前选中行的数据
      const currentRow = this.selectedCalculationRow ? this.selectedCalculationRow.data : null;
      if (!currentRow) {
        this.$message.error('未找到行数据，无法导出Excel');
        return;
      }

      // 获取出发站和到达站（去掉可能的数字后缀）
      const departureStation = this.extractStationCode(currentRow.departureStation || '');
      const arrivalStation = this.extractStationCode(currentRow.arrivalStation || '');
      
      // 准备导出数据
      let exportData = {};
      let filename = '';
      
      if (module === 1) {
        // 发车模块数据
        exportData = {
          '模块类型': '发车模块',
          '区间': `${departureStation}-${arrivalStation}`,
          '发车点至出清点时间(秒)': this.detailFormData.module1.time1.replace(' 秒', ''),
          '出清延迟时间(秒)': this.detailFormData.module1.time2.replace(' 秒', ''),
          '发车进路办理时间(秒)': this.detailFormData.module1.time3.replace(' 秒', ''),
          '发车时间间隔(秒)': this.detailFormData.module1.interval.replace(' 秒', '')
        };
        filename = `发车模块_${departureStation}-${arrivalStation}_${new Date().getTime()}`;
      } else if (module === 2 && this.detailFormData.module2[index]) {
        // 区间模块数据
        const blockData = this.detailFormData.module2[index];
        exportData = {
          '模块类型': '区间模块',
          '区间': `${departureStation}-${arrivalStation}`,
          '区间序号': index + 1,
          '区段起始点(m)': blockData.startPoint.replace(' m', ''),
          '区段终点(m)': blockData.endPoint.replace(' m', ''),
          '瓶颈点位置(m)': blockData.bottleneckPosition.replace(' m', ''),
          '出清点位置(m)': blockData.clearPosition.replace(' m', ''),
          '危险点位置(m)': blockData.dangerPosition.replace(' m', ''),
          '瓶颈点至出清点时间(秒)': blockData.bottleneckToClearTime.replace(' 秒', ''),
          '出清延迟时间(秒)': blockData.clearDelayTime.replace(' 秒', ''),
          '区段时间间隔(秒)': blockData.sectionInterval.replace(' 秒', '')
        };
        filename = `区间模块${index + 1}_${departureStation}-${arrivalStation}_${new Date().getTime()}`;
      } else if (module === 3) {
        // 接车模块数据
        exportData = {
          '模块类型': '接车模块',
          '区间': `${departureStation}-${arrivalStation}`,
          '进站瓶颈点(m)': this.detailFormData.module3.entranceBottleneck.replace(' m', ''),
          '停车点(m)': this.detailFormData.module3.stopPoint.replace(' m', ''),
          '站台停车时间(秒)': this.detailFormData.module3.platformStopTime.replace(' 秒', ''),
          '前车从发车点至股道出清点时间(秒)': this.detailFormData.module3.frontTrainToClearTime.replace(' 秒', ''),
          '出清延迟时间(秒)': this.detailFormData.module3.clearDelayTime.replace(' 秒', ''),
          '接车进路办理时间(秒)': this.detailFormData.module3.receiveTrainTime.replace(' 秒', ''),
          '后车从瓶颈点至停车点时间(秒)': this.detailFormData.module3.rearTrainToStopTime.replace(' 秒', ''),
          '接车时间间隔(秒)': this.detailFormData.module3.trainInterval.replace(' 秒', '')
        };
        filename = `接车模块_${departureStation}-${arrivalStation}_${new Date().getTime()}`;
      }
      
      // 显示下载消息
      this.$message({
        message: `正在导出Excel文件: ${filename}.xlsx`,
        type: 'success',
        duration: 2000
      });
      
      // 模拟下载完成
      setTimeout(() => {
        this.$message({
          message: 'Excel文件导出完成',
          type: 'success'
        });
      }, 1500);
    },
    
    // 提取站点代码（移除数字后缀）
    extractStationCode(stationName) {
      if (!stationName) return '';
      
      // 使用正则表达式匹配字母部分
      const match = stationName.match(/^([A-Za-z]+)/);
      return match ? match[1] : stationName;
    },
    
    // 从预览对话框下载图片
    downloadImageFromPreview() {
      if (!this.previewImageInfo) return;
      
      // 模拟下载过程
      const filename = `${this.previewImageInfo.title}_${new Date().getTime()}.png`;
      
      this.$message({
        message: `正在下载图片: ${filename}`,
        type: 'success',
        duration: 2000
      });
      
      // 模拟下载完成
      setTimeout(() => {
        this.$message({
          message: '图片下载完成',
          type: 'success'
        });
        this.imagePreviewVisible = false;
      }, 1500);
    },
    
    // 导出结果到Excel
    exportResultToExcel(type) {
      if (!this.selectedCalculationRow) return
      
      const row = this.selectedCalculationRow.data
      
      // 获取出发站和到达站
      const departureStation = row.departureStation || ''
      const arrivalStation = row.arrivalStation || ''
      
      // 保存导出类型
      this.exportType = type
      
      // 显示加载中提示
      const loading = this.$loading({
        lock: true,
        text: '加载JSON数据中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      
      // 根据类型加载不同的JSON数据
      if (type === 'travelTime') {
        // 通行时间结果数据 - 读取running_profile_up_slow.json
        const jsonPath = `/data/result/running_profile_up_slow.json`
        
        this.loadJsonData(jsonPath)
          .then(data => {
            // 关闭加载提示
            loading.close()
            
            // 查找匹配当前行的数据
            let matchedItem = null
            if (Array.isArray(data)) {
              matchedItem = data.find(item => 
                (item['Departure Station name'] === departureStation || 
                 item['Departure Station name'].includes(departureStation)) && 
                (item['Arrival Station name'] === arrivalStation || 
                 item['Arrival Station name'].includes(arrivalStation))
              )
            }
            
            // 保存完整的JSON数据用于预览
            if (matchedItem) {
              this.previewJsonData = matchedItem
            } else {
              // 如果没找到匹配数据，使用默认数据
              this.previewJsonData = {
                '出发站': departureStation,
                '到达站': arrivalStation,
                '通行时间(秒)': this.calculationResults.travelTime.time.replace(' 秒', ''),
                '距离(米)': row.Distance || '0',
                '平均速度(km/h)': row.Speed || '0',
                '計算时间': new Date().toLocaleString(),
                '注意': '在running_profile_up_slow.json中未找到匹配数据'
              }
            }
            
            // 显示JSON预览对话框
            this.jsonPreviewVisible = true
          })
          .catch(error => {
            // 关闭加载提示
            loading.close()
            
            // 使用默认数据
            this.previewJsonData = {
              '出发站': departureStation,
              '到达站': arrivalStation,
              '通行时间(秒)': this.calculationResults.travelTime.time.replace(' 秒', ''),
              '距离(米)': row.Distance || '0',
              '平均速度(km/h)': row.Speed || '0',
              '計算时间': new Date().toLocaleString(),
              '错误信息': error.message || '加载JSON数据失败'
            }
            
            // 显示JSON预览对话框
            this.jsonPreviewVisible = true
          })
      } else {
        // 最小间隔时间结果数据路径保持不变
        const departureCode = this.extractStationCode(departureStation)
        const arrivalCode = this.extractStationCode(arrivalStation)
        const jsonPath = `/data/result/min_time/${departureCode}-${arrivalCode}的时间间隔数据以及图片/xjwb.json`
        
        this.loadJsonData(jsonPath)
          .then(data => {
            // 关闭加载提示
            loading.close()
            
            // 保存完整的JSON数据用于预览
            this.previewJsonData = data || {
              '出发站': departureStation,
              '到达站': arrivalStation,
              '最小间隔时间(分钟)': this.calculationResults.minHeadway.time.replace(' 分钟', ''),
              '距离(米)': row.Distance || '0',
              '限制因素': '区间安全间隔',
              '計算时间': new Date().toLocaleString(),
              '注意': '未找到完整JSON数据'
            }
            
            // 显示JSON预览对话框
            this.jsonPreviewVisible = true
          })
          .catch(error => {
            // 关闭加载提示
            loading.close()
            
            // 使用默认数据
            this.previewJsonData = {
              '出发站': departureStation,
              '到达站': arrivalStation,
              '最小间隔时间(分钟)': this.calculationResults.minHeadway.time.replace(' 分钟', ''),
              '距离(米)': row.Distance || '0',
              '限制因素': '区间安全间隔',
              '計算时间': new Date().toLocaleString(),
              '错误信息': error.message || '加载JSON数据失败'
            }
            
            // 显示JSON预览对话框
            this.jsonPreviewVisible = true
          })
      }
    },

    // 加载JSON数据
    loadJsonData(jsonPath) {
      return new Promise((resolve, reject) => {
        fetch(jsonPath)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP错误 ${response.status}`)
            }
            return response.json()
          })
          .then(data => {
            resolve(data)
          })
          .catch(error => {
            console.error('加载JSON数据失败:', error)
            reject(error)
          })
      })
    },
    
    // 显示数据预览
    showDataPreview(jsonData) {
      // 保存JSON数据用于预览
      this.previewJsonData = jsonData;
      
      // 显示JSON预览对话框
      this.jsonPreviewVisible = true;
    },
    
    // 下载Excel文件
    downloadExcelFile() {
      // 这里模拟Excel文件的下载过程
      // 在实际应用中，应该使用Export2Excel模块
      
      this.jsonPreviewVisible = false;
      
      // 生成文件名
      const timestamp = new Date().getTime();
      const filename = `运行配置_${timestamp}.xlsx`;
      
      // 显示下载消息
      this.$message({
        message: `正在下载Excel文件: ${filename}`,
        type: 'success',
        duration: 2000
      });
      
      // 模拟下载完成
      setTimeout(() => {
        this.$message({
          message: 'Excel文件下载完成',
          type: 'success'
        });
      }, 1500);
    },
    
    // 导出结果到图片
    exportResultToImage(calculationType) {
      if (!this.selectedCalculationRow || !this.selectedCalculationRow.data) return;
      
      const row = this.selectedCalculationRow.data;
      
      // 提取站点代码（移除可能的数字后缀）
      let departureCode = this.extractStationCode(row.departureStation);
      let arrivalCode = this.extractStationCode(row.arrivalStation);
      
      // 构建图片文件名
      const fileName = `${departureCode}-${arrivalCode}.png`;
      
      // 设置图片路径
      let imagePath = '';
      if (calculationType === 'travelTime') {
        imagePath = `/data/result/tongxing_time/${fileName}`;
      } else {
        imagePath = `/data/result/min_headway/${fileName}`;
      }
      
      // 设置预览图片信息
      this.previewImageInfo = {
        title: calculationType === 'travelTime' ? '通行时间计算结果' : '最小间隔时间计算结果',
        path: imagePath
      };
      
      // 显示图片预览对话框
      this.imagePreviewVisible = true;
    }
  }
}
</script>

<style>
.running-list-sheet {
  width: 100%;
}

/* 计算对话框样式 */
.calculation-dialog {
  border-radius: 8px !important;
}

.calculation-dialog .el-dialog__header {
  padding: 15px 20px;
  border-bottom: 1px solid #EBEEF5;
  background-color: #f5f7fa;
}

.calculation-panel-dialog {
  padding: 0;
  background-color: #fff;
}

.calculation-header {
  padding: 15px 20px;
}

.calculation-header h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #409EFF;
  font-weight: bold;
}

.calculation-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.calculation-content {
  display: flex;
  justify-content: space-between;
  padding: 0;
}

.calculation-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.column-divider {
  height: auto;
  margin: 0;
}

.calculation-button {
  width: 180px;
  margin-bottom: 20px;
}

.result-box {
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-inner {
  width: 100%;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
}

.result-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #409EFF;
}

.result-details {
  font-size: 14px;
  margin: 0;
  color: #606266;
}

.result-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.result-actions .el-button {
  padding: 8px 15px;
  font-size: 12px;
}

.result-actions .el-button:first-child {
  background-color: #409EFF;
  border-color: #409EFF;
  color: #fff;
}

.result-actions .el-button:last-child {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

/* 全屏图片预览样式 */
.full-screen-image-dialog .el-dialog__header {
  padding: 10px 20px 10px;
  background-color: #f5f7fa;
}

.full-screen-image-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 120px);
  background-color: #f5f7fa;
  padding: 20px;
}

.full-screen-image {
  max-width: 100%;
  max-height: calc(100vh - 180px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  border: 1px solid #ebeef5;
}

.image-actions {
  margin-top: 20px;
  text-align: center;
}

/* JSON预览对话框样式 */
.json-preview-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.json-preview-container {
  max-height: 400px;
  overflow-y: auto;
}

.json-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #EBEEF5;
}

.json-table td {
  padding: 12px;
  border: 1px solid #EBEEF5;
}

.key-cell {
  font-weight: bold;
  width: 30%;
  background-color: #f5f7fa;
}

.value-cell {
  font-family: monospace;
}

.dialog-footer {
  padding: 10px 20px;
  text-align: right;
  background-color: #fff;
  border-top: 1px solid #EBEEF5;
}

/* 确保所有单元格的内容居中 */
.el-table .cell {
  text-align: center;
}

/* 自定义计算按钮的样式 */
.calculation-buttons .el-button {
  width: 160px;
}

/* 表格操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: space-around;
}

/* 计算按钮根据状态变化的样式 */
.operation-buttons .el-button--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

.operation-buttons .el-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

/* ID列禁止编辑样式 */
.disabled-cell {
  color: #909399;
  cursor: not-allowed;
}

.id-cell {
  display: inline-block;
  width: 100%;
  height: 100%;
  line-height: 23px;
  padding: 5px 0;
}

.result-actions.single-btn {
  justify-content: center;
  margin-top: 15px;
}

.result-actions.single-btn .el-button {
  min-width: 120px;
  padding: 10px 20px;
  font-size: 14px;
}

/* 修改最小间隔时间结果下的按钮样式，使其完全居中，并调整宽度 */
.center-button-container {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.center-button-container .el-button {
  min-width: 120px;
  padding: 10px 20px;
  font-size: 14px;
}

/* 详情表单对话框样式 */
.detail-dialog {
  border-radius: 8px !important;
}

.detail-dialog .el-dialog__header {
  background-color: #f5f7fa;
  padding: 15px 20px;
}

.detail-dialog .el-dialog__title {
  color: #409EFF;
  font-weight: bold;
  font-size: 18px;
}

.detail-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.detail-module {
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  background-color: #fff;
}

.module-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.left-column {
  flex: 1;
  padding: 10px;
}

.middle-column {
  flex: 2;
  padding: 10px;
}

.section-middle-left {
  flex: 1.5;
  padding: 10px;
}

.section-middle-right {
  flex: 1.5;
  padding: 10px;
}

.right-column {
  flex: 1;
  padding: 10px;
}

.label-item {
  margin-bottom: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 8px;
}

.label-item span {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
  font-weight: bold;
}

.label-item .el-input {
  width: 100%;
}

.label-item .el-input.is-disabled .el-input__inner {
  color: #409EFF;
  font-weight: bold;
  background-color: #ecf5ff;
}

.action-column {
  flex: 1;
  padding: 10px;
}

/* 为模块之间添加区分样式 */
.detail-module:nth-child(odd) {
  background-color: #fafafa;
}

.detail-module:nth-child(even) {
  background-color: #fff;
}

/* 为标题添加样式 */
.detail-module::before {
  content: attr(data-title);
  display: block;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 10px;
}

/* 为详情对话框中的按钮添加统一样式 */
.detail-dialog .el-button--primary {
  background-color: #409EFF;
  border-color: #409EFF;
}

.detail-dialog .el-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
}
</style> 