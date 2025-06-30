/**
 * 轨道模块通用工具函数
 */

/**
 * 防抖函数 - 在一连串调用结束后才执行函数
 * @param {Function} fn 要防抖的函数
 * @param {Number} delay 延迟时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数 - 在一定时间内只执行一次函数
 * @param {Function} fn 要节流的函数
 * @param {Number} interval 间隔时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function(...args) {
    const nowTime = Date.now()
    if (nowTime - lastTime > interval) {
      fn.apply(this, args)
      lastTime = nowTime
    }
  }
}

/**
 * 深拷贝对象
 * @param {Object|Array} obj 要拷贝的对象或数组
 * @returns {Object|Array} 拷贝后的新对象或数组
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 处理Date对象
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  // 处理Array对象
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }

  // 处理普通对象
  const clonedObj = {}
  Object.keys(obj).forEach(key => {
    clonedObj[key] = deepClone(obj[key])
  })

  return clonedObj
}

/**
 * 格式化数字，保留指定小数位
 * @param {Number|String} num 要格式化的数字
 * @param {Number} digits 小数位数
 * @param {Boolean} keepZero 是否保留末尾的0
 * @returns {String} 格式化后的数字字符串
 */
export function formatNumber(num, digits = 2, keepZero = true) {
  if (num === '' || num === undefined || num === null) {
    return ''
  }

  const numValue = Number(num)
  if (isNaN(numValue)) {
    return num.toString()
  }

  if (keepZero) {
    return numValue.toFixed(digits)
  } else {
    // 不保留末尾的0
    return Number(numValue.toFixed(digits)).toString()
  }
}

/**
 * 判断两个数值是否相等（考虑浮点数精度问题）
 * @param {Number} a 第一个数值
 * @param {Number} b 第二个数值
 * @param {Number} epsilon 误差范围
 * @returns {Boolean} 是否相等
 */
export function isEqual(a, b, epsilon = 0.00001) {
  return Math.abs(a - b) < epsilon
}

/**
 * 将字符串转换为数字，如果无法转换则返回默认值
 * @param {String|Number} value 要转换的值
 * @param {Number} defaultValue 默认值
 * @returns {Number} 转换后的数字
 */
export function toNumber(value, defaultValue = 0) {
  if (value === '' || value === undefined || value === null) {
    return defaultValue
  }

  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 计算数组中数值的平均值
 * @param {Array<Number>} values 数值数组
 * @returns {Number} 平均值
 */
export function average(values) {
  if (!values || values.length === 0) {
    return 0
  }

  const sum = values.reduce((total, val) => total + toNumber(val, 0), 0)
  return sum / values.length
}

/**
 * 限制数值在指定范围内
 * @param {Number} value 要限制的值
 * @param {Number} min 最小值
 * @param {Number} max 最大值
 * @returns {Number} 限制后的值
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * 线性插值
 * @param {Number} a 起始值
 * @param {Number} b 结束值
 * @param {Number} t 插值参数 (0-1)
 * @returns {Number} 插值结果
 */
export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1)
}

/**
 * 根据键值对数组生成唯一ID
 * @param {Object} obj 对象
 * @param {Array<String>} keys 要包含的键数组
 * @returns {String} 生成的唯一ID
 */
export function generateUniqueId(obj, keys = []) {
  if (!obj) return 'undefined'

  // 如果没有指定键，则使用对象的所有键
  const keysToUse = keys.length > 0 ? keys : Object.keys(obj)

  return keysToUse.map(key => {
    const value = obj[key]
    if (value === undefined || value === null) {
      return 'null'
    }
    return value.toString()
  }).join('_')
}

/**
 * 检查对象是否为空
 * @param {Object} obj 要检查的对象
 * @returns {Boolean} 是否为空对象
 */
export function isEmptyObject(obj) {
  return obj !== null && typeof obj === 'object' && Object.keys(obj).length === 0
}

/**
 * 将数组按照指定属性值分组
 * @param {Array} array 要分组的数组
 * @param {String|Function} key 分组依据的属性名或函数
 * @returns {Object} 分组后的对象
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const keyValue = typeof key === 'function' ? key(item) : item[key]
    if (!result[keyValue]) {
      result[keyValue] = []
    }
    result[keyValue].push(item)
    return result
  }, {})
}

export default {
  debounce,
  throttle,
  deepClone,
  formatNumber,
  isEqual,
  toNumber,
  average,
  clamp,
  lerp,
  generateUniqueId,
  isEmptyObject,
  groupBy
}
