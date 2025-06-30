/**
 * PSR工作表相关计算函数
 */

/**
 * 计算PSR表中T1字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateT1(row, tracksData, direction) {
  // 实现Excel公式: =@IF($E4="","",IF(@INDEX(Tracks!C:C,MATCH($E4,Tracks!C:C,dir))=$E4,INDEX(Tracks!B:B,MATCH($E4,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($E4,Tracks!C:C,dir)+1)))
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

  // 查找匹配的索引 - 使用KP_before_jump字段匹配
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return ''
  }

  // 检查找到的KP是否与输入的KP完全相等
  const matchedKP = Number(tracksData[matchIndex].KP_before_jump) || 0

  if (matchedKP === numericKP) {
    // 完全匹配，返回当前行的Track_ID_before_jump
    return tracksData[matchIndex].Track_ID_before_jump
  } else {
    // 不完全匹配，返回下一行的Track_ID_before_jump
    const nextIndex = matchIndex + 1
    if (nextIndex < tracksData.length) {
      return tracksData[nextIndex].Track_ID_before_jump
    } else {
      return tracksData[matchIndex].Track_ID_before_jump
    }
  }
}

/**
 * 计算PSR表中T2字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateT2(row, tracksData, direction) {
  // 实现Excel公式: =@IF($E4="","",INDEX(Tracks!E:E,MATCH($E4,Tracks!D:D,dir)))
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

  // 查找匹配的索引 - 使用KP_after_jump字段匹配
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return ''
  }

  // 返回对应行的Track_ID_after_jump值
  return tracksData[matchIndex].Track_ID_after_jump
}

/**
 * 计算PSR表中Track2字段的值
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
 * 计算PSR表中KP_correction字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateKPCorrection(row, tracksData, direction) {
  // 实现Excel公式: =@IF(E4="","",IF(@INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir))=G4,INDEX(Tracks!G:G,MATCH(E4,Tracks!D:D,dir)),IF(@INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)+1)=G4,INDEX(Tracks!G:G,MATCH(E4,Tracks!D:D,dir)+1),IF(@INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)-1)=G4,INDEX(Tracks!G:G,MATCH(E4,Tracks!D:D,dir)-1),NA()))))
  const kpValue = row.KP
  const track2Value = row.Track2 || '' // 确保track2Value不为null或undefined

  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  // 查找匹配的索引 - 使用KP_after_jump字段匹配
  const numericKP = Number(kpValue)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return '#N/A'
  }

  // 确保字符串比较一致性（去除空格并转为字符串）
  const normalizedTrack2 = String(track2Value).trim()

  // 第一种情况: 检查当前行的Track_ID_after_jump是否等于Track2
  const trackIdAfterJump = String(tracksData[matchIndex].Track_ID_after_jump || '').trim()
  if (trackIdAfterJump === normalizedTrack2) {
    return tracksData[matchIndex].Correction_applied_to_KP
  }

  // 第二种情况: 检查下一行的Track_ID_after_jump是否等于Track2
  if (matchIndex + 1 < tracksData.length) {
    const nextTrackId = String(tracksData[matchIndex + 1].Track_ID_after_jump || '').trim()
    if (nextTrackId === normalizedTrack2) {
      return tracksData[matchIndex + 1].Correction_applied_to_KP
    }
  }

  // 第三种情况: 检查上一行的Track_ID_after_jump是否等于Track2
  if (matchIndex - 1 >= 0) {
    const prevTrackId = String(tracksData[matchIndex - 1].Track_ID_after_jump || '').trim()
    if (prevTrackId === normalizedTrack2) {
      return tracksData[matchIndex - 1].Correction_applied_to_KP
    }
  }

  // 如果都不匹配，返回NA()
  return '#N/A'
}

/**
 * 计算PSR表中Distance字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向参数
 * @returns {Number|String} 计算结果
 */
export function calculateDistance(row, direction) {
  // 实现Excel公式: =IF(ISTEXT(E4),-100000,IF(E4="",MAX(100000,I4+1),(E4+H4)*dir))
  const kpValue = row.KP
  const kpCorrection = row.KP_correction

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  // 检查KP是否为文本（非数值）
  const numericKP = Number(kpValue)
  if (isNaN(numericKP) && kpValue !== '' && kpValue !== undefined) {
    return -100000 // KP为文本时返回-100000
  }

  // KP为空的情况
  if (kpValue === '' || kpValue === undefined) {
    // 使用I4+1（这里I4是KP_correction）
    const correctionValue = Number(kpCorrection) || 0
    return Math.max(100000, correctionValue + 1)
  }

  // 如果KP_correction为#N/A，返回NA()
  if (kpCorrection === '#N/A') {
    return '#N/A'
  }

  // 标准情况: (KP + KP_correction) * direction
  let correctionValue = 0
  if (kpCorrection !== '' && kpCorrection !== undefined && kpCorrection !== '#N/A') {
    correctionValue = Number(kpCorrection) || 0
  }

  return (numericKP + correctionValue) * dir
}

/**
 * 计算PSR表中PSR_ms字段的值
 * @param {Object} row 当前行数据
 * @returns {Number|String} 计算结果，PSR值从km/h转换为m/s
 */
export function calculatePSRMs(row) {
  const psrValue = row.PSR

  // 如果PSR为空，返回空
  if (psrValue === '' || psrValue === undefined) {
    return ''
  }

  // 计算公式: PSR(km/h) / 3.6 转换为 m/s
  const numericPSR = Number(psrValue) || 0
  return numericPSR / 3.6
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
 * 初始化PSR表所有计算字段
 * @param {Array} psrData PSR表数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 */
export function initializePSRCalculations(psrData, tracksData, direction) {
  if (!psrData || !Array.isArray(psrData) || psrData.length === 0) {
    return
  }

  for (let i = 0; i < psrData.length; i++) {
    const row = psrData[i]

    // 按顺序计算，保证依赖关系
    row.T1 = calculateT1(row, tracksData, direction)
    row.T2 = calculateT2(row, tracksData, direction)
    row.Track2 = calculateTrack2(row)
    row.KP_correction = calculateKPCorrection(row, tracksData, direction)
    row.Distance = calculateDistance(row, direction)
    row.PSR_ms = calculatePSRMs(row)
  }
}
