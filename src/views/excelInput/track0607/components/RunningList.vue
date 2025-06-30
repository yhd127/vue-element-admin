<template>
  <div class="running-list-container">
    <el-table
      :data="sheetData"
      style="width: 100%"
      border
      highlight-current-row
    >
      <el-table-column
        prop="departure_station_name"
        label="Departure Station name"
        width="180"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.departure_station_name" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="departure_station_distance"
        label="Departure Station Distance"
        width="200"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.departure_station_distance" :precision="0" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="arrival_station_name"
        label="Arrival Station name"
        width="180"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.arrival_station_name" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="arrival_station_distance"
        label="Arrival Station Distance"
        width="200"
      >
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.arrival_station_distance" :precision="0" :controls="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="track"
        label="Track"
        width="120"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.track" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="train"
        label="Train"
        width="120"
      >
        <template slot-scope="scope">
          <el-input v-model="scope.row.train" size="small" />
        </template>
      </el-table-column>
      <el-table-column
        prop="train_load"
        label="train load [0 1]"
        width="150"
      >
        <template slot-scope="scope">
          <el-switch v-model="scope.row.train_load" />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="300"
      >
        <template slot-scope="scope">
          <div style="display: flex; align-items: center;">
            <el-button
              size="mini"
              type="warning"
              icon="el-icon-cpu"
              style="margin-right: 8px;"
              @click="handleCalculate(scope.row, scope.$index)"
            >计算</el-button>
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-plus"
              @click="handleInsertRow(scope.$index)"
            >下行插入</el-button>
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="handleDeleteRow(scope.$index)"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 计算弹窗 -->
    <el-dialog
      title="计算功能"
      :visible.sync="showCalculation"
      width="50%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      class="calculation-dialog"
    >
      <div class="calculation-buttons">
        <div class="calculation-item">
          <el-button
            type="primary"
            :disabled="calculationState.travelTime.status === 'warning'"
            @click="calculateTravelTime"
          >
            计算通行时间
          </el-button>

          <div v-if="calculationState.travelTime.status" class="progress-wrapper">
            <el-progress
              type="circle"
              :percentage="calculationState.travelTime.percentage"
              :status="calculationState.travelTime.status"
            />
            <div v-if="calculationState.travelTime.status === 'warning'" class="calculation-info">
              <p>正在计算: {{ currentCalculation.from }} 到 {{ currentCalculation.to }}</p>
            </div>
            <div v-if="calculationState.travelTime.status === 'success'" class="calculation-info">
              <p>结果: {{ calculationResults.travelTime && calculationResults.travelTime.time }}</p>
              <p>从 {{ currentCalculation.from }} 到 {{ currentCalculation.to }} 的通行时间计算完成</p>
            </div>
          </div>

          <div v-if="calculationResults.travelTime" class="result-actions">
            <el-button size="small" @click="exportResultToExcel('travelTime')">输出Excel文件</el-button>
            <el-button size="small" @click="exportResultToImage('travelTime')">图片文件</el-button>
          </div>
        </div>

        <div class="calculation-item">
          <el-button
            type="primary"
            :disabled="!calculationState.minHeadway.enabled || calculationState.minHeadway.status === 'warning'"
            @click="calculateMinHeadway"
          >
            计算最小间隔时间
          </el-button>

          <div v-if="calculationState.minHeadway.status" class="progress-wrapper">
            <el-progress
              type="circle"
              :percentage="calculationState.minHeadway.percentage"
              :status="calculationState.minHeadway.status"
            />
            <div v-if="calculationState.minHeadway.status === 'warning'" class="calculation-info">
              <p>正在计算最小间隔时间...</p>
            </div>
            <div v-if="calculationState.minHeadway.status === 'success'" class="calculation-info">
              <p>结果: {{ calculationResults.minHeadway && calculationResults.minHeadway.time }}</p>
              <p>最小间隔时间计算完成</p>
            </div>
          </div>

          <div v-if="calculationResults.minHeadway" class="result-actions">
            <div style="display: flex; justify-content: center;">
              <el-button size="small" type="primary" @click="exportResultToImage('minHeadway')">查看详情</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 添加详情查看对话框 -->
    <el-dialog
      title="计算结果详情"
      :visible.sync="detailDialogVisible"
      width="80%"
      class="detail-dialog"
    >
      <div class="detail-container">
        <!-- 发车模块 -->
        <div class="detail-module">
          <div class="module-content" style="width: 100%; max-width: 100%;">
            <div class="left-column">
              <div class="label-item">
                <span>发车间隔</span>
                <el-input v-model="detailData.module1.intervalTitle" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="middle-column">
              <div class="label-item">
                <span>发车点至出清点时间</span>
                <el-input v-model="detailData.module1.time1" size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>出清延迟时间</span>
                <el-input v-model="detailData.module1.time2" size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>发车进路办理时间</span>
                <el-input v-model="detailData.module1.time3" size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="right-column">
              <div class="label-item">
                <span>发车时间间隔</span>
                <el-input v-model="detailData.module1.interval" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="action-column" style="position: relative; padding: 0; width: 20%;">
              <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 140px;">
                <el-button size="small" type="primary" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;" @click="viewImage(1, index)">查看图片</el-button>
                <el-button size="small" type="success" style="width: 140px; margin: 0; display: block; box-sizing: border-box;" @click="exportExcel(1, index)">导出Excel</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 区间模块 (动态生成1-3个) -->
        <div
          v-for="(item, index) in detailData.module2"
          :key="`section-${index}`"
          class="detail-module"
        >
          <div class="module-content" style="width: 100%; max-width: 100%;">
            <div class="left-column">
              <div class="label-item">
                <span>区间间隔</span>
                <el-input v-model="item.intervalTitle" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="section-middle-left">
              <div class="label-item">
                <span>区段起始点</span>
                <el-input v-model="item.startPoint" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>区段终点</span>
                <el-input v-model="item.endPoint" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="middle-column">
              <div class="label-item">
                <span>瓶颈点位置</span>
                <el-input v-model="item.bottleneckPosition" disabled size="small" />
              </div>
              <div class="label-item">
                <span>出清点位置</span>
                <el-input v-model="item.clearPosition" disabled size="small" />
              </div>
              <div class="label-item">
                <span>危险点位置</span>
                <el-input v-model="item.dangerPosition" disabled size="small" />
              </div>
            </div>
            <div class="section-middle-right">
              <div class="label-item">
                <span>瓶颈点至出清点时间</span>
                <el-input v-model="item.bottleneckToClearTime" size="small" />
              </div>
              <div class="label-item">
                <span>出清延迟时间</span>
                <el-input v-model="item.clearDelayTime" size="small" />
              </div>
            </div>
            <div class="right-column">
              <div class="label-item">
                <span>区段时间间隔</span>
                <el-input v-model="item.sectionInterval" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="action-column" style="position: relative; padding: 0; width: 20%;">
              <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 140px;">
                <el-button size="small" type="primary" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;" @click="viewImage(2, index)">查看图片</el-button>
                <el-button size="small" type="success" style="width: 140px; margin: 0; display: block; box-sizing: border-box;" @click="exportExcel(2, index)">导出Excel</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 接车模块 -->
        <div class="detail-module">
          <div class="module-content" style="width: 100%; max-width: 100%;">
            <div class="left-column">
              <div class="label-item">
                <span>接车间隔</span>
                <el-input v-model="detailData.module3.intervalTitle" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="section-middle-left">
              <div class="label-item">
                <span>进站瓶颈点</span>
                <el-input v-model="detailData.module3.entranceBottleneck" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>停车点</span>
                <el-input v-model="detailData.module3.stopPoint" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="middle-column">
              <div class="label-item">
                <span>站台停车时间</span>
                <el-input v-model="detailData.module3.platformStopTime" size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>前车从发车点至股道出清点时间</span>
                <el-input v-model="detailData.module3.frontTrainToClearTime" size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>出清延迟时间</span>
                <el-input v-model="detailData.module3.clearDelayTime" size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>接车进路办理时间</span>
                <el-input v-model="detailData.module3.receiveTrainTime" size="small" :input-style="{textAlign: 'center'}" />
              </div>
              <div class="label-item">
                <span>后车从瓶颈点至停车点时间</span>
                <el-input v-model="detailData.module3.rearTrainToStopTime" size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="right-column">
              <div class="label-item">
                <span>接车时间间隔</span>
                <el-input v-model="detailData.module3.trainInterval" disabled size="small" :input-style="{textAlign: 'center'}" />
              </div>
            </div>
            <div class="action-column" style="position: relative; padding: 0; width: 20%;">
              <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 140px;">
                <el-button size="small" type="primary" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;" @click="viewImage(3, index)">查看图片</el-button>
                <el-button size="small" type="success" style="width: 140px; margin: 0; display: block; box-sizing: border-box;" @click="exportExcel(3, index)">导出Excel</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'RunningList',
  props: {
    activeSheet: {
      type: String,
      default: ''
    },
    fileData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      sheetData: [],
      showCalculation: false,
      calculatingAllRows: false,
      globalTravelTimeCalculated: false,
      calculationState: {
        travelTime: {
          status: '',
          percentage: 0
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
      currentCalculation: {
        from: '',
        to: ''
      },
      detailDialogVisible: false,
      detailData: {
        module1: {
          intervalTitle: '',
          time1: '',
          time2: '',
          time3: '',
          interval: ''
        },
        module2: [],
        module3: {
          intervalTitle: '',
          entranceBottleneck: '',
          stopPoint: '',
          platformStopTime: '',
          frontTrainToClearTime: '',
          clearDelayTime: '',
          receiveTrainTime: '',
          rearTrainToStopTime: '',
          trainInterval: ''
        }
      }
    }
  },
  watch: {
    // 监听fileData变化，更新表格数据
    fileData: {
      handler(newVal) {
        if (newVal) {
          // 如果有文件数据，则使用它
          this.sheetData = [{
            departure_station_name: newVal.departure_station_name || 'string',
            departure_station_distance: newVal.departure_station_distance || 0,
            arrival_station_name: newVal.arrival_station_name || 'string',
            arrival_station_distance: newVal.arrival_station_distance || 0,
            track: newVal.track || 'string',
            train: newVal.train || 'string',
            train_load: newVal.train_load || false
          }]
        } else {
          // 如果没有文件数据，则使用默认数据
          this.sheetData = [{
            departure_station_name: 'string',
            departure_station_distance: 0,
            arrival_station_name: 'string',
            arrival_station_distance: 0,
            track: 'string',
            train: 'string',
            train_load: true
          }]
        }
      },
      immediate: true
    }
  },
  created() {
    // 监听新行数据添加事件
    this.$root.$on('add-new-row', this.addNewRow)
  },
  beforeDestroy() {
    // 移除监听器
    this.$root.$off('add-new-row', this.addNewRow)
  },
  methods: {
    // 在表格中插入行的处理函数
    handleInsertRow(index) {
      // 通过事件通知父组件
      this.$emit('insert-row', index)
    },

    // 删除行
    handleDeleteRow(index) {
      // 确认删除提示
      this.$confirm('确认删除此行数据?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除数据
        this.sheetData.splice(index, 1)

        // 提示删除成功
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        // 取消删除
      })
    },

    // 添加新行数据
    addNewRow(componentName, rowData) {
      // 只处理当前组件的数据
      if (componentName !== 'RunningList') return

      // 构造新行数据，包含默认值
      const newRow = {
        departure_station_name: rowData.departure_station_name || 'string',
        departure_station_distance: rowData.departure_station_distance || 0,
        arrival_station_name: rowData.arrival_station_name || 'string',
        arrival_station_distance: rowData.arrival_station_distance || 0,
        track: rowData.track || 'string',
        train: rowData.train || 'string',
        train_load: rowData.train_load || true
      }

      // 根据insertPosition决定在哪里插入新行
      if (rowData.index >= 0 && rowData.index < this.sheetData.length) {
        // 在指定位置插入
        this.sheetData.splice(rowData.index + 1, 0, newRow)
      } else {
        // 在末尾插入
        this.sheetData.push(newRow)
      }

      // 提示添加成功
      this.$message({
        type: 'success',
        message: '添加行成功!'
      })
    },

    // 处理计算按钮点击事件
    handleCalculate(row, index) {
      this.currentCalculation = {
        from: row.departure_station_name,
        to: row.arrival_station_name
      }
      this.showCalculation = true
    },

    // 处理计算所有行命令
    handleCalculateCommand(command) {
      if (command === 'travelTime') {
        this.calculateAllTravelTime()
      } else if (command === 'minHeadway') {
        this.calculateAllMinHeadway()
      }
    },

    // 计算所有行的通行时间
    calculateAllTravelTime() {
      this.calculatingAllRows = true
      this.calculationState.travelTime.status = 'warning'
      this.calculationState.travelTime.percentage = 70
      this.currentCalculation = {
        from: this.sheetData[0]?.departure_station_name || '',
        to: this.sheetData[0]?.arrival_station_name || ''
      }

      setTimeout(() => {
        this.calculationState.travelTime.status = 'success'
        this.calculationState.travelTime.percentage = 100
        this.globalTravelTimeCalculated = true
        this.calculatingAllRows = false

        this.calculationResults.travelTime = {
          time: '3.2分钟',
          details: '通行时间计算完成，详细数据已生成'
        }

        // 通知父组件更新状态
        this.$emit('travel-time-calculated', true)

        this.$message({
          type: 'success',
          message: '所有行的通行时间计算完成！'
        })
      }, 2000)
    },

    // 计算所有行的最小间隔时间
    calculateAllMinHeadway() {
      if (!this.globalTravelTimeCalculated) {
        this.$message({
          type: 'warning',
          message: '请先计算所有行的通行时间！'
        })
        return
      }

      this.calculatingAllRows = true
      this.calculationState.minHeadway.status = 'warning'
      this.calculationState.minHeadway.percentage = 70

      setTimeout(() => {
        this.calculationState.minHeadway.status = 'success'
        this.calculationState.minHeadway.percentage = 100
        this.calculatingAllRows = false

        this.$message({
          type: 'success',
          message: '所有行的最小间隔时间计算完成！'
        })
      }, 3000)
    },

    // 计算单行通行时间
    calculateTravelTime() {
      this.calculationState.travelTime.status = 'warning'
      this.calculationState.travelTime.percentage = 70

      setTimeout(() => {
        this.calculationState.travelTime.status = 'success'
        this.calculationState.travelTime.percentage = 100
        this.calculationState.minHeadway.enabled = true

        this.calculationResults.travelTime = {
          time: '3.2分钟',
          details: '通行时间计算完成，详细数据已生成'
        }

        // 通知父组件更新状态
        this.$emit('travel-time-calculated', true)

        this.$message({
          type: 'success',
          message: '通行时间计算成功！'
        })
      }, 2000)
    },

    // 计算单行最小间隔时间
    calculateMinHeadway() {
      if (!this.calculationState.minHeadway.enabled) {
        this.$message({
          type: 'warning',
          message: '请先计算通行时间！'
        })
        return
      }

      this.calculationState.minHeadway.status = 'warning'
      this.calculationState.minHeadway.percentage = 70

      setTimeout(() => {
        this.calculationState.minHeadway.status = 'success'
        this.calculationState.minHeadway.percentage = 100

        this.calculationResults.minHeadway = {
          time: '2分钟',
          details: '最小间隔时间计算完成，详细数据已生成'
        }

        this.$message({
          type: 'success',
          message: '最小间隔时间计算成功！'
        })
      }, 3000)
    },

    // 导出计算结果为Excel文件
    exportResultToExcel(calculationType) {
      this.$message({
        type: 'success',
        message: `已导出${calculationType === 'travelTime' ? '通行时间' : '最小间隔时间'}计算结果到Excel文件`
      })
    },

    // 导出计算结果为图片文件
    exportResultToImage(calculationType) {
      // 这里应该有导出图片的实际逻辑，目前使用模拟
      // 显示详情对话框
      this.generateRandomDetailData()
      this.detailDialogVisible = true

      this.$message({
        type: 'success',
        message: `已导出${calculationType === 'travelTime' ? '通行时间' : '最小间隔时间'}计算结果到图片文件`
      })
    },

    // 生成随机的详情数据
    generateRandomDetailData() {
      // 模块1数据
      this.detailData.module1 = {
        intervalTitle: '间隔值: ' + (Math.random() * 50).toFixed(2) + ' 秒',
        time1: (Math.random() * 60).toFixed(2) + ' 秒',
        time2: (Math.random() * 30).toFixed(2) + ' 秒',
        time3: (Math.random() * 45).toFixed(2) + ' 秒',
        interval: (Math.random() * 180).toFixed(2) + ' 秒'
      }

      // 模块2数据 - 随机生成1-3个区间
      const sectionCount = Math.floor(Math.random() * 3) + 1
      this.detailData.module2 = []

      for (let i = 0; i < sectionCount; i++) {
        this.detailData.module2.push({
          intervalTitle: '间隔值: ' + (Math.random() * 40).toFixed(2) + ' 秒',
          startPoint: `起始点${i + 1}`,
          endPoint: `终点${i + 1}`,
          bottleneckPosition: `瓶颈位置${i + 1}`,
          clearPosition: `出清位置${i + 1}`,
          dangerPosition: `危险位置${i + 1}`,
          bottleneckToClearTime: (Math.random() * 50).toFixed(2) + ' 秒',
          clearDelayTime: (Math.random() * 20).toFixed(2) + ' 秒',
          sectionInterval: (Math.random() * 150).toFixed(2) + ' 秒'
        })
      }

      // 模块3数据
      this.detailData.module3 = {
        intervalTitle: '间隔值: ' + (Math.random() * 60).toFixed(2) + ' 秒',
        entranceBottleneck: '进站瓶颈点A',
        stopPoint: '停车点B',
        platformStopTime: (Math.random() * 40).toFixed(2) + ' 秒',
        frontTrainToClearTime: (Math.random() * 60).toFixed(2) + ' 秒',
        clearDelayTime: (Math.random() * 25).toFixed(2) + ' 秒',
        receiveTrainTime: (Math.random() * 35).toFixed(2) + ' 秒',
        rearTrainToStopTime: (Math.random() * 55).toFixed(2) + ' 秒',
        trainInterval: (Math.random() * 200).toFixed(2) + ' 秒'
      }
    },

    // 查看图片
    viewImage(moduleType, index) {
      this.$message({
        type: 'success',
        message: `查看模块${moduleType}的图片，索引: ${index || 0}`
      })
    },

    // 导出Excel
    exportExcel(moduleType, index) {
      this.$message({
        type: 'success',
        message: `导出模块${moduleType}的Excel文件，索引: ${index || 0}`
      })
    }
  }
}
</script>

<style scoped>
.running-list-container {
  padding: 0;
}

.calculation-dialog {
  .el-dialog__body {
    padding: 20px;
  }
}

.calculation-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.calculation-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  width: 45%;
}

.progress-wrapper {
  margin: 20px 0;
}

.result-actions {
  margin-top: 10px;
}

.result-actions .el-button {
  margin: 0 5px;
}

.calculation-info {
  margin-top: 15px;
  text-align: center;
  color: #606266;
}

.calculation-info p {
  margin: 5px 0;
  font-size: 14px;
}

/* 添加详情对话框样式 */
.detail-dialog {
  .el-dialog {
    min-width: 1000px;
  }
}

.detail-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.detail-module {
  margin-bottom: 30px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  box-sizing: border-box; /* 确保边框和内边距不影响宽度计算 */
  width: 100%; /* 确保所有模块宽度一致 */
  overflow: hidden; /* 防止内容溢出 */
}

.module-content {
  display: flex;
  align-items: center; /* 改为垂直居中对齐 */
  width: 100%; /* 确保宽度一致 */
  box-sizing: border-box;
  position: relative; /* 确保所有定位相对于这个容器 */
}

.left-column {
  width: 18%;
  margin-right: 2%;
}

.middle-column {
  width: 38%;
  margin-right: 2%;
}

.section-middle-left {
  width: 18%;
  margin-right: 2%;
}

.section-middle-right {
  width: 20%;
  margin-right: 2%;
}

.right-column {
  width: 18%;
  margin-right: 2%;
}

.action-column {
  width: 20% !important; /* 保持宽度一致 */
  position: relative !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  margin: 0 !important;
}

.action-column > div {
  position: absolute !important;
  right: 0 !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 140px !important;
}

.action-column .el-button {
  width: 140px !important;
  min-width: 140px !important;
  max-width: 140px !important;
  box-sizing: border-box !important;
  display: block !important;
  margin: 0 !important;
}

.action-column .el-button:first-child {
  margin-bottom: 12px !important;
}

.label-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
}

.label-item span {
  margin-right: 0;
  margin-bottom: 8px;
  color: #409EFF; /* 蓝色 */
  font-size: 14px;
  text-align: center; /* 标签文字居中 */
  white-space: nowrap; /* 防止文字换行 */
  width: auto; /* 宽度自适应内容 */
  min-width: 100px; /* 最小宽度 */
}

.label-item /deep/ .el-input {
  /* 输入框宽度比标签宽度多10% */
  width: auto; /* 宽度自适应 */
  min-width: 110px; /* 最小宽度 */
  box-sizing: border-box; /* 确保边框和内边距不影响宽度 */
}

.left-column .label-item,
.right-column .label-item {
  margin-top: 8px;
}

/* 调整输入框样式 - 确保所有输入框内文字居中 */
/deep/ .el-input__inner {
  text-align: center !important;
}

/* 调整输入框样式 */
.label-item /deep/ .el-input__inner {
  font-size: 14px;
  padding: 0 10px;
  height: 36px;
  line-height: 36px;
  text-align: center !important; /* 输入框内文字居中，增加优先级 */
  box-sizing: border-box; /* 确保边框和内边距不影响宽度 */
}
</style>
