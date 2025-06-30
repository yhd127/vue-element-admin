/**
 * 计算功能处理模块
 * 用于处理运行配置的通行时间和最小间隔时间计算功能
 */

import * as runningProfileApi from '@/api/runningprofile'

/**
 * 计算单行通行时间
 * @param {Object} row 当前行数据
 * @param {Number} rowIndex 行索引
 * @param {Number} projectId 项目ID
 * @returns {Promise} 计算结果
 */
export async function calculateTravelTime(row, rowIndex, projectId) {
  try {
    const params = {
      project_id: projectId,
      departure_station: row.departureStation,
      departure_distance: Number(row.departureDistance),
      arrival_station: row.arrivalStation,
      arrival_distance: Number(row.arrivalDistance),
      track: row.track || 'default_track',
      train: row.train || 'default_train',
      train_load: row.trainLoad === true || row.trainLoad === 'true' || row.trainLoad === 1
    }

    const response = await runningProfileApi.calculateTravelTime(params)
    
    if (!response || !response.data) {
      throw new Error('计算结果为空')
    }

    return {
      success: true,
      data: {
        time: response.data.time || '0s',
        details: response.data.details || '',
        images: response.data.images || [],
        excelFiles: response.data.excel_files || []
      },
      rowIndex,
      message: '通行时间计算成功'
    }
  } catch (error) {
    return {
      success: false,
      rowIndex,
      error,
      message: `通行时间计算失败: ${error.message || '未知错误'}`
    }
  }
}

/**
 * 计算单行最小间隔时间
 * @param {Object} row 当前行数据
 * @param {Number} rowIndex 行索引
 * @param {Number} projectId 项目ID
 * @param {Object} travelTimeResult 通行时间计算结果
 * @returns {Promise} 计算结果
 */
export async function calculateMinHeadway(row, rowIndex, projectId, travelTimeResult) {
  try {
    if (!travelTimeResult || !travelTimeResult.success) {
      throw new Error('需要先成功计算通行时间')
    }

    const params = {
      project_id: projectId,
      departure_station: row.departureStation,
      departure_distance: Number(row.departureDistance),
      arrival_station: row.arrivalStation,
      arrival_distance: Number(row.arrivalDistance),
      track: row.track || 'default_track',
      train: row.train || 'default_train',
      train_load: row.trainLoad === true || row.trainLoad === 'true' || row.trainLoad === 1,
      travel_time_data: travelTimeResult.data
    }

    const response = await runningProfileApi.calculateMinHeadway(params)
    
    if (!response || !response.data) {
      throw new Error('计算结果为空')
    }

    return {
      success: true,
      data: {
        time: response.data.time || '0s',
        details: response.data.details || '',
        images: response.data.images || [],
        detailData: response.data.detail_data || {},
        intervals: response.data.intervals || []
      },
      rowIndex,
      message: '最小间隔时间计算成功'
    }
  } catch (error) {
    return {
      success: false,
      rowIndex,
      error,
      message: `最小间隔时间计算失败: ${error.message || '未知错误'}`
    }
  }
}

/**
 * 计算所有行的通行时间
 * @param {Array} rows 所有行数据
 * @param {Number} projectId 项目ID
 * @param {Function} progressCallback 进度回调函数
 * @returns {Promise} 所有计算结果
 */
export async function calculateAllTravelTimes(rows, projectId, progressCallback) {
  const results = []
  let success = true
  let message = ''
  let completedCount = 0

  for (let i = 0; i < rows.length; i++) {
    try {
      // 调用进度回调
      if (progressCallback) {
        progressCallback(Math.floor((completedCount / rows.length) * 100))
      }

      const result = await calculateTravelTime(rows[i], i, projectId)
      results.push(result)
      
      if (!result.success) {
        success = false
        message = `第${i+1}行计算失败: ${result.message}`
      }

      completedCount++
    } catch (error) {
      results.push({
        success: false,
        rowIndex: i,
        error,
        message: `第${i+1}行计算出错: ${error.message || '未知错误'}`
      })
      success = false
      message = `第${i+1}行计算出错: ${error.message || '未知错误'}`
      completedCount++
    }
  }

  // 最终调用进度回调
  if (progressCallback) {
    progressCallback(100)
  }

  return {
    success,
    results,
    message: success ? '所有行通行时间计算成功' : message
  }
}

/**
 * 计算所有行的最小间隔时间
 * @param {Array} rows 所有行数据
 * @param {Array} travelTimeResults 通行时间计算结果
 * @param {Number} projectId 项目ID
 * @param {Function} progressCallback 进度回调函数
 * @returns {Promise} 所有计算结果
 */
export async function calculateAllMinHeadways(rows, travelTimeResults, projectId, progressCallback) {
  const results = []
  let success = true
  let message = ''
  let completedCount = 0

  for (let i = 0; i < rows.length; i++) {
    try {
      // 调用进度回调
      if (progressCallback) {
        progressCallback(Math.floor((completedCount / rows.length) * 100))
      }

      // 获取对应的通行时间结果
      const travelTimeResult = travelTimeResults.find(r => r.rowIndex === i)
      const result = await calculateMinHeadway(rows[i], i, projectId, travelTimeResult)
      results.push(result)
      
      if (!result.success) {
        success = false
        message = `第${i+1}行计算失败: ${result.message}`
      }

      completedCount++
    } catch (error) {
      results.push({
        success: false,
        rowIndex: i,
        error,
        message: `第${i+1}行计算出错: ${error.message || '未知错误'}`
      })
      success = false
      message = `第${i+1}行计算出错: ${error.message || '未知错误'}`
      completedCount++
    }
  }

  // 最终调用进度回调
  if (progressCallback) {
    progressCallback(100)
  }

  return {
    success,
    results,
    message: success ? '所有行最小间隔时间计算成功' : message
  }
}

/**
 * 格式化详细数据用于计算对话框展示
 * @param {Object} detailData 详细数据
 * @returns {Object} 格式化后的数据
 */
export function formatDetailData(detailData) {
  return {
    module1: {
      intervalTitle: '发车时间间隔',
      time1: detailData.departure_time || '0',
      time2: detailData.clear_delay || '0',
      time3: detailData.route_time || '0',
      interval: detailData.departure_interval || '0'
    },
    module2: detailData.sections ? detailData.sections.map(section => ({
      intervalTitle: section.title || '区间间隔',
      startPoint: section.start_point || '',
      endPoint: section.end_point || '',
      bottleneckPosition: section.bottleneck_position || '',
      clearPosition: section.clear_position || '',
      dangerPosition: section.danger_position || '',
      bottleneckToClearTime: section.bottleneck_to_clear_time || '0',
      clearDelayTime: section.clear_delay_time || '0',
      sectionInterval: section.interval || '0'
    })) : [],
    module3: {
      intervalTitle: '接车时间间隔',
      entranceBottleneck: detailData.entrance_bottleneck || '',
      stopPoint: detailData.stop_point || '',
      platformStopTime: detailData.platform_stop_time || '0',
      frontTrainToClearTime: detailData.front_train_to_clear_time || '0',
      clearDelayTime: detailData.clear_delay_time || '0',
      receiveTrainTime: detailData.receive_train_time || '0',
      rearTrainToStopTime: detailData.rear_train_to_stop_time || '0',
      trainInterval: detailData.receive_interval || '0'
    }
  }
} 