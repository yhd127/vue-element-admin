/**
 * 文件夹配置
 * 这个文件定义了所有文件夹及其关联信息
 * 要添加新文件夹，只需在此添加新的配置项
 */
export const folderConfig = {
  // Track文件夹配置
  'Track': {
    id: 'Track',
    label: 'Track',
    icon: 'el-icon-folder',
    color: '#e6a23c',
    availableSheets: [
      '总体参数(Gen. Param.)',
      '长短链(Tracks)',
      '坡度(Gradient)',
      '车站(Stations)',
      '线路限速(PSR)',
      '分相区(Unbridgeable gap)',
      '轨道区段(Block description)'
    ],
    defaultSheet: '总体参数(Gen. Param.)'
  },

  // Running_profile文件夹配置
  'Running_profile': {
    id: 'Running_profile',
    label: 'Running_profile',
    icon: 'el-icon-folder',
    color: '#e6a23c',
    availableSheets: [
      'Running list'
    ],
    defaultSheet: 'Running list'
  }

  // 未来可以在这里添加更多文件夹配置
  // 'New_Folder': {
  // id: 'New_Folder',
  // label: '新文件夹',
  // icon: 'el-icon-folder',
  // color: '#e6a23c',
  // availableSheets: ['Sheet1', 'Sheet2'],
  // defaultSheet: 'Sheet1'
  // }
}

/**
 * 获取所有文件夹ID
 */
export function getAllFolderIds() {
  return Object.keys(folderConfig)
}

/**
 * 获取指定文件夹的配置
 * @param {string} folderId 文件夹ID
 * @returns {Object} 文件夹配置
 */
export function getFolderConfig(folderId) {
  return folderConfig[folderId] || null
}

/**
 * 获取文件夹可用的工作表
 * @param {string} folderId 文件夹ID
 * @returns {Array} 可用工作表列表
 */
export function getFolderAvailableSheets(folderId) {
  const folder = getFolderConfig(folderId)
  return folder ? folder.availableSheets : []
}

/**
 * 获取文件夹默认工作表
 * @param {string} folderId 文件夹ID
 * @returns {string} 默认工作表名称
 */
export function getFolderDefaultSheet(folderId) {
  const folder = getFolderConfig(folderId)
  return folder ? folder.defaultSheet : null
}
