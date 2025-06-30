import request from '@/utils/request'

/**
 * 获取用户的项目权限列表
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getUserProjects(userId) {
  return request({
    url: `/user/${userId}/projects`,
    method: 'get'
  })
}

/**
 * 更新用户的项目权限
 * @param {number} userId - 用户ID
 * @param {Array} projectIds - 项目ID数组
 * @returns {Promise}
 */
export function updateUserProjects(userId, projectIds) {
  return request({
    url: `/user/${userId}/projects`,
    method: 'put',
    data: {
      project_ids: projectIds
    }
  })
}

/**
 * 获取项目的用户权限列表
 * @param {number} projectId - 项目ID
 * @returns {Promise}
 */
export function getProjectUsers(projectId) {
  return request({
    url: `/project/${projectId}/users`,
    method: 'get'
  })
}

/**
 * 更新项目的用户权限
 * @param {number} projectId - 项目ID
 * @param {Array} userIds - 用户ID数组
 * @returns {Promise}
 */
export function updateProjectUsers(projectId, userIds) {
  return request({
    url: `/project/${projectId}/users`,
    method: 'put',
    data: {
      user_ids: userIds
    }
  })
}
