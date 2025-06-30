/**
 * 文件处理模块
 * 用于处理文件加载、保存等操作
 */

/**
 * 工作表名称映射
 * 用于新旧工作表名称的转换
 */
export const sheetNameMapping = {
  // 新名称到旧名称的映射
  '总体参数(Gen. Param.)': 'Gen. Param.',
  '长短链(Tracks)': 'Tracks',
  '坡度(Gradient)': 'Gradient',
  '车站(Stations)': 'Stations',
  '线路限速(PSR)': 'PSR',
  '分相区(Unbridgeable gap)': 'Unbridgeable gap',
  '轨道区段(Block description)': 'Block description',

  // 旧名称到新名称的映射（反向映射）
  'Gen. Param.': '总体参数(Gen. Param.)',
  'Tracks': '长短链(Tracks)',
  'Gradient': '坡度(Gradient)',
  'Stations': '车站(Stations)',
  'PSR': '线路限速(PSR)',
  'Unbridgeable gap': '分相区(Unbridgeable gap)',
  'Block description': '轨道区段(Block description)'
}

/**
 * 获取工作表的内部名称（用于数据存储）
 * @param {string} displayName 显示名称
 * @returns {string} 内部名称
 */
export function getInternalSheetName(displayName) {
  return sheetNameMapping[displayName] || displayName
}

/**
 * 获取工作表的显示名称
 * @param {string} internalName 内部名称
 * @returns {string} 显示名称
 */
export function getDisplaySheetName(internalName) {
  // 查找内部名称对应的显示名称
  for (const [displayName, internal] of Object.entries(sheetNameMapping)) {
    if (internal === internalName) {
      return displayName
    }
  }
  return internalName
}

/**
 * 创建默认工作表结构
 * @returns {Object} 默认工作表结构
 */
export function createDefaultSheets() {
  // 使用旧的键名来保持内部数据结构兼容性
  return {
    'Gen. Param.': {
      headers: [
        { prop: 'paramName', label: 'Parameter Name' },
        { prop: 'value', label: 'Value' },
        { prop: 'description', label: 'Description' }
      ],
      data: [
        { paramName: 'Direction', value: '1', description: '1: Increasing KP, -1: Decreasing KP' },
        { paramName: 'Line Speed', value: '350', description: 'km/h' },
        { paramName: 'Max PSR', value: '350', description: 'km/h' }
      ]
    },
    'Tracks': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'Track_ID_before_jump', label: 'Track ID before jump' },
        { prop: 'KP_before_jump', label: 'KP before jump (m)' },
        { prop: 'Track_ID_after_jump', label: 'Track ID after jump' },
        { prop: 'KP_after_jump', label: 'KP after jump (m)' },
        { prop: 'Jump_length', label: 'Jump length (m)' },
        { prop: 'Correction_applied_to_KP', label: 'Correction applied to KP (m)' },
        { prop: 'Distance_from_track_origin_to_jump_point', label: 'Distance from track origin to jump point (m)' }
      ],
      data: []
    },
    'Gradient': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'T1', label: 'T1' },
        { prop: 'T2', label: 'T2' },
        { prop: 'Track1', label: 'Track1' },
        { prop: 'KP', label: 'KP' },
        { prop: 'slope', label: 'slope' },
        { prop: 'Track2', label: 'Track2' },
        { prop: 'KP_correction', label: 'KP correction' },
        { prop: 'Distance', label: 'Distance' },
        { prop: 'Slope_permille', label: 'Slope (‰)' }
      ],
      data: []
    },
    'Stations': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'T1', label: 'T1' },
        { prop: 'T2', label: 'T2' },
        { prop: 'Track1', label: 'Track1' },
        { prop: 'KP_of_platform_center', label: 'KP of platform center' },
        { prop: 'Name_of_station', label: 'Name of station' },
        { prop: 'Track2', label: 'Track2' },
        { prop: 'KP_of_SSP', label: 'KP of SSP' },
        { prop: 'KP_correction', label: 'KP correction' },
        { prop: 'Distance_of_PF_center', label: 'Distance of PF center' },
        { prop: 'Distance_of_SSP', label: 'Distance of SSP' }
      ],
      data: []
    },
    'PSR': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'T1', label: 'T1' },
        { prop: 'T2', label: 'T2' },
        { prop: 'Track1', label: 'Track1' },
        { prop: 'KP', label: 'KP' },
        { prop: 'PSR', label: 'PSR' },
        { prop: 'Track2', label: 'Track2' },
        { prop: 'KP_correction', label: 'KP correction' },
        { prop: 'Distance', label: 'Distance' },
        { prop: 'PSR_ms', label: 'PSR (m/s)' }
      ],
      data: []
    },
    'Block description': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'Start_T1', label: 'Start_T1' },
        { prop: 'Start_T2', label: 'Start_T2' },
        { prop: 'Start_Track', label: 'Start_Track' },
        { prop: 'Rule', label: 'Rule' },
        { prop: 'Timer', label: 'Timer' },
        { prop: 'SubBlock_Start', label: 'SubBlock_Start' },
        { prop: 'SubBlock_End', label: 'SubBlock_End' },
        { prop: 'Track2', label: 'Track2' },
        { prop: 'KP_correction', label: 'KP_correction' },
        { prop: 'SubBlock_StartDistance', label: 'SubBlock_StartDistance' },
        { prop: 'SubBlock_Track', label: 'SubBlock_Track' },
        { prop: 'Overlap_Value', label: 'Overlap_Value' },
        { prop: 'Overlap_Track', label: 'Overlap_Track' },
        { prop: 'Overlap_Sens', label: 'Overlap_Sens' }
      ],
      data: []
    },
    'Unbridgeable gap': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'Distance', label: 'Distance (m)' },
        { prop: 'Unbridgable_gap', label: 'Unbridgable gap' }
      ],
      data: []
    }

  }
}

/**
 * 创建Running_profile文件夹下的工作表结构
 * @returns {Object} Running_profile工作表结构
 */
export function createRunningProfileSheets() {
  return {
    'Running list': {
      headers: [
        { prop: 'id', label: 'ID' },
        { prop: 'departureStation', label: 'Departure Station name' },
        { prop: 'departureDistance', label: 'Departure Station Distance' },
        { prop: 'arrivalStation', label: 'Arrival Station name' },
        { prop: 'arrivalDistance', label: 'Arrival Station Distance' },
        { prop: 'track', label: 'Track' },
        { prop: 'train', label: 'Train' },
        { prop: 'trainLoad', label: 'train load [0 1]' },
        { prop: 'stationStopTime', label: 'Station Stop Time' }
      ],
      data: []
    }
  }
}

/**
 * 转换JSON数据为前端所需格式
 * @param {Object} jsonData JSON格式数据
 * @returns {Object} 转换后的前端数据格式
 */
export function transformJSONData(jsonData) {
  const result = {}

  // 特殊处理：如果jsonData是数组而不是对象，说明是Running_profile格式
  if (Array.isArray(jsonData)) {
    result['Running list'] = jsonData.map(item => ({
      departureStation: item[0] || '',
      departureDistance: item[1] || '',
      arrivalStation: item[2] || '',
      arrivalDistance: item[3] || '',
      track: item[4] || '',
      train: item[5] || '',
      trainLoad: item[6] || '',
      stationStopTime: ''
    }))
    return result
  }

  Object.keys(jsonData).forEach(key => {
    if (key === 'Gradient' && Array.isArray(jsonData[key])) {
      result[key] = jsonData[key].map(item => ({
        T1: '',
        T2: '',
        Track1: '',
        KP: item[0],
        slope: item[1],
        Track2: '',
        KP_correction: '',
        Distance: '',
        Slope_permille: ''
      }))
    } else if (key === 'Stations' && Array.isArray(jsonData[key])) {
      // 使用Stations作为前端工作表名，只接受JSON中的Stations键名
      result['Stations'] = jsonData[key].map(item => ({
        T1: '', // 预留空值，以后可添加计算逻辑
        T2: '', // 预留空值，以后可添加计算逻辑
        Track1: '', // 预留空值，以后可添加计算逻辑
        KP_of_platform_center: item[0],
        Name_of_station: item[1],
        KP_of_SSP: item[2],
        Track2: '', // 预留空值，以后可添加计算逻辑
        KP_correction: '', // 预留空值，以后可添加计算逻辑
        Distance_of_PF_center: '', // 预留空值，以后可添加计算逻辑
        Distance_of_SSP: '' // 预留空值，以后可添加计算逻辑
      }))
    } else if (key === 'PSR' && Array.isArray(jsonData[key])) {
      result[key] = jsonData[key].map(item => ({
        T1: '',
        T2: '',
        Track1: '',
        KP: item[0], // 第一个元素对应KP (m)
        PSR: item[1], // 第二个元素对应PSR (km/h)
        Track2: '',
        KP_correction: '',
        Distance: '',
        PSR_ms: ''
      }))
    } else if (key === 'Tracks' && Array.isArray(jsonData[key])) {
      // 根据新的JSON数据顺序调整映射
      result[key] = jsonData[key].map(item => ({
        Track_ID_before_jump: '', // 将在处理阶段计算
        KP_before_jump: item[0], // 第一个元素是KP before jump(m)
        KP_after_jump: item[1], // 第二个元素是KP after jump(m)
        Track_ID_after_jump: item[2], // 第三个元素是Track ID after jump
        Distance_from_track_origin_to_jump_point: '',
        Jump_length: '',
        Correction_applied_to_KP: ''
      }))
    } else if (key === 'Unbridgeable gap' && Array.isArray(jsonData[key])) {
      result[key] = jsonData[key].map(item => ({
        Distance: item[0],
        Unbridgable_gap: item[1]
      }))
    } else if (key === 'Block description' && Array.isArray(jsonData[key])) {
      // 处理Block description数据
      result[key] = jsonData[key].map((item, index) => ({
        id: item[0] !== undefined ? item[0] : '', // 第0位: id
        Start_T1: item[1] !== undefined ? item[1] : '', // 第1位: Start_T1
        Start_T2: item[2] !== undefined ? item[2] : '', // 第2位: Start_T2
        Rule: item[3] !== undefined ? item[3] : '', // 第3位: Rule
        Timer: item[4] !== undefined ? item[4] : '', // 第4位: Timer
        SubBlock_Start: item[5] !== undefined ? item[5] : '', // 第5位: SubBlock > Start
        SubBlock_End: item[6] !== undefined ? item[6] : '', // 第6位: SubBlock > End
        SubBlock_StartDistance: '', // 新字段：SubBlock > Start distance
        SubBlock_Track: item[7] !== undefined ? item[7] : '', // 第7位: SubBlock > Track
        Overlap_Value: item[8] !== undefined ? item[8] : '', // 第8位: overlap > Value
        Overlap_Track: item[9] !== undefined ? item[9] : '', // 第9位: overlap > Track
        Overlap_Sens: item[10] !== undefined ? item[10] : '' // 第10位: overlap > Sens
      }))
    } else if (key === 'Gen. Param.' && Array.isArray(jsonData[key])) {
      result[key] = jsonData[key].map(item => ({
        paramName: item[0],
        value: item[1]
      }))
    } else {
      // 处理其他情况
      result[key] = jsonData[key]
    }
  })

  return result
}

/**
 * 添加自增ID字段到表格数据
 * @param {Array} data 表格数据
 * @param {String} sheetName 工作表名称
 * @returns {Array} 添加ID后的数据
 */
export function addAutoIncrementIds(data, sheetName) {
  if (!data || !Array.isArray(data)) return data

  // 如果是Block description，直接使用自增ID，不从已有数据中获取
  if (sheetName === 'Block description') {
    return data.map((row, index) => ({
      ...row,
      id: index + 1
    }))
  }

  return data.map((row, index) => ({
    ...row,
    id: index + 1
  }))
}

/**
 * 下载Excel文件
 * @param {Object} sheets 工作表数据
 * @param {String} filename 文件名
 * @returns {Promise} 下载结果
 */
export async function downloadExcel(sheets, filename) {
  try {
    const excel = await import('@/vendor/Export2Excel')
    const sheetsData = Object.entries(sheets).map(([name, sheet]) => ({
      name,
      data: [
        sheet.headers.map(h => h.label),
        ...sheet.data.map(row => sheet.headers.map(h => row[h.prop]))
      ]
    }))

    excel.export_json_to_multiple_sheet({
      sheets: sheetsData,
      filename: filename.replace('.xls', ''),
      autoWidth: true,
      bookType: 'xlsx'
    })

    return {
      success: true,
      message: '文件下载成功'
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `文件下载失败: ${error.message || '未知错误'}`
    }
  }
}
