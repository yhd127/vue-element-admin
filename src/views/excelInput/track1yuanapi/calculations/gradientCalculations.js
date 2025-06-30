/**
 * Gradient工作表相关计算函数
 */

/**
 * 计算Gradient表中T1字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateT1(row, tracksData, direction) {
  const kpValue = row.KP

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  // 查找匹配的索引
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)

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
 * 计算Gradient表中T2字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateT2(row, tracksData, direction) {
  const kpValue = row.KP

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  // 查找匹配的索引
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return ''
  }

  // 获取对应行的Track_ID_after_jump值
  return tracksData[matchIndex].Track_ID_after_jump
}

/**
 * 计算Gradient表中Track2字段的值
 * @param {Object} row 当前行数据
 * @returns {String} 计算结果
 */
export function calculateTrack2(row) {
  const track1Value = row.Track1
  const t1Value = row.T1
  const t2Value = row.T2

  // 应用公式: IF(AND(Track1="",T1=T2),T1,IF(Track1="","",Track1))
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
 * 计算Gradient表中KP_correction字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateKPCorrection(row, tracksData, direction) {
  const kpValue = row.KP
  const track2Value = row.Track2

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  // 查找匹配的索引
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

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
  else if (matchIndex + 1 < tracksData.length && tracksData[matchIndex + 1].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex + 1].Correction_applied_to_KP
  }
  // 第三种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)-1)=G4
  else if (matchIndex - 1 >= 0 && tracksData[matchIndex - 1].Track_ID_after_jump == track2Value) {
    return tracksData[matchIndex - 1].Correction_applied_to_KP
  }
  // 如果都不匹配，返回N/A
  else {
    return '#N/A'
  }
}

/**
 * 计算Gradient表中Distance字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向参数
 * @returns {Number|String} 计算结果
 */
export function calculateDistance(row, direction) {
  const kpValue = row.KP
  const kpCorrection = row.KP_correction

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  // 应用修改后的公式: =IF(KP="",MAX(100000,Distance+1),(KP+KP_correction)*dir))

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
    if (kpCorrection !== '' && kpCorrection !== undefined && kpCorrection !== '#N/A') {
      correctionValue = Number(kpCorrection) || 0
    }

    // 计算(KP + KP_correction) * dir
    return (numericKP + correctionValue) * dir
  }
}

/**
 * 计算Gradient表中Slope_permille字段的值
 * @param {Object} row 当前行数据
 * @returns {Number|String} 计算结果
 */
export function calculateSlopePermille(row) {
  const slopeValue = row.slope

  // 如果slope为空，返回空
  if (slopeValue === '' || slopeValue === undefined) {
    return ''
  }

  // 计算千分比
  const numericSlope = Number(slopeValue) || 0
  return numericSlope * 10
}

/**
 * 在Tracks表中查找匹配的行索引
 * @param {String} fieldName 字段名称 ('KP_before_jump' 或 'KP_after_jump')
 * @param {Number} kpValue 要查找的KP值
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {Number} 匹配的行索引，如果未找到则返回-1
 */
function findMatchIndexInTracks(fieldName, kpValue, tracksData, direction) {
  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0 ||
      kpValue === undefined || kpValue === null) {
    return -1
  }

  let matchIndex = -1
  const dir = Number(direction) || 1

  // 根据dir的值决定查找方式
  if (dir === 1) {
    // dir=1时，假设数据是升序排列，查找小于等于numericValue的最大值
    // 从前向后遍历，保持与Track1.vue相同的实现
    for (let i = 0; i < tracksData.length; i++) {
      const rawValue = tracksData[i][fieldName]

      // 跳过空行或值为空字符串的行
      if (rawValue === '' || rawValue === undefined) {
        continue
      }

      const rowValue = Number(rawValue) || 0
      if (rowValue <= kpValue) {
        matchIndex = i
      } else {
        break // 一旦找到大于kpValue的值就停止
      }
    }
  } else {
    // dir=0时，假设数据是降序排列，查找大于等于numericValue的最小值
    for (let i = 0; i < tracksData.length; i++) {
      const rawValue = tracksData[i][fieldName]

      // 跳过空行或值为空字符串的行
      if (rawValue === '' || rawValue === undefined) {
        continue
      }

      const rowValue = Number(rawValue) || 0
      if (rowValue >= kpValue) {
        matchIndex = i
      } else {
        break // 一旦找到小于kpValue的值就停止
      }
    }
  }

  return matchIndex
}

/**
 * 初始化Gradient表所有计算字段
 * @param {Array} gradientData Gradient表数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 */
export function initializeGradientCalculations(gradientData, tracksData, direction) {
  if (!gradientData || !Array.isArray(gradientData) || gradientData.length === 0) {
    return
  }

  for (let i = 0; i < gradientData.length; i++) {
    const row = gradientData[i]

    // 按顺序计算，保证依赖关系
    row.T1 = calculateT1(row, tracksData, direction)
    row.T2 = calculateT2(row, tracksData, direction)
    row.Track2 = calculateTrack2(row)
    row.KP_correction = calculateKPCorrection(row, tracksData, direction)
    row.Distance = calculateDistance(row, direction)
    row.Slope_permille = calculateSlopePermille(row)
  }
}
