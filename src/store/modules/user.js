import { login, logout, getUserInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router, { resetRouter } from '@/router'

// 在state初始化时从token中提取userId
const initState = () => {
  const token = getToken();
  let userId = '';
  
  // 如果token存在且是user_id_格式
  if (token && token.startsWith('user_id_')) {
    userId = token.replace('user_id_', '');
  } else if (token) {
    // 尝试从localStorage中直接获取userId
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      userId = storedUserId;
    }
  }
  
  console.log('初始化state时恢复的userId:', userId);
  
  return {
    token,
    name: '',
    avatar: '',
    introduction: '',
    roles: [],
    userId
  };
};

const state = initState();

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_USERID: (state, userId) => {
    state.userId = userId
    // 同时存储到localStorage以便在刷新后恢复
    localStorage.setItem('userId', userId)
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { user_name, user_password } = userInfo
    return new Promise((resolve, reject) => {
      login({ 
        user_name: user_name || userInfo.username, 
        user_password: user_password || userInfo.password 
      }).then(response => {
        const userId = response.user_id
        const token = `user_id_${userId}`
        
        commit('SET_TOKEN', token)
        commit('SET_USERID', userId)
        setToken(token)
        resolve()
      }).catch(error => {
        const errorMsg = typeof error === 'string' ? error : 
                       (error && error.message ? error.message : '登录失败，请重试')
        reject(errorMsg)
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 使用state中存储的userId调用getUserInfo API
      if (!state.userId) {
        reject('未找到用户ID，请重新登录')
        return
      }
      
      getUserInfo(state.userId).then(response => {
        // 检查响应格式，适配不同的后端返回结构
        const data = response.data || response
        
        if (!data) {
          reject('验证失败，请重新登录')
          return
        }
        
        // 从响应中提取用户信息
        const name = data.user_full_name || data.user_name || 'Unknown User'
        const avatar = data.avatar || 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
        const introduction = data.user_project_infor || '用户'
        
        // 从用户角色信息中提取角色名称
        let roles = ['user'] // 默认角色
        
        // 如果后端返回了role对象或role_name
        if (data.role && data.role.role_name) {
          roles = [data.role.role_name]
        } else if (data.role_name) {
          roles = [data.role_name]
        }
        
        // 确保roles是一个非空数组
        if (!roles || roles.length <= 0) {
          roles = ['user']
        }
        
        commit('SET_ROLES', roles)
        commit('SET_NAME', name)
        commit('SET_AVATAR', avatar)
        commit('SET_INTRODUCTION', introduction)
        resolve({ roles, name, avatar, introduction })
      }).catch(error => {
        console.error('获取用户信息失败:', error)
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        commit('SET_USERID', '')
        removeToken()
        resetRouter()

        // reset visited views and cached views
        dispatch('tagsView/delAllViews', null, { root: true })

        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      commit('SET_USERID', '')
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
