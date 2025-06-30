/**
 * 曲线相关计算功能
 */
import { findMatchIndexInTracks } from './trackCalculations'

/**
 * 计算Curve表的T1值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String} 计算后的T1值
 */
export function calculateCurveT1(row, tracksData, direction) {
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
 * 计算Curve表的T2值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String} 计算后的T2值
 */
export function calculateCurveT2(row, tracksData, direction) {
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
 * 计算Curve表的Track2值
 * @param {Object} row 当前行数据
 * @returns {String} 计算后的Track2值
 */
export function calculateCurveTrack2(row) {
  const track1Value = row.Track1
  const t1Value = row.T1
  const t2Value = row.T2

  // 使用与Gradient表相同的公式
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
 * 计算Curve表的KP correction值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String|Number} 计算后的KP_correction值
 */
export function calculateCurveKPCorrection(row, tracksData, direction) {
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
 * 计算Curve表的Distance值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值
 * @returns {String|Number} 计算后的Distance值
 */
export function calculateCurveDistance(row, direction) {
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
 * 计算Curve表的曲线半径
 * @param {Object} row 当前行数据
 * @returns {String|Number} 计算后的曲线半径值
 */
export function calculateCurveRadius(row) {
  const radiusValue = row.radius

  // 处理空值情况
  if (radiusValue === '' || radiusValue === undefined) {
    return row.Radius || 0
  } else {
    return Number(radiusValue) || 0
  }
}

/**
 * 计算Curve表的CantActual值
 * @param {Object} row 当前行数据
 * @returns {String|Number} 计算后的CantActual值
 */
export function calculateCurveCantActual(row) {
  const cantValue = row.Cant

  // 处理空值情况
  if (cantValue === '' || cantValue === undefined) {
    return row.CantActual || 0
  } else {
    return Number(cantValue) || 0
  }
}

/**
 * 计算Curve表的CantDeficiency值
 * @param {Object} row 当前行数据
 * @param {Number} speedValue 速度值
 * @returns {String|Number} 计算后的CantDeficiency值
 */
export function calculateCurveCantDeficiency(row, speedValue) {
  const radiusValue = Number(row.Radius) || 0
  
  // 防止除以零错误
  if (radiusValue === 0) {
    return 0
  }

  // 使用公式: 11.8 * v^2 / R - CantActual
  const speedSquared = speedValue * speedValue
  const cantActual = Number(row.CantActual) || 0
  
  // 计算Cant不足量
  const deficiency = (11.8 * speedSquared / radiusValue) - cantActual
  
  return Math.round(deficiency)
}

/**
 * 计算Curve表的CantExcess值
 * @param {Object} row 当前行数据
 * @param {Number} lowSpeedValue 低速值
 * @returns {String|Number} 计算后的CantExcess值
 */
export function calculateCurveCantExcess(row, lowSpeedValue) {
  const radiusValue = Number(row.Radius) || 0
  
  // 防止除以零错误
  if (radiusValue === 0) {
    return 0
  }

  // 使用公式: CantActual - 11.8 * v^2 / R
  const speedSquared = lowSpeedValue * lowSpeedValue
  const cantActual = Number(row.CantActual) || 0
  
  // 计算Cant过剩量
  const excess = cantActual - (11.8 * speedSquared / radiusValue)
  
  return Math.round(excess)
}

/**
 * 更新所有Curve行的字段
 * @param {Array} curveRows 曲线数据数组
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @param {Number} highSpeed 高速值
 * @param {Number} lowSpeed 低速值
 */
export function updateAllCurveFields(curveRows, tracksData, direction, highSpeed, lowSpeed) {
  curveRows.forEach(row => {
    row.T1 = calculateCurveT1(row, tracksData, direction)
    row.T2 = calculateCurveT2(row, tracksData, direction)
    row.Track2 = calculateCurveTrack2(row)
    row.KP_correction = calculateCurveKPCorrection(row, tracksData, direction)
    row.Distance = calculateCurveDistance(row, direction)
    row.Radius = calculateCurveRadius(row)
    row.CantActual = calculateCurveCantActual(row)
    row.CantDeficiency = calculateCurveCantDeficiency(row, highSpeed)
    row.CantExcess = calculateCurveCantExcess(row, lowSpeed)
  })
}

export default {
  calculateCurveT1,
  calculateCurveT2,
  calculateCurveTrack2,
  calculateCurveKPCorrection,
  calculateCurveDistance,
  calculateCurveRadius,
  calculateCurveCantActual,
  calculateCurveCantDeficiency,
  calculateCurveCantExcess,
  updateAllCurveFields
} 