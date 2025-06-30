import request from '@/utils/request'
import store from '@/store'

// Track相关API

/**
 * 保存Gen Param数据
 * @param {Object} data - Gen Param数据
 * @returns {Promise} 保存结果
 */
export function saveGenParam(data) {
  return request({
    url: 'track/gen_param/save',
    method: 'post',
    data
  })
}

/**
 * 获取Gen Param数据
 * @param {number} projectId - 项目ID
 * @param {string} direction - 方向，up或down
 * @returns {Promise} Gen Param数据
 */
export function getGenParam(projectId, direction) {
  return request({
    url: `track/gen_param/${projectId}/${direction}`,
    method: 'get'
  })
}

/**
 * 批量保存Track数据
 * @param {Array} data - Track数据数组
 * @returns {Promise} 保存结果
 */
export function saveTracks(data) {
  return request({
    url: 'track/tracks/save',
    method: 'post',
    data
  })
}

/**
 * 获取Track数据
 * @param {number} projectId - 项目ID
 * @param {string} direction - 方向，up或down
 * @returns {Promise} Track数据数组
 */
export function getTracks(projectId, direction) {
  return request({
    url: `track/tracks/${projectId}/${direction}`,
    method: 'get'
  })
}

/**
 * 删除Track记录
 * @param {number} id - Track记录ID
 * @returns {Promise} 删除结果
 */
export function deleteTrack(id) {
  return request({
    url: `track/tracks/${id}`,
    method: 'delete'
  })
}

/**
 * 从API删除轨道记录（兼容方法）
 * @param {number} id - Track记录ID
 * @returns {Promise} 删除结果
 */
export function deleteTrackFromApi(id) {
  return deleteTrack(id)
}
