/**
 * 计算Block description工作表的所有计算字段
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {Object} 包含所有计算字段的对象
 */
export function calculateBlockDescriptionFields(row, tracksData, direction = 1) {
  if (!row) {
    return {}
  }

  const result = {}

  // 计算T1值
  result.T1 = calculateBlockT1(row, tracksData, direction)
  
  // 计算T2值
  result.T2 = calculateBlockT2(row, tracksData, direction)
  
  // 计算Track2值
  result.Track2 = calculateBlockTrack2(row)
  
  // 计算KP_correction值
  result.KP_correction = calculateBlockKPCorrection(row, tracksData)
  
  // 计算SubBlock_StartDistance值
  result.SubBlock_StartDistance = calculateBlockStartDistance(row, direction)
  
  return result
}

/**
 * 计算Block description表的T1值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {String} T1计算结果
 */
function calculateBlockT1(row, tracksData, direction = 1) {
  if (!row || !row.SubBlock_Start || !tracksData || tracksData.length === 0) {
    return ''
  }

  const kpValue = Number(row.SubBlock_Start) || 0
  
  // 找到KP值最接近且小于当前KP值的轨道记录
  let closestTrack = null
  for (let i = 0; i < tracksData.length; i++) {
    const track = tracksData[i]
    const trackKP = Number(track.KP_after_jump) || 0
    
    if (trackKP <= kpValue && (!closestTrack || trackKP > (Number(closestTrack.KP_after_jump) || 0))) {
      closestTrack = track
    }
  }
  
  return closestTrack ? closestTrack.Track_ID_after_jump || '' : ''
}

/**
 * 计算Block description表的T2值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {String} T2计算结果
 */
function calculateBlockT2(row, tracksData, direction = 1) {
  if (!row || !row.SubBlock_End || !tracksData || tracksData.length === 0) {
    return ''
  }

  const kpValue = Number(row.SubBlock_End) || 0
  
  // 找到KP值最接近且大于当前KP值的轨道记录
  let closestTrack = null
  for (let i = 0; i < tracksData.length; i++) {
    const track = tracksData[i]
    const trackKP = Number(track.KP_before_jump) || 0
    
    if (trackKP >= kpValue && (!closestTrack || trackKP < (Number(closestTrack.KP_before_jump) || 0))) {
      closestTrack = track
    }
  }
  
  return closestTrack ? closestTrack.Track_ID_before_jump || '' : ''
}

/**
 * 计算Block description表的Track2值
 * @param {Object} row 当前行数据
 * @returns {String} Track2计算结果
 */
function calculateBlockTrack2(row) {
  if (!row) {
    return ''
  }

  // 如果T1和T2相同，则Track2的值也与SubBlock_Track相同
  // 否则为空
  if (row.T1 === row.T2 && row.T1 !== '') {
    return row.SubBlock_Track || ''
  }
  
  return ''
}

/**
 * 计算Block description表的KP_correction值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @returns {Number|String} KP_correction计算结果
 */
function calculateBlockKPCorrection(row, tracksData) {
  if (!row || !row.T1 || !tracksData || tracksData.length === 0) {
    return ''
  }

  // 查找对应的轨道记录，获取Correction值
  for (let i = 0; i < tracksData.length; i++) {
    const track = tracksData[i]
    if (track.Track_ID_after_jump === row.T1) {
      return track.Correction_applied_to_KP || 0
    }
  }
  
  return 0
}

/**
 * 计算Block description表的SubBlock_StartDistance值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {Number|String} SubBlock_StartDistance计算结果
 */
function calculateBlockStartDistance(row, direction = 1) {
  if (!row || !row.SubBlock_Start || row.KP_correction === undefined || row.KP_correction === '') {
    return ''
  }

  const kpValue = Number(row.SubBlock_Start) || 0
  const kpCorrection = Number(row.KP_correction) || 0
  
  // 计算公式: direction * (SubBlock_Start + KP_correction)
  return direction * (kpValue + kpCorrection)
}

/**
 * Block Description工作表相关计算函数
 */

/**
 * 计算Block Description表中Start_T1字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateStartT1(row, tracksData, direction) {
  const kpValue = row.Start_KP
  
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
    // 完全匹配，返回当前行的Track_ID_before_jump
    return matchedRow.Track_ID_before_jump
  } else {
    // 不完全匹配，尝试返回下一行的Track_ID_before_jump
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
 * 计算Block Description表中End_T1字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateEndT1(row, tracksData, direction) {
  const kpValue = row.End_KP
  
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
    // 完全匹配，返回当前行的Track_ID_before_jump
    return matchedRow.Track_ID_before_jump
  } else {
    // 不完全匹配，尝试返回下一行的Track_ID_before_jump
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
 * 计算Block Description表中Start_KP_correction字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateStartKPCorrection(row, tracksData, direction) {
  const kpValue = row.Start_KP
  const t1Value = row.Start_T1
  
  // 如果KP为空或T1为空，返回空
  if (kpValue === '' || kpValue === undefined || t1Value === '' || t1Value === undefined) {
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
  
  // 查找与T1值匹配的轨道
  for (let i = 0; i < tracksData.length; i++) {
    if (tracksData[i].Track_ID_before_jump === t1Value) {
      return tracksData[i].Correction_applied_to_KP
    }
  }
  
  return '#N/A'
}

/**
 * 计算Block Description表中End_KP_correction字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateEndKPCorrection(row, tracksData, direction) {
  const kpValue = row.End_KP
  const t1Value = row.End_T1
  
  // 如果KP为空或T1为空，返回空
  if (kpValue === '' || kpValue === undefined || t1Value === '' || t1Value === undefined) {
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
  
  // 查找与T1值匹配的轨道
  for (let i = 0; i < tracksData.length; i++) {
    if (tracksData[i].Track_ID_before_jump === t1Value) {
      return tracksData[i].Correction_applied_to_KP
    }
  }
  
  return '#N/A'
}

/**
 * 计算Block Description表中Start_Distance字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向参数
 * @returns {Number|String} 计算结果
 */
export function calculateStartDistance(row, direction) {
  const kpValue = row.Start_KP
  const kpCorrection = row.Start_KP_correction
  
  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }
  
  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1
  
  // 如果KP_correction为#N/A，结果也应该是#N/A
  if (kpCorrection === '#N/A') {
    return '#N/A'
  }
  
  // 计算公式: (KP + KP_correction) * direction
  const numericKP = Number(kpValue) || 0
  
  // 处理KP_correction
  let correctionValue = 0
  if (kpCorrection !== '' && kpCorrection !== undefined && kpCorrection !== '#N/A') {
    correctionValue = Number(kpCorrection) || 0
  }
  
  return (numericKP + correctionValue) * dir
}

/**
 * 计算Block Description表中End_Distance字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向参数
 * @returns {Number|String} 计算结果
 */
export function calculateEndDistance(row, direction) {
  const kpValue = row.End_KP
  const kpCorrection = row.End_KP_correction
  
  // 如果KP为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }
  
  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1
  
  // 如果KP_correction为#N/A，结果也应该是#N/A
  if (kpCorrection === '#N/A') {
    return '#N/A'
  }
  
  // 计算公式: (KP + KP_correction) * direction
  const numericKP = Number(kpValue) || 0
  
  // 处理KP_correction
  let correctionValue = 0
  if (kpCorrection !== '' && kpCorrection !== undefined && kpCorrection !== '#N/A') {
    correctionValue = Number(kpCorrection) || 0
  }
  
  return (numericKP + correctionValue) * dir
}

/**
 * 计算Block Description表中Length字段的值
 * @param {Object} row 当前行数据
 * @returns {Number|String} 计算结果
 */
export function calculateLength(row) {
  const startDistance = row.Start_Distance
  const endDistance = row.End_Distance
  
  // 如果Start_Distance或End_Distance为空或#N/A，返回空
  if (startDistance === '' || startDistance === undefined || startDistance === '#N/A' ||
      endDistance === '' || endDistance === undefined || endDistance === '#N/A') {
    return ''
  }
  
  // 计算公式: End_Distance - Start_Distance
  const numericStartDistance = Number(startDistance) || 0
  const numericEndDistance = Number(endDistance) || 0
  
  return Math.abs(numericEndDistance - numericStartDistance)
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
 * 初始化Block Description表所有计算字段
 * @param {Array} blockDescriptionData Block Description表数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 */
export function initializeBlockDescriptionCalculations(blockDescriptionData, tracksData, direction) {
  if (!blockDescriptionData || !Array.isArray(blockDescriptionData) || blockDescriptionData.length === 0) {
    return
  }
  
  for (let i = 0; i < blockDescriptionData.length; i++) {
    const row = blockDescriptionData[i]
    
    // 按顺序计算，保证依赖关系
    row.Start_T1 = calculateStartT1(row, tracksData, direction)
    row.End_T1 = calculateEndT1(row, tracksData, direction)
    row.Start_KP_correction = calculateStartKPCorrection(row, tracksData, direction)
    row.End_KP_correction = calculateEndKPCorrection(row, tracksData, direction)
    row.Start_Distance = calculateStartDistance(row, direction)
    row.End_Distance = calculateEndDistance(row, direction)
    row.Length = calculateLength(row)
  }
} 