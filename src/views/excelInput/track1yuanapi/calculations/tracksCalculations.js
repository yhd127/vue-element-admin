/**
 * Tracks工作表相关计算函数
 */

/**
 * 计算Jump length
 * @param {Object} row 当前行数据
 * @returns {Number|String} 计算结果或空字符串
 */
export function calculateJumpLength(row) {
  const kpBeforeJump = row.KP_before_jump
  const kpAfterJump = row.KP_after_jump

  if (kpBeforeJump === '' || kpAfterJump === '' ||
      kpBeforeJump === undefined || kpAfterJump === undefined) {
    return ''
  }

  const kpBeforeValue = Number(kpBeforeJump) || 0
  const kpAfterValue = Number(kpAfterJump) || 0
  return kpBeforeValue - kpAfterValue
}

/**
 * 计算从第一行到当前行的Jump length累加值
 * @param {Array} tracks Tracks表的所有数据行
 * @param {Number} currentIndex 当前行索引
 * @returns {Number|String} 计算结果或空字符串
 */
export function calculateCorrectionValue(tracks, currentIndex) {
  // 确保参数有效
  if (!Array.isArray(tracks) || currentIndex < 0 || currentIndex >= tracks.length) {
    return ''
  }

  const row = tracks[currentIndex]
  const jumpLength = row.Jump_length

  if (jumpLength === '' || jumpLength === undefined) {
    return ''
  }

  // 计算从第一行到当前行的所有Jump length的和
  let sum = 0
  for (let j = 0; j <= currentIndex; j++) {
    const jRow = tracks[j]
    const jJumpLength = jRow.Jump_length
    if (jJumpLength !== '' && jJumpLength !== undefined) {
      sum += Number(jJumpLength) || 0
    }
  }
  return sum
}

/**
 * 计算Distance from track origin to jump point
 * @param {Object} row 当前行
 * @param {Number} direction 方向参数值 (0:上行, 1:下行)
 * @returns {Number|String} 计算结果或空字符串
 */
export function calculateDistanceFromOrigin(row, direction) {
  if (!row) return ''

  const kpAfterJump = row.KP_after_jump
  const correction = row.Correction_applied_to_KP

  if (kpAfterJump === '' || kpAfterJump === undefined ||
      correction === '' || correction === undefined) {
    return ''
  }

  // 确保direction是数字，默认值为1
  const dir = Number(direction) || 1
  const kpValue = Number(kpAfterJump) || 0
  const correctionValue = Number(correction) || 0

  return dir * (kpValue + correctionValue)
}

/**
 * 更新下一行的Track_ID_before_jump
 * @param {Array} tracks Tracks表的所有行
 * @param {Number} currentIndex 当前行的索引
 */
export function updateNextRowTrackId(tracks, currentIndex) {
  // 确保参数有效
  if (!Array.isArray(tracks) || currentIndex < 0 || currentIndex >= tracks.length - 1) {
    return
  }

  const currentRow = tracks[currentIndex]
  const nextRow = tracks[currentIndex + 1]

  // 确保两行都有效
  if (!currentRow || !nextRow) return

  const currentValue = currentRow.Track_ID_after_jump

  if (currentValue === '' || currentValue === undefined || currentValue === null) {
    nextRow.Track_ID_before_jump = ''
  } else {
    nextRow.Track_ID_before_jump = currentValue
  }
}

/**
 * 用于新增行后更新后续行的数据
 * @param {Array} tracks Tracks表的所有行
 * @param {Number} startIndex 起始更新的行索引
 */
export function updateRowsAfterInsert(tracks, startIndex) {
  // 确保参数有效
  if (!Array.isArray(tracks) || startIndex < 0 || startIndex >= tracks.length) {
    return
  }

  for (let i = startIndex; i < tracks.length - 1; i++) {
    const currentRow = tracks[i]
    const nextRow = tracks[i + 1]

    if (currentRow && nextRow) {
      const currentValue = currentRow.Track_ID_after_jump

      if (currentValue === '' || currentValue === undefined || currentValue === null) {
        nextRow.Track_ID_before_jump = ''
      } else {
        nextRow.Track_ID_before_jump = currentValue
      }
    }
  }
}

/**
 * 检查Tracks表中单元格是否需要警告样式
 * @param {Object} row 当前行数据
 * @param {String} prop 属性名
 * @returns {Boolean} 是否需要警告样式
 */
export function needsWarningStyle(row, prop) {
  if (!row) return false

  // 检查核心字段是否为空
  const keyCells = ['Track_ID_after_jump', 'KP_before_jump', 'KP_after_jump']
  if (keyCells.includes(prop) && (row[prop] === '' || row[prop] === undefined || row[prop] === null)) {
    return true
  }

  // 对Track_ID_after_jump字段进行特殊检查
  if (prop === 'Track_ID_after_jump') {
    // KP值跳变检查：判断KP_before_jump > KP_after_jump
    const kpBeforeJump = parseFloat(row.KP_before_jump)
    const kpAfterJump = parseFloat(row.KP_after_jump)

    // 检查是否存在KP值跳变
    const hasKpJump = !isNaN(kpBeforeJump) && !isNaN(kpAfterJump) && kpBeforeJump > kpAfterJump

    // 获取Track ID值并转换为字符串
    const beforeJumpID = String(row.Track_ID_before_jump || '').trim()
    const afterJumpID = String(row.Track_ID_after_jump || '').trim()

    // 检查Track ID是否相同
    const isSameTrackID = beforeJumpID === afterJumpID

    // 当KP值跳变且Track ID相同时需要警告
    if (hasKpJump && isSameTrackID) {
      return true
    }
  }

  return false
}
