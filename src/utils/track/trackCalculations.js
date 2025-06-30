/**
 * 轨道相关计算功能
 */

/**
 * 计算Jump length
 * @param {Object} row 当前行数据
 */
export function calculateJumpLength(row) {
  // 如果KP_before_jump为空，返回0
  if (row.KP_before_jump === '' || row.KP_before_jump === undefined) {
    return 0
  }

  // 如果KP_after_jump为空，返回0
  if (row.KP_after_jump === '' || row.KP_after_jump === undefined) {
    return 0
  }

  // 计算跳跃长度 = KP_after_jump - KP_before_jump
  const kpBefore = Number(row.KP_before_jump) || 0
  const kpAfter = Number(row.KP_after_jump) || 0
  
  return kpAfter - kpBefore
}

/**
 * 计算所有行的Correction applied to KP
 * @param {Array} tracks 轨道数据数组
 */
export function calculateCorrectionValues(tracks) {
  if (!tracks || tracks.length === 0) {
    return
  }

  // 初始化第一行的修正值为0
  tracks[0].Correction_applied_to_KP = 0
  
  // 从第二行开始，根据前面行的值计算修正值
  for (let i = 1; i < tracks.length; i++) {
    const prevRow = tracks[i - 1]
    const currentRow = tracks[i]
    
    // 计算当前行的修正值 = 前一行修正值 + 前一行跳跃长度
    const prevCorrection = Number(prevRow.Correction_applied_to_KP) || 0
    const prevJumpLength = calculateJumpLength(prevRow)
    
    currentRow.Correction_applied_to_KP = prevCorrection + prevJumpLength
  }
}

/**
 * 计算Distance_from_track_origin_to_jump_point
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值
 */
export function calculateDistanceFromOrigin(row, direction) {
  // 如果KP_before_jump为空，返回0
  if (row.KP_before_jump === '' || row.KP_before_jump === undefined) {
    return 0
  }

  // 计算距离 = KP_before_jump * direction
  const kpBefore = Number(row.KP_before_jump) || 0
  
  return kpBefore * direction
}

/**
 * 更新下一行的Track_ID_before_jump
 * @param {Array} tracks 轨道数据数组
 * @param {Number} index 当前行索引
 */
export function updateNextRowTrackId(tracks, index) {
  if (!tracks || index >= tracks.length - 1) {
    return
  }
  
  const currentRow = tracks[index]
  const nextRow = tracks[index + 1]
  
  // 将当前行的Track_ID_after_jump赋值给下一行的Track_ID_before_jump
  nextRow.Track_ID_before_jump = currentRow.Track_ID_after_jump
}

/**
 * 在Tracks表中查找匹配值的索引
 * @param {String} columnName 列名
 * @param {Number} numericValue 数值
 * @param {Array} tracksData 轨道数据数组
 * @param {Number} dir 方向
 * @returns {Number} 匹配行的索引
 */
export function findMatchIndexInTracks(columnName, numericValue, tracksData, dir) {
  if (!tracksData || tracksData.length === 0) {
    return -1
  }

  // 确保方向值有效
  const direction = dir === -1 ? -1 : 1

  // 创建用于查找的排序数组
  const sortedData = [...tracksData].sort((a, b) => {
    const valA = Number(a[columnName]) || 0
    const valB = Number(b[columnName]) || 0
    return direction === 1 ? valA - valB : valB - valA
  })

  // 查找第一个大于等于(或小于等于)目标值的项
  let matchIndex = -1
  
  if (direction === 1) {
    // 升序查找: 找到第一个大于等于目标值的项
    matchIndex = sortedData.findIndex(item => {
      const val = Number(item[columnName]) || 0
      return val >= numericValue
    })
  } else {
    // 降序查找: 找到第一个小于等于目标值的项
    matchIndex = sortedData.findIndex(item => {
      const val = Number(item[columnName]) || 0
      return val <= numericValue
    })
  }

  if (matchIndex === -1) {
    return -1
  }

  // 将排序后的索引转换回原始数组中的索引
  const matchedItem = sortedData[matchIndex]
  return tracksData.findIndex(item => item === matchedItem)
}

/**
 * 更新插入行之后的所有行的关联数据
 * @param {Array} tracks 轨道数据数组
 * @param {Number} startIndex 开始索引
 * @param {Number} direction 方向值
 */
export function updateTrackRowsAfterInsert(tracks, startIndex, direction) {
  if (!tracks || tracks.length === 0 || startIndex < 0 || startIndex >= tracks.length) {
    return
  }

  // 更新从startIndex开始的所有行的Track_ID_before_jump
  for (let i = startIndex; i < tracks.length - 1; i++) {
    updateNextRowTrackId(tracks, i)
  }

  // 重新计算所有行的修正值
  calculateCorrectionValues(tracks)

  // 更新所有行的距离
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].Distance_from_origin = calculateDistanceFromOrigin(tracks[i], direction)
  }
}

export default {
  calculateJumpLength,
  calculateCorrectionValues,
  calculateDistanceFromOrigin,
  updateNextRowTrackId,
  findMatchIndexInTracks,
  updateTrackRowsAfterInsert
} 