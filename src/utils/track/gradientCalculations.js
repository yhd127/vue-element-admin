/**
 * 坡度相关计算功能
 */
import { findMatchIndexInTracks } from './trackCalculations'

/**
 * 计算Gradient表的T1值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String} 计算后的T1值
 */
export function calculateGradientT1(row, tracksData, direction) {
  const kpValue = row.KP

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  if (!tracksData || tracksData.length === 0) {
    return ''
  }

  // 使用统一的findMatchIndexInTracks方法查找匹配的索引
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, direction)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return ''
  }

  // Excel公式中的IF判断
  const matchedRow = tracksData[matchIndex]
  const matchedKP = Number(matchedRow.KP_before_jump) || 0

  // 检查找到的KP是否与输入的KP完全相等
  if (matchedKP === numericKP) {
    // 完全匹配，使用当前行的Track_ID_before_jump
    return matchedRow.Track_ID_before_jump
  } else {
    // 不完全匹配，使用(MATCH返回的索引+1)行的Track_ID_before_jump
    const nextIndex = matchIndex + 1
    if (nextIndex < tracksData.length) {
      return tracksData[nextIndex].Track_ID_before_jump
    } else {
      // 如果已经是最后一行，使用当前行
      return matchedRow.Track_ID_before_jump
    }
  }
}

/**
 * 计算Gradient表的T2值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String} 计算后的T2值
 */
export function calculateGradientT2(row, tracksData, direction) {
  const kpValue = row.KP

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  if (!tracksData || tracksData.length === 0) {
    return ''
  }

  // 使用统一的findMatchIndexInTracks方法查找匹配的索引
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
 * 计算Gradient表的Track2值
 * @param {Object} row 当前行数据
 * @returns {String} 计算后的Track2值
 */
export function calculateGradientTrack2(row) {
  const track1Value = row.Track1
  const t1Value = row.T1
  const t2Value = row.T2

  // 应用公式: IF(AND(D4="",B4=C4),B4,IF(D4="","",D4))
  // 其中D4=Track1, B4=T1, C4=T2
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
 * 计算Gradient表的KP correction值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 * @returns {String|Number} 计算后的KP_correction值
 */
export function calculateGradientKPCorrection(row, tracksData, direction) {
  const kpValue = row.KP
  const track2Value = row.Track2

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  if (!tracksData || tracksData.length === 0) {
    return ''
  }

  // 使用统一的findMatchIndexInTracks方法查找匹配的索引
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, direction)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return '#N/A'
  }

  // 实现公式中的多重IF判断
  // 第一种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir))=G4
  if (tracksData[matchIndex].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex].Correction_applied_to_KP
  }
  // 第二种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)+1)=G4
  else if (matchIndex + 1 < tracksData.length &&
          tracksData[matchIndex + 1].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex + 1].Correction_applied_to_KP
  }
  // 第三种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)-1)=G4
  else if (matchIndex - 1 >= 0 &&
          tracksData[matchIndex - 1].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex - 1].Correction_applied_to_KP
  }
  // 如果都不匹配，返回N/A
  else {
    return '#N/A'
  }
}

/**
 * 计算Gradient表的Distance值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值
 * @returns {String|Number} 计算后的Distance值
 */
export function calculateGradientDistance(row, direction) {
  const kpValue = row.KP
  const kpCorrection = row.KP_correction

  // 应用修改后的公式: =IF(E4="",MAX(100000,I4+1),(E4+H4)*dir))
  // 不再判断I3是否为文本，直接处理当前行的值

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
 * 计算Gradient表的Slope_permille值
 * @param {Object} row 当前行数据
 * @returns {String|Number} 计算后的Slope_permille值
 */
export function calculateGradientSlopePermille(row) {
  const slopeValue = row.slope

  // 应用修改后的公式: =IF(F4="",J4,F4*10))
  // 不再判断J3是否为文本，直接处理当前行的值

  // 检查当前行的slope是否为空
  if (slopeValue === '' || slopeValue === undefined) {
    // 如果slope为空，保持当前Slope_permille的值
    // 如果Slope_permille也为空，设为0
    if (row.Slope_permille === '' || row.Slope_permille === undefined) {
      return 0
    }
    // 否则保持当前值不变
    return row.Slope_permille
  } else {
    // 如果slope不为空，直接计算slope*10
    const numericSlope = Number(slopeValue) || 0
    return (numericSlope * 10).toFixed(2)
  }
}

/**
 * 更新所有Gradient行的字段
 * @param {Array} gradientRows 坡度数据数组
 * @param {Array} tracksData Tracks数据数组
 * @param {Number} direction 方向值
 */
export function updateAllGradientFields(gradientRows, tracksData, direction) {
  gradientRows.forEach(row => {
    row.T1 = calculateGradientT1(row, tracksData, direction)
    row.T2 = calculateGradientT2(row, tracksData, direction)
    row.Track2 = calculateGradientTrack2(row)
    row.KP_correction = calculateGradientKPCorrection(row, tracksData, direction)
    row.Distance = calculateGradientDistance(row, direction)
    row.Slope_permille = calculateGradientSlopePermille(row)
  })
}

export default {
  calculateGradientT1,
  calculateGradientT2,
  calculateGradientTrack2,
  calculateGradientKPCorrection,
  calculateGradientDistance,
  calculateGradientSlopePermille,
  updateAllGradientFields
} 