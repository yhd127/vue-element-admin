/**
 * 运行清单计算模块
 * 提供行车清单相关的所有计算函数
 */

/**
 * 模拟计算通行时间
 * @param {Object} row 当前行数据
 * @param {Number} rowIndex 行索引
 * @returns {Number} 计算出的通行时间（秒）
 */
export const calculateTravelTime = (row, rowIndex) => {
  // 模拟通行时间计算 - 基于行索引返回预定义的值
  const travelTimes = [
    211.50, // 第1行
    464.00, // 第2行
    203.00, // 第3行
    385.50, // 第4行
    239.00, // 第5行
    418.00, // 第6行
    164.50, // 第7行
    251.00  // 第8行
  ]

  // 获取当前行的计算时间，如果超出范围则使用默认值
  return travelTimes[rowIndex] || 200.00
}

/**
 * 计算最小间隔时间
 * @param {Object} row 当前行数据
 * @param {Number} rowIndex 行索引
 * @param {Number} travelTime 已计算的通行时间
 * @returns {Object} 计算结果，包括最小间隔时间和各个模块的详细数据
 */
export const calculateMinHeadway = (row, rowIndex, travelTime) => {
  // 基于行索引生成模拟数据
  const minHeadway = 2.5 + (rowIndex * 0.5)
  
  // 生成详细数据
  const detailData = {
    // 模块1：发车间隔
    module1: {
      intervalTitle: '发车间隔',
      time1: (20 + rowIndex * 5).toFixed(1),
      time2: (15 + rowIndex * 3).toFixed(1),
      time3: (10 + rowIndex * 2).toFixed(1),
      interval: (45 + rowIndex * 10).toFixed(1)
    },
    // 模块2：区间间隔（可能有多个）
    module2: [
      {
        intervalTitle: '区间间隔 1',
        startPoint: `${row.departureStation || 'Station A'} (${rowIndex * 10 + 100})`,
        endPoint: `${row.arrivalStation || 'Station B'} (${rowIndex * 10 + 200})`,
        bottleneckPosition: `位置 ${rowIndex * 50 + 150}`,
        clearPosition: `位置 ${rowIndex * 50 + 180}`,
        dangerPosition: `位置 ${rowIndex * 50 + 160}`,
        bottleneckToClearTime: (30 + rowIndex * 5).toFixed(1),
        clearDelayTime: (10 + rowIndex * 2).toFixed(1),
        sectionInterval: (120 + rowIndex * 15).toFixed(1)
      }
    ],
    // 模块3：接车间隔
    module3: {
      intervalTitle: '接车间隔',
      entranceBottleneck: `入口瓶颈 ${rowIndex * 10 + 300}`,
      stopPoint: `停车点 ${rowIndex * 10 + 320}`,
      platformStopTime: (60 + rowIndex * 10).toFixed(1),
      frontTrainToClearTime: (25 + rowIndex * 5).toFixed(1),
      clearDelayTime: (15 + rowIndex * 3).toFixed(1),
      receiveTrainTime: (20 + rowIndex * 4).toFixed(1),
      rearTrainToStopTime: (35 + rowIndex * 7).toFixed(1),
      trainInterval: (155 + rowIndex * 20).toFixed(1)
    }
  }
  
  return {
    minHeadway: minHeadway.toFixed(1),
    detailData: detailData,
    images: [
      // 模拟图片路径
      '/images/calculation/departure.png',
      '/images/calculation/section1.png',
      '/images/calculation/arrival.png'
    ]
  }
}

/**
 * 格式化详细计算数据（从后端返回的格式转换为前端展示格式）
 * @param {Object} detailData 详细计算数据
 * @returns {Object} 格式化后的详细数据
 */
export const formatDetailData = (detailData) => {
  // 如果没有详细数据，返回默认结构
  if (!detailData) {
    return {
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
    }
  }
  
  // 返回已格式化的数据
  return detailData
} 