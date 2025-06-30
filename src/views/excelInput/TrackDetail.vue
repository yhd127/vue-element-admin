<template>
  <div class="track-detail-container">
    <!-- 顶部操作区 -->
    <div class="top-actions">
      <el-button type="primary" @click="showMinHeadwayDetail" :loading="loadingMinHeadwayDetail">计算</el-button>
    </div>

    <!-- 最小间隔时间详情对话框 -->
    <el-dialog
      title="最小间隔时间详情"
      :visible.sync="detailDialogVisible"
      width="90%"
      :before-close="handleCloseDetail"
      class="headway-detail-dialog">
      <div class="detail-container" v-loading="loadingMinHeadwayDetail">
        <!-- 发车模块 -->
        <div class="detail-module module1">
          <div class="left-column">
            <div class="interval-title">{{ detailData.module1.intervalTitle }}</div>
            <div class="interval-items">
              <div class="interval-item">
                <span class="item-label">发车点至出清点时间:</span>
                <span class="item-value">{{ detailData.module1.time1 }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">出清延迟时间:</span>
                <span class="item-value">{{ detailData.module1.time2 }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">发车进路办理时间:</span>
                <span class="item-value">{{ detailData.module1.time3 }}</span>
              </div>
            </div>
          </div>
          <div class="middle-column">
            <div class="location-info">
              <!-- 位置信息可以在需要时添加 -->
            </div>
          </div>
          <div class="right-column">
            <div class="interval-result">
              <span class="result-label">发车时间间隔:</span>
              <span class="result-value">{{ detailData.module1.interval }}</span>
            </div>
            <div class="action-buttons">
              <el-button size="mini" type="primary" @click="viewImage('departure')">查看图片</el-button>
              <el-button size="mini" type="success" @click="exportExcel('departure')">导出Excel</el-button>
            </div>
          </div>
        </div>

        <!-- 区间模块 - 可能有多个区段 -->
        <div class="detail-module module2" v-for="(block, index) in detailData.module2" :key="'block-'+index">
          <div class="left-column">
            <div class="interval-title">{{ block.intervalTitle }}</div>
            <div class="interval-items">
              <div class="interval-item">
                <span class="item-label">区段起始点:</span>
                <span class="item-value">{{ block.startPoint }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">区段终点:</span>
                <span class="item-value">{{ block.endPoint }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">瓶颈点位置:</span>
                <span class="item-value">{{ block.bottleneckPosition }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">出清点位置:</span>
                <span class="item-value">{{ block.clearPosition }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">危险点位置:</span>
                <span class="item-value">{{ block.dangerPosition }}</span>
              </div>
            </div>
          </div>
          <div class="middle-column">
            <div class="interval-items">
              <div class="interval-item">
                <span class="item-label">瓶颈点至出清点时间:</span>
                <span class="item-value">{{ block.bottleneckToClearTime }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">出清延迟时间:</span>
                <span class="item-value">{{ block.clearDelayTime }}</span>
              </div>
            </div>
          </div>
          <div class="right-column">
            <div class="interval-result">
              <span class="result-label">区段时间间隔:</span>
              <span class="result-value">{{ block.sectionInterval }}</span>
            </div>
            <div class="action-buttons">
              <el-button size="mini" type="primary" @click="viewImage('blocks', index)">查看图片</el-button>
              <el-button size="mini" type="success" @click="exportExcel('blocks', index)">导出Excel</el-button>
            </div>
          </div>
        </div>

        <!-- 接车模块 -->
        <div class="detail-module module3">
          <div class="left-column">
            <div class="interval-title">{{ detailData.module3.intervalTitle }}</div>
            <div class="interval-items">
              <div class="interval-item">
                <span class="item-label">进站瓶颈点:</span>
                <span class="item-value">{{ detailData.module3.entranceBottleneck }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">停车点:</span>
                <span class="item-value">{{ detailData.module3.stopPoint }}</span>
              </div>
            </div>
          </div>
          <div class="middle-column">
            <div class="interval-items">
              <div class="interval-item">
                <span class="item-label">站台停车时间:</span>
                <span class="item-value">{{ detailData.module3.platformStopTime }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">前车从发车点至股道出清点时间:</span>
                <span class="item-value">{{ detailData.module3.frontTrainToClearTime }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">出清延迟时间:</span>
                <span class="item-value">{{ detailData.module3.clearDelayTime }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">接车进路办理时间:</span>
                <span class="item-value">{{ detailData.module3.receiveTrainTime }}</span>
              </div>
              <div class="interval-item">
                <span class="item-label">后车从瓶颈点至停车点时间:</span>
                <span class="item-value">{{ detailData.module3.rearTrainToStopTime }}</span>
              </div>
            </div>
          </div>
          <div class="right-column">
            <div class="interval-result">
              <span class="result-label">接车时间间隔:</span>
              <span class="result-value">{{ detailData.module3.trainInterval }}</span>
            </div>
            <div class="action-buttons">
              <el-button size="mini" type="primary" @click="viewImage('arrival')">查看图片</el-button>
              <el-button size="mini" type="success" @click="exportExcel('arrival')">导出Excel</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog :visible.sync="imageDialogVisible" append-to-body class="image-preview-dialog">
      <div class="image-container">
        <img :src="currentImageUrl" alt="计算结果图" class="preview-image">
      </div>
      <div class="image-actions">
        <el-button type="primary" @click="downloadImage">下载图片</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TrackDetail',
  data() {
    return {
      // 加载状态
      loadingMinHeadwayDetail: false,
      
      // 对话框可见性控制
      detailDialogVisible: false,
      imageDialogVisible: false,
      
      // 当前选中行
      selectedRow: null,
      
      // 详情数据
      detailData: {
        module1: {
          intervalTitle: '间隔值: 0.00 秒',
          time1: '0.00 秒',
          time2: '0.00 秒',
          time3: '0.00 秒',
          interval: '0.00 秒'
        },
        module2: [],
        module3: {
          intervalTitle: '间隔值: 0.00 秒',
          entranceBottleneck: '0.00 m',
          stopPoint: '0.00 m',
          platformStopTime: '0.00 秒',
          frontTrainToClearTime: '0.00 秒',
          clearDelayTime: '0.00 秒',
          receiveTrainTime: '0.00 秒',
          rearTrainToStopTime: '0.00 秒',
          trainInterval: '0.00 秒'
        }
      },
      
      // 图片相关
      currentImageUrl: '',
      currentImageFileName: ''
    };
  },
  methods: {
    // 显示最小间隔时间详情
    showMinHeadwayDetail() {
      // 模拟选中第一行
      this.selectedRow = {
        departureStation: '上海',
        arrivalStation: '北京',
        _index: 0
      };
      
      // 显示加载状态
      this.loadingMinHeadwayDetail = true;
      
      // 获取行ID用于加载数据
      const rowId = this.getRowId(this.selectedRow);
      
      // 构建JSON文件路径
      const jsonPath = `/data/result/min_headway_detail_${rowId}.json`;
      
      // 通过fetch API获取JSON数据
      fetch(jsonPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // 解析各模块数据
          this.processHeadwayDetailData(data);
          
          // 显示详情对话框
          this.detailDialogVisible = true;
        })
        .catch(error => {
          // 错误处理
          console.error('加载最小间隔时间详情失败:', error);
          this.$message.error('加载详情数据失败，使用默认数据显示');
          
          // 加载默认数据
          this.loadDefaultHeadwayDetailData();
        })
        .finally(() => {
          // 关闭加载状态
          this.loadingMinHeadwayDetail = false;
        });
    },
    
    // 行ID生成方法
    getRowId(row) {
      // 针对Running list表格的行
      if (row.departureStation && row.arrivalStation) {
        const departureStation = row.departureStation.replace(/\s+/g, '');
        const arrivalStation = row.arrivalStation.replace(/\s+/g, '');
        const index = row._index || 0;
        return `${departureStation}-${arrivalStation}-${index}`;
      }
      
      // 针对其他表格的行
      return `row-${row._index || 0}`;
    },
    
    // 加载默认数据
    loadDefaultHeadwayDetailData() {
      fetch('/data/result/default_min_headway_detail.json')
        .then(response => response.json())
        .then(data => {
          this.processHeadwayDetailData(data);
          this.detailDialogVisible = true;
        })
        .catch(error => {
          console.error('加载默认数据也失败:', error);
          this.$message.error('无法加载任何数据，请检查网络连接');
          
          // 使用硬编码的示例数据
          this.useHardcodedExampleData();
        });
    },
    
    // 使用硬编码示例数据
    useHardcodedExampleData() {
      // 模块1数据 - 发车模块
      this.detailData.module1 = {
        intervalTitle: '间隔值: 25.00 秒',
        time1: '30.00 秒',
        time2: '15.00 秒',
        time3: '22.50 秒',
        interval: '90.00 秒'
      }

      // 模块2数据 - 区间模块 (默认创建一个区间)
      this.detailData.module2 = [{
        intervalTitle: '间隔值: 20.00 秒',
        startPoint: '起始点1',
        endPoint: '终点1',
        bottleneckPosition: '瓶颈位置1',
        clearPosition: '出清位置1',
        dangerPosition: '危险位置1',
        bottleneckToClearTime: '25.00 秒',
        clearDelayTime: '10.00 秒',
        sectionInterval: '75.00 秒'
      }]

      // 模块3数据 - 接车模块
      this.detailData.module3 = {
        intervalTitle: '间隔值: 30.00 秒',
        entranceBottleneck: '进站瓶颈点A',
        stopPoint: '停车点B',
        platformStopTime: '20.00 秒',
        frontTrainToClearTime: '30.00 秒',
        clearDelayTime: '12.50 秒',
        receiveTrainTime: '17.50 秒',
        rearTrainToStopTime: '27.50 秒',
        trainInterval: '100.00 秒'
      }
      
      // 显示详情对话框
      this.detailDialogVisible = true;
    },
    
    // 处理最小间隔时间详情数据
    processHeadwayDetailData(data) {
      // 处理发车模块数据
      this.processDepatureData(data);
      
      // 处理区间模块数据
      this.processBlocksData(data);
      
      // 处理接车模块数据
      this.processArriverData(data);
    },
    
    // 处理发车模块数据
    processDepatureData(data) {
      if (!data.departure) return;
      
      const departureTotal = this.calcTotal(
        data.departure.timeFromDepartureToBlockClear || 0,
        data.departure.cleanDelayTime || 0,
        data.departure.departureRouteTime || 0
      );

      this.detailData.module1 = {
        intervalTitle: '间隔值: ' + this.formatDetailValue(departureTotal) + ' 秒',  // 左侧标题框
        time1: this.formatDetailValue(data.departure.timeFromDepartureToBlockClear) + ' 秒',  // 发车点至出清点时间
        time2: this.formatDetailValue(data.departure.cleanDelayTime) + ' 秒',  // 出清延迟时间
        time3: this.formatDetailValue(data.departure.departureRouteTime) + ' 秒',  // 发车进路办理时间
        interval: this.formatDetailValue(departureTotal) + ' 秒'  // 右侧总时间
      }
    },
    
    // 处理区间模块数据
    processBlocksData(data) {
      if (!data.blocks || !Array.isArray(data.blocks)) return;
      
      this.detailData.module2 = data.blocks.map((block, index) => {
        const blockTotal = this.calcTotal(
          block.timeFromBottleneckToBlockClear || 0,
          block.cleanDelayTime || 0
        );

        return {
          intervalTitle: '间隔值: ' + this.formatDetailValue(blockTotal) + ' 秒',  // 左侧标题框
          startPoint: this.formatDetailValue(block.blockStartDistance) + ' m',     // 区段起始点
          endPoint: this.formatDetailValue(block.blockEndDistance) + ' m',         // 区段终点
          bottleneckPosition: this.formatDetailValue(block.blockBottleneckPoint) + ' m',  // 瓶颈点位置
          clearPosition: this.formatDetailValue(block.blockClearPoint) + ' m',     // 出清点位置
          dangerPosition: this.formatDetailValue(block.blockDangerPoint) + ' m',   // 危险点位置
          bottleneckToClearTime: this.formatDetailValue(block.timeFromBottleneckToBlockClear) + ' 秒',  // 瓶颈点至出清点时间
          clearDelayTime: this.formatDetailValue(block.cleanDelayTime) + ' 秒',    // 出清延迟时间
          sectionInterval: this.formatDetailValue(blockTotal) + ' 秒'              // 区段总时间间隔
        };
      });
    },
    
    // 处理接车模块数据
    processArriverData(data) {
      if (!data.arriver) return;
      
      const arriverTotal = this.calcTotal(
        data.arriver.stionStopTime || 0,
        data.arriver.blockClearPoint || 0,
        data.arriver.timeClearDelay || 0,
        data.arriver.arriverRouteTime || 0,
        data.arriver.timeFromBottleneckToStop || 0
      );

      this.detailData.module3 = {
        intervalTitle: '间隔值: ' + this.formatDetailValue(arriverTotal) + ' 秒',  // 左侧标题框
        entranceBottleneck: this.formatDetailValue(data.arriver.blockBottleneckPoint) + ' m',  // 进站瓶颈点
        stopPoint: this.formatDetailValue(data.arriver.stationStopPoint) + ' m',  // 停车点
        platformStopTime: this.formatDetailValue(data.arriver.stionStopTime) + ' 秒',  // 站台停车时间
        frontTrainToClearTime: this.formatDetailValue(data.arriver.blockClearPoint) + ' 秒',  // 前车从发车点至股道出清点时间
        clearDelayTime: this.formatDetailValue(data.arriver.timeClearDelay) + ' 秒',  // 出清延迟时间
        receiveTrainTime: this.formatDetailValue(data.arriver.arriverRouteTime) + ' 秒',  // 接车进路办理时间
        rearTrainToStopTime: this.formatDetailValue(data.arriver.timeFromBottleneckToStop) + ' 秒',  // 后车从瓶颈点至停车点时间
        trainInterval: this.formatDetailValue(arriverTotal) + ' 秒'  // 接车总时间间隔
      }
    },
    
    // 计算总和
    calcTotal(...values) {
      return values.reduce((sum, value) => sum + parseFloat(value || 0), 0);
    },
    
    // 格式化数值显示
    formatDetailValue(value) {
      if (value === undefined || value === null) return '0.00';
      return parseFloat(value).toFixed(2);
    },
    
    // 关闭详情对话框
    handleCloseDetail() {
      this.detailDialogVisible = false;
    },
    
    // 查看图片
    viewImage(moduleType, blockIndex = 0) {
      let imagePath = '';
      const origin = this.selectedRow?.departureStation?.replace(/\s+/g, '') || 'SH';
      const destination = this.selectedRow?.arrivalStation?.replace(/\s+/g, '') || 'BJ';
      
      switch(moduleType) {
        case 'departure':
          imagePath = `/data/result/departure/${origin}-${destination}.png`;
          this.currentImageFileName = `发车模块_${origin}-${destination}.png`;
          break;
        case 'blocks':
          imagePath = `/data/result/blocks/block-${blockIndex + 1}.png`;
          this.currentImageFileName = `区间模块${blockIndex + 1}_${origin}-${destination}.png`;
          break;
        case 'arrival':
          imagePath = `/data/result/arrival/${origin}-${destination}.png`;
          this.currentImageFileName = `接车模块_${origin}-${destination}.png`;
          break;
      }
      
      this.currentImageUrl = imagePath;
      this.imageDialogVisible = true;
    },
    
    // 导出Excel
    exportExcel(moduleType, blockIndex = 0) {
      const origin = this.selectedRow?.departureStation?.replace(/\s+/g, '') || 'SH';
      const destination = this.selectedRow?.arrivalStation?.replace(/\s+/g, '') || 'BJ';
      const timestamp = new Date().getTime();
      let fileName = '';
      
      switch(moduleType) {
        case 'departure':
          fileName = `发车模块_${origin}-${destination}_${timestamp}.xlsx`;
          break;
        case 'blocks':
          fileName = `区间模块${blockIndex + 1}_${origin}-${destination}_${timestamp}.xlsx`;
          break;
        case 'arrival':
          fileName = `接车模块_${origin}-${destination}_${timestamp}.xlsx`;
          break;
      }
      
      // 模拟Excel导出
      this.$message.success(`正在生成Excel文件: ${fileName}`);
      
      // 在实际应用中，这里应该调用后端接口生成并下载Excel文件
      setTimeout(() => {
        this.$message.success(`Excel文件已生成并下载`);
      }, 1500);
    },
    
    // 下载图片
    downloadImage() {
      if (!this.currentImageUrl) return;
      
      // 创建一个虚拟链接用于下载
      const link = document.createElement('a');
      link.href = this.currentImageUrl;
      link.download = this.currentImageFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>

<style scoped>
.track-detail-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.top-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-start;
}

/* 详情对话框样式 */
.headway-detail-dialog >>> .el-dialog {
  max-width: 1600px;
}

.detail-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 10px;
}

.detail-module {
  display: flex;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.module1 {
  border-left: 4px solid #409EFF;
}

.module2 {
  border-left: 4px solid #67C23A;
}

.module3 {
  border-left: 4px solid #E6A23C;
}

.left-column {
  flex: 1;
  padding-right: 15px;
}

.middle-column {
  flex: 1;
  padding: 0 15px;
}

.right-column {
  flex: 1;
  padding-left: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.interval-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  margin-bottom: 15px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.interval-items {
  margin-bottom: 15px;
}

.interval-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.item-label {
  font-size: 14px;
  color: #606266;
  min-width: 140px;
  padding-right: 10px;
}

.item-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.interval-result {
  text-align: right;
  margin-bottom: 15px;
}

.result-label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}

.result-value {
  font-size: 16px;
  color: #303133;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 图片预览对话框样式 */
.image-preview-dialog >>> .el-dialog {
  max-width: 1200px;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.image-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .detail-module {
    flex-direction: column;
  }
  
  .left-column, .middle-column, .right-column {
    padding: 10px 0;
    width: 100%;
  }
  
  .right-column {
    margin-top: 15px;
  }
  
  .interval-result {
    text-align: left;
  }
  
  .action-buttons {
    justify-content: flex-start;
  }
}
</style> 