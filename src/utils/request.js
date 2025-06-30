import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 15000, // request timeout - 增加到15秒
  headers: {
    'Content-Type': 'application/json'
  }
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent
    console.log('发送请求:', config.url, config.method, config.data || config.params)

    // 如果请求标记了noDefaultParams，则不添加默认参数
    if (config.noDefaultParams) {
      console.log('跳过添加默认参数')
      return config
    }

    // 确保所有请求都携带user_id参数
    const token = getToken();
    let userId = null;
    
    // 1. 尝试从token中提取，如果是旧格式
    if (token && token.startsWith('user_id_')) {
      userId = token.replace('user_id_', '');
    }
    
    // 2. 如果无法从token提取，尝试从store获取
    if (!userId && store.getters.userId) {
      userId = store.getters.userId;
    }
    
    // 3. 尝试从localStorage直接获取
    if (!userId) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        userId = storedUserId;
      }
    }
    
    // 4. 最后的默认值
    if (!userId) {
      userId = '7'; // 使用已知的正确用户ID作为后备
    }
    
    // 为所有请求添加user_id参数
    if (config.params) {
      config.params.user_id = config.params.user_id || userId;
    } else {
      config.params = { user_id: userId };
    }
    
    console.log('最终请求参数:', config.params);
    
    return config
  },
  error => {
    // do something with request error
    console.log('请求错误:', error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    console.log('收到响应:', response.config.url, response.status, response.data)
    const res = response.data

    // 处理登录成功响应 - 包含user_id没有code字段
    if (res.user_id !== undefined && res.code === undefined) {
      return res
    }
    
    // 处理成功但返回数组的情况 - 通常是列表数据
    if (Array.isArray(res)) {
      return res;
    }
    
    // 处理普通对象但没有code字段的情况
    if (typeof res === 'object' && res !== null && res.code === undefined) {
      return res;
    }

    // 处理有code字段的标准响应 - 接受code为0和20000的响应
    if (res.code !== 20000 && res.code !== 0) {
      Message({
        message: res.message || res.msg || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // to re-login
        MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
          confirmButtonText: 'Re-Login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || res.msg || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error) // for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
