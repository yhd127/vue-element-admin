import request from '@/utils/request'
import store from '@/store'

/**
 * 用户登录
 * @param {Object} data - 登录信息，包含用户名和密码
 * @returns {Promise}
 */
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    params: {
      user_name: data.user_name || data.username,
      user_password: data.user_password || data.password
    },
    data: {}
  })
}

/**
 * 用户登出
 * @returns {Promise}
 */
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

/**
 * 重置/更新密码
 * @param {number} userId - 用户ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise}
 */
export function updatePassword(userId, oldPassword, newPassword) {
  return request({
    url: '/user/updatePassword',
    method: 'put',
    params: {
      user_id: userId,
      old_password: oldPassword,
      new_password: newPassword
    }
  })
}

/**
 * 获取用户信息
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getUserInfo(userId) {
  return request({
    url: `/user/userInfor/${userId}`,
    method: 'get'
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export function getInfo() {
  return request({
    url: '/user/me',
    method: 'get'
  })
}

/**
 * 创建或更新用户
 * @param {Object} data - 用户信息
 * @returns {Promise}
 */
export function createOrUpdateUser(data) {
  const params = {};

  // 如果是编辑模式（存在临时保存的userId），添加到请求参数
  if (data._userId) {
    params.user_id = data._userId;
    delete data._userId; // 删除临时字段
  }

  return request({
    url: '/user/addOrUpdateUser',
    method: 'post',
    params,
    data
  })
}

/**
 * 更新用户
 * @param {number} userId - 用户ID
 * @param {Object} data - 用户信息
 * @returns {Promise}
 */
export function updateUser(userId, data) {
  return request({
    url: `/user/${userId}`,
    method: 'put',
    data
  })
}

/**
 * 更新当前用户信息
 * @param {Object} data - 用户信息
 * @returns {Promise}
 */
export function updateCurrentUser(data) {
  return request({
    url: '/user/me',
    method: 'put',
    data
  })
}

/**
 * 通过ID获取用户信息
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getUserById(userId) {
  return request({
    url: `/user/${userId}`,
    method: 'get'
  })
}

/**
 * 检查用户名是否已注册
 * @param {string} userName - 用户名
 * @param {number} userId - 用户ID（编辑模式下使用）
 * @returns {Promise}
 */
export function checkUserRegistered(userName, userId) {
  return request({
    url: '/user/getIsRegistered',
    method: 'get',
    params: {
      user_name: userName,
      user_id: userId
    }
  })
}

/**
 * 删除用户
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function deleteUser(userId) {
  return request({
    url: '/user/deleteUser',
    method: 'delete',
    params: { user_id: userId }
  })
}

/**
 * 创建或更新角色
 * @param {Object} data - 角色信息
 * @returns {Promise}
 */
export function addOrUpdateRole(data) {
  return request({
    url: '/user/addOrUpdateOptions',
    method: 'post',
    data
  })
}

// 兼容旧版API的别名
export function createOrUpdate(data) {
  return createOrUpdateUser(data)
}

export function resetPwd(userId, oldPassword, newPassword) {
  return updatePassword(userId, oldPassword, newPassword)
}

export function getUserPageInfos(query) {
  return getUserList(query)
}

// 新版用户列表API
export function getUserListV1() {
  return request({
    url: '/user/',
    method: 'get'
  })
}

/**
 * 更新用户（新版API）
 * @param {number} idx - 用户ID
 * @param {Object} data - 用户信息
 * @returns {Promise}
 */
export function updateUserV1(idx, data) {
  return request({
    url: `/user/${idx}`,
    method: 'put',
    data
  })
}

/**
 * 通过idx获取用户详细信息（V1版API）
 * @param {number} idx - 用户的idx
 * @returns {Promise}
 */
export function getUserByIdxV1(idx) {
  return request({
    url: `/user/${idx}`,
    method: 'get'
  })
}

/**
 * 更新用户密码（V1版API）
 * @param {number} idx - 用户ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise}
 */
export function updatePasswordV1(idx, oldPassword, newPassword) {
  return request({
    url: `/user/updatePassword/${idx}`,
    method: 'put',
    params: {
      old_password: oldPassword,
      new_password: newPassword
    },
    data: {},
    noDefaultParams: true // 添加标记，告诉request不要添加默认参数
  })
}

/**
 * 删除用户（V1版API）
 * @param {number} idx - 用户ID
 * @returns {Promise}
 */
export function deleteUserV1(idx) {
  return request({
    url: `/user/deleteUser/${idx}`,
    method: 'delete',
    noDefaultParams: true // 不添加默认参数
  })
}

/**
 * 创建或更新用户（V1版API）
 * @param {Object} data - 用户信息
 * @returns {Promise}
 */
export function createOrUpdateUserV1(data) {
  return request({
    url: '/user/addOrUpdateUser',
    method: 'post',
    data,
    noDefaultParams: true // 不添加默认参数
  })
}
