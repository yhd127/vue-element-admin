/**
 * 文件数据导入导出工具
 */
import XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
 * 解析Excel文件中的数据到JSON
 * @param {File} file Excel文件对象
 * @returns {Promise<Object>} 包含解析后的各表数据的对象
 */
export function parseExcelToJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // 创建用于存储所有表数据的对象
        const result = {}

        // 遍历所有工作表
        workbook.SheetNames.forEach(sheetName => {
          // 将每个工作表转换为JSON
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

          // 存储到结果对象
          result[sheetName] = jsonData
        })

        resolve(result)
      } catch (error) {
        reject(new Error('解析Excel文件失败: ' + error.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    // 以二进制格式读取文件
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 将JSON数据导出为Excel文件
 * @param {Object} data 要导出的数据对象，每个键代表一个工作表
 * @param {String} fileName 导出的文件名
 */
export function exportJsonToExcel(data, fileName) {
  try {
    // 创建新的工作簿
    const workbook = XLSX.utils.book_new()

    // 遍历数据对象中的每个表
    Object.keys(data).forEach(sheetName => {
      const sheetData = data[sheetName]

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(sheetData)

      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })

    // 生成Excel文件的二进制数据
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

    // 创建Blob对象
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })

    // 下载文件
    saveAs(blob, `${fileName}.xlsx`)
  } catch (error) {
    console.error('导出Excel文件失败:', error)
    throw new Error('导出Excel文件失败: ' + error.message)
  }
}

/**
 * 解析JSON文件到对象
 * @param {File} file JSON文件对象
 * @returns {Promise<Object>} 解析后的JSON对象
 */
export function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        resolve(jsonData)
      } catch (error) {
        reject(new Error('解析JSON文件失败: ' + error.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    // 以文本格式读取文件
    reader.readAsText(file)
  })
}

/**
 * 导出JSON数据到文件
 * @param {Object|Array} data 要导出的JSON数据
 * @param {String} fileName 导出的文件名
 */
export function exportJsonToFile(data, fileName) {
  try {
    // 将数据转换为JSON字符串，使用2个空格缩进
    const jsonString = JSON.stringify(data, null, 2)

    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' })

    // 下载文件
    saveAs(blob, `${fileName}.json`)
  } catch (error) {
    console.error('导出JSON文件失败:', error)
    throw new Error('导出JSON文件失败: ' + error.message)
  }
}

/**
 * 从本地存储加载数据
 * @param {String} key 存储键名
 * @returns {Object|Array|null} 加载的数据或null
 */
export function loadFromLocalStorage(key) {
  try {
    const storedData = localStorage.getItem(key)
    if (storedData) {
      return JSON.parse(storedData)
    }
    return null
  } catch (error) {
    console.error('从本地存储加载数据失败:', error)
    return null
  }
}

/**
 * 保存数据到本地存储
 * @param {String} key 存储键名
 * @param {Object|Array} data 要保存的数据
 * @returns {Boolean} 是否保存成功
 */
export function saveToLocalStorage(key, data) {
  try {
    const jsonString = JSON.stringify(data)
    localStorage.setItem(key, jsonString)
    return true
  } catch (error) {
    console.error('保存数据到本地存储失败:', error)
    return false
  }
}

/**
 * 获取文件扩展名
 * @param {String} fileName 文件名
 * @returns {String} 文件扩展名
 */
export function getFileExtension(fileName) {
  return fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
}

/**
 * 检查文件类型是否为Excel
 * @param {String} fileName 文件名
 * @returns {Boolean} 是否为Excel文件
 */
export function isExcelFile(fileName) {
  const ext = getFileExtension(fileName)
  return ext === 'xlsx' || ext === 'xls'
}

/**
 * 检查文件类型是否为JSON
 * @param {String} fileName 文件名
 * @returns {Boolean} 是否为JSON文件
 */
export function isJsonFile(fileName) {
  return getFileExtension(fileName) === 'json'
}

export default {
  parseExcelToJson,
  exportJsonToExcel,
  parseJsonFile,
  exportJsonToFile,
  loadFromLocalStorage,
  saveToLocalStorage,
  getFileExtension,
  isExcelFile,
  isJsonFile
}
