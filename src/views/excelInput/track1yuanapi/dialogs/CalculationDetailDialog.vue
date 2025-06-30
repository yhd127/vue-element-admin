<template>
  <el-dialog
    title="计算结果详情"
    :visible.sync="visible"
    width="80%"
    class="detail-dialog"
    @close="handleClose"
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
              <el-input v-model="detailData.module1.time1" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>出清延迟时间</span>
              <el-input v-model="detailData.module1.time2" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>发车进路办理时间</span>
              <el-input v-model="detailData.module1.time3" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
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
              <el-button size="small" type="primary" @click="viewImage(1)" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;">查看图片</el-button>
              <el-button size="small" type="success" @click="exportExcel(1)" style="width: 140px; margin: 0; display: block; box-sizing: border-box;">导出Excel</el-button>
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
              <el-input v-model="item.bottleneckToClearTime" size="small" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>出清延迟时间</span>
              <el-input v-model="item.clearDelayTime" size="small" @input="handleInputChange" />
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
              <el-button size="small" type="primary" @click="viewImage(2, index)" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;">查看图片</el-button>
              <el-button size="small" type="success" @click="exportExcel(2, index)" style="width: 140px; margin: 0; display: block; box-sizing: border-box;">导出Excel</el-button>
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
              <el-input v-model="detailData.module3.platformStopTime" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>前车从发车点至股道出清点时间</span>
              <el-input v-model="detailData.module3.frontTrainToClearTime" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>出清延迟时间</span>
              <el-input v-model="detailData.module3.clearDelayTime" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>接车进路办理时间</span>
              <el-input v-model="detailData.module3.receiveTrainTime" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
            </div>
            <div class="label-item">
              <span>后车从瓶颈点至停车点时间</span>
              <el-input v-model="detailData.module3.rearTrainToStopTime" size="small" :input-style="{textAlign: 'center'}" @input="handleInputChange" />
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
              <el-button size="small" type="primary" @click="viewImage(3)" style="width: 140px; margin: 0 0 12px 0; display: block; box-sizing: border-box;">查看图片</el-button>
              <el-button size="small" type="success" @click="exportExcel(3)" style="width: 140px; margin: 0; display: block; box-sizing: border-box;">导出Excel</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'CalculationDetailDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    detailData: {
      type: Object,
      default: () => ({
        module1: {
          intervalTitle: '',
          time1: '',
          time2: '',
          time3: '',
          interval: ''
        },
        module2: [
          {
            intervalTitle: '',
            startPoint: '',
            endPoint: '',
            bottleneckPosition: '',
            clearPosition: '',
            dangerPosition: '',
            bottleneckToClearTime: '',
            clearDelayTime: '',
            sectionInterval: ''
          }
        ],
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
      })
    }
  },
  methods: {
    handleInputChange() {
      // 通知父组件数据已修改
      this.$emit('data-changed', this.detailData)
      
      // 计算新的值（这里假设父组件会处理实际计算）
      this.$emit('recalculate')
    },
    
    viewImage(moduleType, index = 0) {
      // 通知父组件显示图片
      this.$emit('view-image', { moduleType, index })
    },
    
    exportExcel(moduleType, index = 0) {
      // 通知父组件导出Excel
      this.$emit('export-excel', { moduleType, index })
    },
    
    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.detail-container {
  padding: 20px 0;
}

.detail-module {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
}

.module-content {
  display: flex;
  flex-wrap: wrap;
}

.left-column, .right-column {
  width: 15%;
  padding: 0 10px;
}

.middle-column {
  width: 30%;
  padding: 0 10px;
}

.section-middle-left, .section-middle-right {
  width: 20%;
  padding: 0 10px;
}

.label-item {
  margin-bottom: 15px;
}

.label-item span {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}
</style>