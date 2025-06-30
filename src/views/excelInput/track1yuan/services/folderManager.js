/**
 * 文件夹管理服务
 * 负责处理文件夹和文件的管理、加载和操作
 */
import { folderConfig, getAllFolderIds, getFolderConfig, getFolderAvailableSheets, getFolderDefaultSheet } from '../config/folders'

// 模拟文件数据存储
const folderFilesStore = {}

/**
 * 初始化文件夹管理器
 */
export function initFolderManager() {
  // 为每个文件夹初始化空文件列表
  const folderIds = getAllFolderIds()
  folderIds.forEach(folderId => {
    folderFilesStore[folderId] = []
  })

  return {
    folderConfig,
    folderFilesStore
  }
}

/**
 * 设置文件夹的文件列表
 * @param {string} folderId 文件夹ID
 * @param {Array} files 文件列表
 */
export function setFolderFiles(folderId, files) {
  if (folderFilesStore[folderId]) {
    folderFilesStore[folderId] = files
  }
}

/**
 * 获取文件夹的文件列表
 * @param {string} folderId 文件夹ID
 * @returns {Array} 文件列表
 */
export function getFolderFiles(folderId) {
  return folderFilesStore[folderId] || []
}

/**
 * 获取所有文件夹的文件列表
 * @returns {Object} 文件夹ID到文件列表的映射
 */
export function getAllFolderFiles() {
  return { ...folderFilesStore }
}

/**
 * 将文件夹数据转换为树形结构
 * @returns {Array} 树形结构数据
 */
export function getFolderTreeData() {
  const folderIds = getAllFolderIds()

  return folderIds.map(folderId => {
    const folder = getFolderConfig(folderId)
    const files = getFolderFiles(folderId)

    return {
      id: folderId,
      label: folder.label,
      icon: folder.icon,
      color: folder.color,
      isFolder: true,
      children: files.map(file => ({
        id: `${folderId}-${file.name}`, // 使用文件夹ID+文件名作为唯一标识
        folderId: folderId,
        label: file.displayName || file.name,
        file: file,
        isFolder: false
      }))
    }
  })
}

/**
 * 根据文件夹ID获取可用的工作表
 * @param {string} folderId 文件夹ID
 * @returns {Array} 可用工作表列表
 */
export function getAvailableSheetsByFolderId(folderId) {
  return getFolderAvailableSheets(folderId)
}

/**
 * 根据文件夹ID获取默认工作表
 * @param {string} folderId 文件夹ID
 * @returns {string} 默认工作表名称
 */
export function getDefaultSheetByFolderId(folderId) {
  return getFolderDefaultSheet(folderId)
}

/**
 * 从菜单项ID解析文件夹和文件信息
 * @param {string} menuId 菜单项ID
 * @returns {Object} 解析后的信息
 */
export function parseMenuId(menuId) {
  // 如果是纯文件夹ID
  if (folderConfig[menuId]) {
    return {
      type: 'folder',
      folderId: menuId,
      folder: folderConfig[menuId],
      file: null
    }
  }

  // 尝试解析文件ID (格式：folderId-fileName)
  const parts = menuId.split('-')
  if (parts.length >= 2) {
    const folderId = parts[0]
    const folder = folderConfig[folderId]

    if (folder) {
      // 获取文件部分 (文件名可能包含连字符)
      const fileName = parts.slice(1).join('-')
      const files = getFolderFiles(folderId)
      const file = files.find(f => f.name === fileName)

      if (file) {
        return {
          type: 'file',
          folderId: folderId,
          folder: folder,
          file: file
        }
      }
    }
  }

  // 无法解析的情况
  return {
    type: 'unknown',
    folderId: null,
    folder: null,
    file: null
  }
}
