import request from '@/utils/request'

/**
 * 批量保存Running List数据
 * @param {Object} data - 包含项目ID、方向和记录数组的对象
 * @returns {Promise} 保存结果
 */
export function saveRunningList(data) {
  return request({
    url: '/running/list/save',
    method: 'post',
    data
  })
}

/**
 * 获取运行列表数据
 * @param {Object} params - 请求参数 {project_id, version, skip, limit, user_id}
 * @returns {Promise}
 */
export function getRunningList(params) {
  return request({
    url: '/running_profile/running_list',
    method: 'get',
    params
  })
}

/**
 * 创建新的Running Profile文件
 * @param {Object} data - 文件数据
 * @param {Object} params - 请求参数，包含project_id, version, user_id
 * @returns {Promise}
 */
export function createRunningProfile(data, params) {
  return request({
    url: '/running_profile/running_list',
    method: 'post',
    params,
    data
  })
}

/**
 * 删除Running List数据
 * @param {number} id - 记录ID
 * @returns {Promise} 删除结果
 */
export function deleteRunningList(id) {
  return request({
    url: `/running/list/${id}`,
    method: 'delete'
  })
}

/**
 * 计算通行时间
 * @param {Object} params - 计算参数
 * @returns {Promise} 计算结果
 */
export function calculateTransitTime(params) {
  return request({
    url: '/running/calculate/transit-time',
    method: 'post',
    data: params
  })
}

/**
 * 计算最小间隔时间
 * @param {Object} params - 计算参数
 * @returns {Promise} 计算结果
 */
export function calculateMinHeadway(params) {
  return request({
    url: '/running/calculate/min-headway',
    method: 'post',
    data: params
  })
}

/**
 * 导出计算结果为Excel
 * @param {string} type - 计算类型：'transit-time'或'min-headway'
 * @param {Object} params - 导出参数
 * @returns {Promise} 导出结果
 */
export function exportResultToExcel(type, params) {
  return request({
    url: `/running/export/${type}/excel`,
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

/**
 * 导出计算结果为图片
 * @param {string} type - 计算类型：'transit-time'或'min-headway'
 * @param {Object} params - 导出参数
 * @returns {Promise} 导出结果
 */
export function exportResultToImage(type, params) {
  return request({
    url: `/running/export/${type}/image`,
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

/**
 * 删除Running Profile文件
 * @param {number} runningListId - 要删除的Running List ID
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function deleteRunningProfile(runningListId, userId) {
  return request({
    url: `/running_profile/running_list/${runningListId}`,
    method: 'delete',
    params: {
      user_id: userId
    }
  })
}

/**
 * 更新Running Profile文件
 * @param {number} runningListId - 要更新的Running List ID
 * @param {Object} data - 更新的文件数据
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function updateRunningProfile(runningListId, data, userId) {
  return request({
    url: `/running_profile/running_list/${runningListId}`,
    method: 'put',
    params: {
      user_id: userId
    },
    data
  })
}
