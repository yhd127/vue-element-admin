import request from '@/utils/request'
import store from '@/store'

/**
 * 获取路由
 * @returns {Promise}
 */
export function getRoutes() {
  return request({
    url: 'routes',
    method: 'get'
  })
}

/**
 * 添加或更新角色
 * @param {Object} data - 角色信息
 * @returns {Promise}
 */
export function addOrUpdateRole(data) {
  return request({
    url: 'user/addOrUpdateOptions',
    method: 'post',
    data
  })
}

/**
 * 添加或更新角色选项
 * @param {number} roleId - 角色ID
 * @param {Object} data - 选项数据
 * @returns {Promise}
 */
export function addOrUpdateOptions(roleId, data) {
  return request({
    url: 'role/addOrUpdateOptions',
    method: 'post',
    params: { role_id: roleId },
    data
  })
}

/**
 * 获取操作权限
 * @returns {Promise}
 */
export function getOpPermissions() {
  return request({
    url: 'role/getOpPermissions',
    method: 'get'
  })
}

// 新版角色列表API（不带参数，路径为/role/）
export function getRoleListV1() {
  return request({
    url: '/role/',
    method: 'get'
  })
}

// 新版创建角色API
export function createRoleV1(data) {
  return request({
    url: '/role/',
    method: 'post',
    data
  })
}

// 新版更新角色API
export function updateRoleV1(roleIdx, data) {
  return request({
    url: `/role/${roleIdx}`,
    method: 'put',
    data
  })
}

// 新版删除角色API
export function deleteRoleV1(roleIdx) {
  return request({
    url: `/role/${roleIdx}`,
    method: 'delete'
  })
}
