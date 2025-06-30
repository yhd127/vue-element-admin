import request from '@/utils/request'
import store from '@/store'

/**
 * 获取项目列表
 * @returns {Promise} 返回项目列表数据
 */
export function getProjectList() {
  return request({
    url: 'project/getProjectInfoList',
    method: 'get'
  })
}

/**
 * 创建新项目
 * @param {Object} data - 项目数据
 * @returns {Promise} 创建结果
 */
export function createProject(data) {
  // 获取用户ID，尝试多种方式
  let userId = store.getters.userId

  // 如果store中没有，尝试从localStorage获取
  if (!userId) {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      userId = storedUserId
    }
  }

  console.log('createProject使用的userId:', userId)

  return request({
    url: '/project/addOrUpdateProject',
    method: 'post',
    params: { user_id: userId },
    data: {
      project_name: data.project_name,
      project_inputfile_count: data.project_inputfile_count || 0,
      project_outputfile_excel_count: data.project_outputfile_excel_count || 0,
      project_output_file_picture_count: data.project_output_file_picture_count || 0,
      edit_user_name: data.edit_user_name || 'admin'
    },
    noDefaultParams: true // 不添加默认参数
  })
}

/**
 * 获取项目详情
 * @param {number} projectId - 项目ID
 * @returns {Promise} 项目详情
 */
export function getProjectDetail(projectId) {
  return request({
    url: `project/detail/${projectId}`,
    method: 'get'
  })
}

/**
 * 更新项目信息
 * @param {Object} data - 项目更新数据
 * @returns {Promise} 更新结果
 */
export function updateProject(data) {
  return request({
    url: 'project/addOrUpdateProject',
    method: 'post',
    params: { user_id: store.getters.userId },
    data
  })
}

/**
 * 删除项目
 * @param {number} projectId - 项目ID
 * @returns {Promise} 删除结果
 */
export function deleteProject(projectId) {
  return request({
    url: 'project/deleteProject',
    method: 'delete',
    params: {
      project_id: projectId,
      user_id: store.getters.userId
    }
  })
}

/**
 * 检查项目名是否已注册
 * @param {string} name - 项目名称
 * @returns {Promise} 检查结果
 */
export function checkProjectRegistered(name) {
  return request({
    url: 'project/getIsRegistered',
    method: 'get',
    params: { name }
  })
}

/**
 * 获取文件列表
 * @param {number} projectId - 项目ID
 * @param {number} version - 版本号
 * @returns {Promise} 文件列表
 */
export function getFileList(projectId, version = 1) {
  return request({
    url: 'project/getFileInfoList',
    method: 'get',
    params: {
      project_id: projectId,
      version: version,
      user_id: store.getters.userId
    }
  })
}

/**
 * 保存文件信息
 * @param {Object} data - 文件数据
 * @returns {Promise} 保存结果
 */
export function saveFile(data) {
  return request({
    url: 'file/save',
    method: 'post',
    data
  })
}

/**
 * 删除文件
 * @param {number} fileId - 文件ID
 * @returns {Promise} 删除结果
 */
export function deleteFile(fileId) {
  return request({
    url: `file/delete/${fileId}`,
    method: 'delete'
  })
}
