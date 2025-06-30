/**
 * 计算车站表的T1值（按照Excel公式逻辑实现）
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {String} T1计算结果
 */
export function calculateT1(row, tracksData, direction = 1) {
  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  const kpOfPlatform = row.KP_of_platform_center
  const kpOfSSP = row.KP_of_SSP
  const dir = Number(direction) || 1

  // 实现公式：=@IF($E4="",IF($G4="","",IF(@INDEX(Tracks!C:C,MATCH($G4,Tracks!C:C,dir))=$G4,INDEX(Tracks!B:B,MATCH($G4,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($G4,Tracks!C:C,dir)+1))),IF(@INDEX(Tracks!C:C,MATCH($E4,Tracks!C:C,dir))=$E4,INDEX(Tracks!B:B,MATCH($E4,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($E4,Tracks!C:C,dir)+1)))

  // 外层IF: $E4=""
  if (kpOfPlatform === '' || kpOfPlatform === undefined) {
    // 内层IF: $G4=""
    if (kpOfSSP === '' || kpOfSSP === undefined) {
      return ''
    } else {
      // 使用KP_of_SSP与Tracks表中的KP_after_jump列匹配
      const numericKP = Number(kpOfSSP)
      const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

      if (matchIndex === -1) {
        return ''
      }

      // IF(@INDEX(Tracks!C:C,MATCH($G4,Tracks!C:C,dir))=$G4
      const matchedKP = Number(tracksData[matchIndex].KP_after_jump) || 0
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
  } else {
    // 使用KP_of_platform_center与Tracks表中的KP_after_jump列匹配
    const numericKP = Number(kpOfPlatform)
    const matchIndex = findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

    if (matchIndex === -1) {
      return ''
    }

    // IF(@INDEX(Tracks!C:C,MATCH($E4,Tracks!C:C,dir))=$E4
    const matchedKP = Number(tracksData[matchIndex].KP_after_jump) || 0
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
}

/**
 * 计算车站表的T2值（按照Excel公式逻辑实现）
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {String} T2计算结果
 */
export function calculateT2(row, tracksData, direction = 1) {
  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  const kpOfPlatform = row.KP_of_platform_center
  const kpOfSSP = row.KP_of_SSP
  const dir = Number(direction) || 1

  // 实现公式：=@IF($E4="",IF($G4="","",INDEX(Tracks!E:E,MATCH($G4,Tracks!D:D,dir))),INDEX(Tracks!E:E,MATCH($E4,Tracks!D:D,dir)))

  // 外层IF: $E4=""
  if (kpOfPlatform === '' || kpOfPlatform === undefined) {
    // 内层IF: $G4=""
    if (kpOfSSP === '' || kpOfSSP === undefined) {
      return ''
    } else {
      // 使用KP_of_SSP与Tracks表中的KP_before_jump列匹配
      const numericKP = Number(kpOfSSP)
      const matchIndex = findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)

      if (matchIndex === -1) {
        return ''
      }

      // 返回对应行的Track_ID_after_jump
      return tracksData[matchIndex].Track_ID_after_jump
    }
  } else {
    // 使用KP_of_platform_center与Tracks表中的KP_before_jump列匹配
    const numericKP = Number(kpOfPlatform)
    const matchIndex = findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)

    if (matchIndex === -1) {
      return ''
    }

    // 返回对应行的Track_ID_after_jump
    return tracksData[matchIndex].Track_ID_after_jump
  }
}

/**
 * 计算车站表的Track2值
 * @param {Object} row 当前行数据
 * @returns {String} Track2计算结果
 */
export function calculateStationsTrack2(row) {
  if (!row) {
    return ''
  }

  // 如果T1和T2相同，则Track2的值也与Track1相同
  // 否则为空
  if (row.T1 === row.T2 && row.T1 !== '') {
    return row.Track1 || ''
  }

  return ''
}

/**
 * 计算车站表的KP_correction值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @returns {Number|String} KP_correction计算结果
 */
export function calculateStationsKPCorrection(row, tracksData) {
  if (!row || !row.T2 || !row.Track2 || !tracksData || tracksData.length === 0) {
    return ''
  }

  // 查找对应的轨道记录，获取Correction值
  for (let i = 0; i < tracksData.length; i++) {
    const track = tracksData[i]
    if (track.Track_ID_after_jump === row.T2) {
      return track.Correction_applied_to_KP || 0
    }
  }

  return 0
}

/**
 * 计算车站表的Distance_of_PF_center值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {Number|String} Distance_of_PF_center计算结果
 */
export function calculateStationsDistanceOfPFCenter(row, direction = 1) {
  if (!row || !row.KP_of_platform_center || row.KP_correction === undefined || row.KP_correction === '') {
    return ''
  }

  const kpValue = Number(row.KP_of_platform_center) || 0
  const kpCorrection = Number(row.KP_correction) || 0

  // 计算公式: direction * (KP_of_platform_center + KP_correction)
  return direction * (kpValue + kpCorrection)
}

/**
 * 计算车站表的Distance_of_SSP值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @returns {Number|String} Distance_of_SSP计算结果
 */
export function calculateStationsDistanceOfSSP(row, direction = 1) {
  if (!row || !row.KP_of_SSP || row.KP_correction === undefined || row.KP_correction === '') {
    return ''
  }

  const kpValue = Number(row.KP_of_SSP) || 0
  const kpCorrection = Number(row.KP_correction) || 0

  // 计算公式: direction * (KP_of_SSP + KP_correction)
  return direction * (kpValue + kpCorrection)
}

/**
 * Stations工作表相关计算函数
 */

/**
 * 计算Stations表中KP_of_SSP字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向值
 * @param {Number} trainLength 列车长度
 * @returns {Number|String} 计算结果
 */
export function calculateKPOfSSP(row, direction = 1, trainLength = 0) {
  // 实现公式: =IF(E4="","",E4+dir*L_train/2)
  const kpValue = row.KP_of_platform_center

  // 如果KP_of_platform_center为空，返回空
  if (kpValue === '' || kpValue === undefined) {
    return ''
  }

  // 确保direction和trainLength是数字
  const dir = Number(direction) || 1
  const train = Number(trainLength) || 0

  // 计算公式: KP_of_platform_center + dir * trainLength / 2
  const numericKP = Number(kpValue) || 0

  return numericKP + dir * train / 2
}

/**
 * 计算Stations表中Track1字段的值
 * @param {Object} row 当前行数据
 * @returns {String} 计算结果
 */
export function calculateTrack1(row) {
  // 如果T1和Station_track相同，则使用Station_track值，否则返回空
  const t1Value = row.T1
  const stationTrackValue = row.Station_track

  if (t1Value === stationTrackValue) {
    return stationTrackValue
  }

  return ''
}

/**
 * 计算Stations表中Track2字段的值
 * @param {Object} row 当前行数据
 * @returns {String} 计算结果
 */
export function calculateTrack2(row) {
  if (!row) {
    return ''
  }

  const track1Value = row.Track1
  const t1Value = row.T1
  const t2Value = row.T2

  // 应用公式: =IF(AND(D4="",B4=C4),B4,IF(D4="","",D4))
  // 其中D4=Track1, B4=T1, C4=T2
  if (track1Value === '' || track1Value === undefined) {
    // Track1为空的情况
    if (t1Value === t2Value) {
      // 如果T1等于T2，则Track2等于T1
      return t1Value
    } else {
      // 如果T1不等于T2，则Track2为空
      return ''
    }
  } else {
    // Track1不为空，则Track2等于Track1
    return track1Value
  }
}

/**
 * 计算Stations表中KP_correction字段的值
 * @param {Object} row 当前行数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向参数
 * @returns {String} 计算结果
 */
export function calculateKPCorrection(row, tracksData, direction) {
  const kpOfSSP = row.KP_of_SSP
  const track2Value = row.Track2 || '' // 确保track2Value不为null或undefined

  // 如果KP_of_SSP为空，返回空
  if (kpOfSSP === '' || kpOfSSP === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  if (!tracksData || !Array.isArray(tracksData) || tracksData.length === 0) {
    return ''
  }

  // 查找匹配的索引
  const numericSSP = Number(kpOfSSP)
  const matchIndex = findMatchIndexInTracks('KP_after_jump', numericSSP, tracksData, dir)

  // 如果没找到匹配项
  if (matchIndex === -1) {
    return '#N/A'
  }

  // 如果Track2为空，返回N/A
  if (!track2Value) {
    return '#N/A'
  }

  // 确保字符串比较一致性（去除空格）
  const normalizedTrack2 = String(track2Value).trim()

  // 检查matchIndex行的Track_ID_after_jump是否等于Track2
  const trackIdAfterJump = String(tracksData[matchIndex].Track_ID_after_jump || '').trim()
  if (trackIdAfterJump === normalizedTrack2) {
    // 返回该行的Correction_applied_to_KP值
    return tracksData[matchIndex].Correction_applied_to_KP
  }

  // 检查matchIndex+1行的Track_ID_after_jump是否等于Track2
  if (matchIndex + 1 < tracksData.length) {
    const nextTrackId = String(tracksData[matchIndex + 1].Track_ID_after_jump || '').trim()
    if (nextTrackId === normalizedTrack2) {
      // 返回下一行的Correction_applied_to_KP值
      return tracksData[matchIndex + 1].Correction_applied_to_KP
    }
  }

  // 检查matchIndex-1行的Track_ID_after_jump是否等于Track2
  if (matchIndex - 1 >= 0) {
    const prevTrackId = String(tracksData[matchIndex - 1].Track_ID_after_jump || '').trim()
    if (prevTrackId === normalizedTrack2) {
      // 返回上一行的Correction_applied_to_KP值
      return tracksData[matchIndex - 1].Correction_applied_to_KP
    }
  }

  // 如果都不匹配，返回N/A
  return '#N/A'
}

/**
 * 计算Stations表中Distance_of_PF_center字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向参数
 * @returns {Number|String} 计算结果
 */
export function calculateDistanceOfPFCenter(row, direction) {
  const kpOfPlatform = row.KP_of_platform_center
  const kpCorrection = row.KP_correction

  // 如果KP_of_platform_center为空，返回空
  if (kpOfPlatform === '' || kpOfPlatform === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  // 如果KP_correction为#N/A，结果也应该是#N/A
  if (kpCorrection === '#N/A') {
    return '#N/A'
  }

  // 计算公式: (KP_of_platform_center + KP_correction) * direction
  const numericKP = Number(kpOfPlatform) || 0

  // 处理KP_correction
  let correctionValue = 0
  if (kpCorrection !== '' && kpCorrection !== undefined && kpCorrection !== '#N/A') {
    correctionValue = Number(kpCorrection) || 0
  }

  return (numericKP + correctionValue) * dir
}

/**
 * 计算Stations表中Distance_of_SSP字段的值
 * @param {Object} row 当前行数据
 * @param {Number} direction 方向参数
 * @returns {Number|String} 计算结果
 */
export function calculateDistanceOfSSP(row, direction) {
  const kpOfSSP = row.KP_of_SSP
  const kpCorrection = row.KP_correction

  // 如果KP_of_SSP为空，返回空
  if (kpOfSSP === '' || kpOfSSP === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1

  // 如果KP_correction为#N/A，结果也应该是#N/A
  if (kpCorrection === '#N/A') {
    return '#N/A'
  }

  // 计算公式: (KP_of_SSP + KP_correction) * direction
  const numericKPOfSSP = Number(kpOfSSP) || 0

  // 处理KP_correction
  let correctionValue = 0
  if (kpCorrection !== '' && kpCorrection !== undefined && kpCorrection !== '#N/A') {
    correctionValue = Number(kpCorrection) || 0
  }

  return (numericKPOfSSP + correctionValue) * dir
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
 * 初始化Stations表的所有计算字段
 * @param {Array} stationsData Stations表数据
 * @param {Array} tracksData Tracks表数据
 * @param {Number} direction 方向值（0:上行, 1:下行）
 * @param {Number} trainLength 列车长度
 */
export function initializeStationsCalculations(stationsData, tracksData, direction = 1, trainLength = 0) {
  if (!stationsData || !Array.isArray(stationsData) || !tracksData || !Array.isArray(tracksData)) {
    return
  }

  // 确保direction和trainLength是数字
  const dir = Number(direction) || 1
  const train = Number(trainLength) || 0

  for (let i = 0; i < stationsData.length; i++) {
    const row = stationsData[i]

    // 先计算KP_of_SSP，因为T2依赖它
    if (!row.KP_of_SSP || row.KP_of_SSP === '') {
      row.KP_of_SSP = calculateKPOfSSP(row, dir, train)
    }

    // 计算T1和T2
    row.T1 = calculateT1(row, tracksData, dir)
    row.T2 = calculateT2(row, tracksData, dir)

    // Track1是用户手动输入的，不需要计算
    // 计算Track2
    row.Track2 = calculateTrack2(row)

    // 计算KP_correction
    row.KP_correction = calculateKPCorrection(row, tracksData, dir)

    // 计算Distances
    row.Distance_of_PF_center = calculateDistanceOfPFCenter(row, dir)
    row.Distance_of_SSP = calculateDistanceOfSSP(row, dir)
  }
}
