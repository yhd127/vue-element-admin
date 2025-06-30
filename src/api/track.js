import axios from 'axios'

// API 基础路径
const apiBaseUrl = '/api'

// 获取 API 请求头
export function getApiHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// 获取认证 Token
export async function getAuthToken() {
  try {
    // FastAPI的OAuth2认证格式
    const formData = new URLSearchParams()
    formData.append('username', 'string') // 用户名
    formData.append('password', 'string') // 密码
    formData.append('grant_type', 'password')

    // 使用代理URL
    const response = await axios({
      method: 'post',
      url: '/api/token', // 使用代理URL
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept': 'application/json'
      },
      timeout: 30000
    })

    if (response.data && response.data.access_token) {
      const token = response.data.access_token
      localStorage.setItem('token', token)
      return {
        success: true,
        token: token,
        message: '获取新token成功'
      }
    }
    throw new Error('获取token失败: 返回数据格式不正确')
  } catch (error) {
    console.error('获取token失败:', error)
    let errorMsg = '未知错误'
    if (error.code === 'ECONNABORTED') {
      errorMsg = '请求超时，服务器响应时间过长'
    } else if (error.response) {
      if (error.response.status === 422) {
        errorMsg = '认证参数错误，请检查用户名和密码'
      } else if (error.response.status === 405) {
        errorMsg = '请求方法不允许，请检查API配置'
      } else {
        errorMsg = `服务器错误(${error.response.status}): ${error.response.data?.detail || '未知错误'}`
      }
    } else if (error.request) {
      errorMsg = '未收到服务器响应，请检查网络连接'
    } else {
      errorMsg = error.message || '未知错误'
    }

    return {
      success: false,
      message: `获取token失败: ${errorMsg}`
    }
  }
}

// 获取固定的备用 Token
export function getFixedToken() {
  const fixedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdHJpbmciLCJleHAiOjE3NDc4MDQ4OTd9._XvxKtaD5vlVUl5u4RkLebkRS6NoQQlkHZNTHyphICg'
  localStorage.setItem('token', fixedToken)
  return fixedToken
}

// 从API获取轨道记录
export async function fetchTrackRecords() {
  try {
    const response = await axios.get(`${apiBaseUrl}/tracks/`, {
      params: { skip: 0, limit: 100 },
      headers: getApiHeaders()
    })

    return {
      success: true,
      data: response.data,
      message: `成功加载了 ${response.data.length} 条轨道记录`
    }
  } catch (error) {
    console.error('API数据加载失败:', error)
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        needReauth: true,
        message: 'token已过期，需要重新认证'
      }
    }
    return {
      success: false,
      message: `API数据加载失败: ${error.message || '未知错误'}`
    }
  }
}

// 保存数据到API
export async function saveTrackToApi(tracksData, direction) {
  try {
    if (!tracksData || !Array.isArray(tracksData)) {
      throw new Error('无效的轨道数据')
    }

    // 准备要保存的数据
    const recordsToSave = tracksData.map(record => {
      if (!record) return null
      return {
        kp_before_jump: Number(record.KP_before_jump) || 0,
        kp_after_jump: Number(record.KP_after_jump) || 0,
        if_after_jump: Number(record.Track_ID_after_jump) || 0,
        direction: Number(direction) || 1
      }
    }).filter(Boolean) // 过滤掉null值

    if (recordsToSave.length === 0) {
      throw new Error('没有有效的轨道数据可保存')
    }

    // 使用axios保存数据
    await axios.post(
      `${apiBaseUrl}/tracks/`,
      recordsToSave,
      {
        headers: getApiHeaders(),
        timeout: 30000
      }
    )

    return {
      success: true,
      message: '数据保存成功'
    }
  } catch (error) {
    console.error('API数据保存失败:', error)
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        needReauth: true,
        message: 'token已过期，需要重新认证'
      }
    }
    return {
      success: false,
      message: `API数据保存失败: ${error.message || '未知错误'}`
    }
  }
}

// 从API删除轨道记录
export async function deleteTrackFromApi(id) {
  if (!id) return { success: false, message: '记录ID无效' }

  try {
    await axios.delete(`${apiBaseUrl}/tracks/${id}`, {
      headers: getApiHeaders()
    })
    return {
      success: true,
      message: `成功删除记录 ID: ${id}`
    }
  } catch (error) {
    console.error('删除记录失败:', error)
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        needReauth: true,
        message: 'token已过期，需要重新认证'
      }
    }
    return {
      success: false,
      message: `删除记录失败: ${error.message || '未知错误'}`
    }
  }
}

// 保存完整的轨道数据（包括坡度、曲线、站台数据）
export async function saveAllTrackData(allData) {
  try {
    if (!allData || typeof allData !== 'object') {
      throw new Error('无效的数据格式')
    }

    // 使用axios保存数据
    await axios.post(
      `${apiBaseUrl}/track-data/`,
      allData,
      {
        headers: getApiHeaders(),
        timeout: 30000
      }
    )

    return {
      success: true,
      message: '所有轨道数据保存成功'
    }
  } catch (error) {
    console.error('轨道数据保存失败:', error)
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        needReauth: true,
        message: 'token已过期，需要重新认证'
      }
    }
    return {
      success: false,
      message: `轨道数据保存失败: ${error.message || '未知错误'}`
    }
  }
}

// 获取完整的轨道数据
export async function fetchAllTrackData(projectId) {
  try {
    const response = await axios.get(`${apiBaseUrl}/track-data/${projectId || ''}`, {
      headers: getApiHeaders()
    })

    return {
      success: true,
      data: response.data,
      message: '成功加载轨道数据'
    }
  } catch (error) {
    console.error('轨道数据加载失败:', error)
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        needReauth: true,
        message: 'token已过期，需要重新认证'
      }
    }
    return {
      success: false,
      message: `轨道数据加载失败: ${error.message || '未知错误'}`
    }
  }
} 