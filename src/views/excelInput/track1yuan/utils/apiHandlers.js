/**
 * API处理模块
 * 用于处理与后端API的交互逻辑
 */

import * as trackApi from '@/api/track1' // 导入分离出来的API方法
import * as runningProfileApi from '@/api/runningprofile' // 导入Running Profile API方法

/**
 * 获取轨道数据
 * @param {Number} projectId 项目ID
 * @param {String} direction 方向，默认为'down'
 * @returns {Promise} API响应
 */
export async function fetchTrackRecords(projectId, direction = 'down') {
  try {
    const data = await trackApi.getTracks(projectId, direction)
    return {
      success: true,
      data,
      message: `成功加载了 ${data.length} 条轨道记录`
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `API数据加载失败: ${error.message || '未知错误'}`
    }
  }
}

/**
 * 保存轨道数据到API
 * @param {Array} tracksData 轨道数据
 * @param {Number} projectId 项目ID
 * @param {String|Number} direction 方向参数
 * @returns {Promise} API响应
 */
export async function saveTrackToApi(tracksData, projectId, direction) {
  try {
    // 将数字类型的direction转换为字符串类型（1='down', 0='up'）
    const directionStr = typeof direction === 'number' 
      ? (direction === 0 ? 'up' : 'down')
      : direction

    // 转换数据格式
    const apiData = tracksData.map(track => ({
      id: track.id || 0,
      track_id_before_jump: track.Track_ID_before_jump,
      kp_before_jump: Number(track.KP_before_jump),
      kp_after_jump: Number(track.KP_after_jump),
      track_id_after_jump: track.Track_ID_after_jump,
      jump_length: Number(track.Jump_length || 0),
      correction_applied_to_kp: Number(track.Correction_applied_to_KP || 0),
      distance_from_origin: Number(track.Distance_from_track_origin_to_jump_point || 0),
      project_id: projectId,
      direction: directionStr
    }))

    await trackApi.saveTracks(apiData)
    return {
      success: true,
      message: '数据保存成功'
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `API数据保存失败: ${error.message || '未知错误'}`
    }
  }
}

/**
 * 从API获取运行配置数据
 * @param {Number} projectId 项目ID
 * @param {String} direction 方向，默认为'down'
 * @returns {Promise} API响应
 */
export async function getRunningProfileFromAPI(projectId, direction = 'down') {
  try {
    const response = await runningProfileApi.getRunningList(projectId, direction)
    const data = response.data || []

    return {
      success: true,
      data,
      message: `成功加载了 ${data.length} 条运行配置记录`
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `API数据加载失败: ${error.message || '未知错误'}`
    }
  }
}

/**
 * 保存运行配置数据到API
 * @param {Array} runningListData 运行配置数据
 * @param {Number} projectId 项目ID
 * @param {String} direction 方向，默认为'down'
 * @returns {Promise} API响应
 */
export async function saveRunningProfileToAPI(runningListData, projectId, direction = 'down') {
  try {
    // 准备API请求数据
    const requestData = {
      project_id: projectId,
      direction: direction,
      records: runningListData.map(item => ({
        id: item.id || 0,
        project_id: projectId,
        direction: direction,
        min_version: 1,
        max_version: 1,
        profile_name: 'Default Profile',
        departure_station_name: item.departureStation,
        departure_station_distance: Number(item.departureDistance),
        arrival_station_name: item.arrivalStation,
        arrival_station_distance: Number(item.arrivalDistance),
        performance_objective: 0,
        safe_visibility: 0,
        functional_visibility: 0,
        perf: 0,
        limit_visibility: 0,
        perf2: 0,
        track: item.track,
        train: item.train,
        train_load: item.trainLoad === true || item.trainLoad === 'true' || item.trainLoad === 1,
        station_stop_time: item.stationStopTime || '',
        profile_type_1: 0,
        runing_profile_1: 0
      }))
    }

    await runningProfileApi.saveRunningList(requestData)
    return {
      success: true,
      message: '运行配置数据保存成功'
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `API数据保存失败: ${error.message || '未知错误'}`
    }
  }
}

/**
 * 将API获取的轨道数据转换为Excel格式
 * @param {Array} trackRecords API返回的轨道数据
 * @returns {Object} 转换后的Excel格式数据
 */
export function convertApiTrackDataToExcel(trackRecords) {
  if (!trackRecords || trackRecords.length === 0) {
    return null
  }

  // 创建Tracks工作表数据
  const tracksData = trackRecords.map(record => {
    if (!record) return null
    return {
      Track_ID_before_jump: record.id || '',
      KP_before_jump: record.kp_before_jump || '',
      KP_after_jump: record.kp_after_jump || '',
      Track_ID_after_jump: record.if_after_jump || '',
      Correction_applied_to_KP: 0,
      Distance_from_track_origin_to_jump_point: '',
      Distance: 0
    }
  }).filter(Boolean)

  // 创建Gen. Param.工作表数据
  let genParamData = []
  if (trackRecords.length > 0 && trackRecords[0]) {
    const direction = trackRecords[0].direction || 1
    genParamData = [
      {
        paramName: 'Direction',
        value: direction,
        description: '轨道方向'
      }
    ]
  }

  return {
    'Tracks': {
      data: tracksData
    },
    'Gen. Param.': {
      data: genParamData
    }
  }
}

/**
 * 将API获取的运行配置数据转换为Excel格式
 * @param {Array} runningProfileData API返回的运行配置数据
 * @returns {Object} 转换后的Excel格式数据
 */
export function convertApiRunningDataToExcel(runningProfileData) {
  if (!runningProfileData || !runningProfileData.length) {
    return null
  }

  const runningListData = runningProfileData.map(item => ({
    departureStation: item.departure_station_name,
    departureDistance: item.departure_station_distance,
    arrivalStation: item.arrival_station_name,
    arrivalDistance: item.arrival_station_distance,
    track: item.track,
    train: item.train,
    trainLoad: item.train_load === true ? 1 : 0,
    stationStopTime: item.station_stop_time || ''
  }))

  return {
    'Running list': {
      data: runningListData
    }
  }
} 