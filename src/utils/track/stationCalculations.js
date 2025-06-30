/**
 * 站台计算相关功能
 */
import { findMatchIndexInTracks } from './trackCalculations'

/**
 * 计算站台表的T1值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String} 计算后的T1值
 */
export function calculateStationT1(row, tracksData, direction) {
  const kpValue = row.KP

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  if (!tracksData || tracksData.length === 0) {
    return ''
  }

  // 使用通用的查找方法
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, direction)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return ''
  }

  // 检查是否完全匹配
  const matchedRow = tracksData[matchIndex]
  const matchedKP = Number(matchedRow.KP_before_jump) || 0

  if (matchedKP === numericKP) {
    return matchedRow.Track_ID_before_jump
  } else {
    const nextIndex = matchIndex + 1
    if (nextIndex < tracksData.length) {
      return tracksData[nextIndex].Track_ID_before_jump
    } else {
      return matchedRow.Track_ID_before_jump
    }
  }
}

/**
 * 计算站台表的T2值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String} 计算后的T2值
 */
export function calculateStationT2(row, tracksData, direction) {
  const kpValue = row.KP

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  if (!tracksData || tracksData.length === 0) {
    return ''
  }

  // 使用通用的查找方法
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, direction)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return ''
  }

  // 获取对应行的Track_ID_after_jump值
  return tracksData[matchIndex].Track_ID_after_jump
}

/**
 * 计算站台表的Track2值
 * @param {Object} row 当前行数据
 * @returns {String} 计算后的Track2值
 */
export function calculateStationTrack2(row) {
  const track1Value = row.Track1
  const t1Value = row.T1
  const t2Value = row.T2

  // 使用与其他表相同的公式
  if (track1Value === '' || track1Value === undefined) {
    if (t1Value === t2Value) {
      return t1Value
    } else {
      return ''
    }
  } else {
    return track1Value
  }
}

/**
 * 计算站台表的KP correction值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String|Number} 计算后的KP_correction值
 */
export function calculateStationKPCorrection(row, tracksData, direction) {
  const kpValue = row.KP
  const track2Value = row.Track2

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  if (!tracksData || tracksData.length === 0) {
    return ''
  }

  // 使用通用的查找方法
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, direction)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return '#N/A'
  }

  // 实现多重IF判断逻辑
  if (tracksData[matchIndex].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex].Correction_applied_to_KP
  } else if (matchIndex + 1 < tracksData.length &&
            tracksData[matchIndex + 1].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex + 1].Correction_applied_to_KP
  } else if (matchIndex - 1 >= 0 &&
            tracksData[matchIndex - 1].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex - 1].Correction_applied_to_KP
  } else {
    return '#N/A'
  }
}

/**
 * 计算站台表的Distance值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值
 * @returns {String|Number} 计算后的Distance值
 */
export function calculateStationDistance(row, direction) {
  const kpValue = row.KP
  const kpCorrection = row.KP_correction

  // 检查KP是否为空
  if (kpValue === '' || kpValue === undefined) {
    // 如果KP为空，使用当前Distance值+1与100000的较大值
    const currentDistanceValue = Number(row.Distance) || 0
    return Math.max(100000, currentDistanceValue + 1)
  } else {
    // 如果KP_correction为#N/A，结果也应该是#N/A
    if (kpCorrection === '#N/A') {
      return '#N/A'
    }

    // 如果KP不为空，使用当前行的KP和KP_correction计算
    const numericKP = Number(kpValue) || 0

    // 处理KP_correction
    let correctionValue = 0
    if (kpCorrection !== '' && kpCorrection !== undefined) {
      correctionValue = Number(kpCorrection) || 0
    }

    // 计算(KP + KP_correction) * dir
    return (numericKP + correctionValue) * direction
  }
}

/**
 * 计算站台停车精度
 * @param {Object} row 当前行数据
 * @param {String} stationType 站台类型
 * @returns {String|Number} 计算后的停车精度值
 */
export function calculateStationStoppingAccuracy(row, stationType) {
  // 根据站台类型返回停车精度
  if (stationType === 'A') {
    return 0.5
  } else if (stationType === 'B') {
    return 1.0
  } else if (stationType === 'C') {
    return 1.5
  } else {
    // 对于未知站台类型，返回默认值
    return row.Stopping_accuracy || 0
  }
}

/**
 * 计算站台延误时间
 * @param {Object} row 当前行数据
 * @param {Number} baseDelay 基础延误时间
 * @returns {Number} 计算后的延误时间
 */
export function calculateStationDelay(row, baseDelay) {
  const stationClass = row.Station_class
  
  // 根据站台等级计算延误时间
  if (stationClass === 'Major') {
    return baseDelay * 1.5
  } else if (stationClass === 'Minor') {
    return baseDelay * 1.0
  } else if (stationClass === 'Halt') {
    return baseDelay * 0.5
  } else {
    // 对于未知站台等级，返回基础延误时间
    return baseDelay
  }
}

/**
 * 更新所有Station行的字段
 * @param {Array} stationRows 站台数据数组
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @param {Number} baseDelay 基础延误时间
 */
export function updateAllStationFields(stationRows, tracksData, direction, baseDelay) {
  stationRows.forEach(row => {
    row.T1 = calculateStationT1(row, tracksData, direction)
    row.T2 = calculateStationT2(row, tracksData, direction)
    row.Track2 = calculateStationTrack2(row)
    row.KP_correction = calculateStationKPCorrection(row, tracksData, direction)
    row.Distance = calculateStationDistance(row, direction)
    row.Stopping_accuracy = calculateStationStoppingAccuracy(row, row.Station_type)
    row.Delay = calculateStationDelay(row, baseDelay)
  })
}

export default {
  calculateStationT1,
  calculateStationT2,
  calculateStationTrack2,
  calculateStationKPCorrection,
  calculateStationDistance,
  calculateStationStoppingAccuracy,
  calculateStationDelay,
  updateAllStationFields
} 