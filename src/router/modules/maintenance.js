/** 用户和角色管理模块路由 **/

import Layout from '@/layout'
import User from '@/views/maintenance/account/user/index'
import Role from '@/views/maintenance/account/role/index'

// 将用户管理和角色管理提升为单独的路由项
const userRouter = {
  path: '/user',
  component: Layout,
  name: 'UserManagement',
  meta: {
    title: '用户管理',
    icon: 'user',
    roles: ['admin']
  },
  children: [
    {
      path: 'index',
      component: User,
      name: 'UserIndex',
      meta: { 
        title: '用户管理', 
        icon: 'user',
        noCache: true,
        roles: ['admin']
      }
    }
  ]
}

const roleRouter = {
  path: '/role',
  component: Layout,
  name: 'RoleManagement',
  meta: {
    title: '角色管理',
    icon: 'peoples',
    roles: ['admin']
  },
  children: [
    {
      path: 'index',
      component: Role,
      name: 'RoleIndex',
      meta: { 
        title: '角色管理', 
        icon: 'peoples',
        noCache: true,
        roles: ['admin']
      }
    }
  ]
}

// 项目权限管理路由
const projectPermissionRouter = {
  path: '/project-permission',
  component: Layout,
  name: 'ProjectPermissionManagement',
  meta: {
    title: '项目权限管理',
    icon: 'lock',
    roles: ['admin', 'viewer'] // 管理员和审核员可以访问
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/maintenance/project-permission/index'),
      name: 'ProjectPermissionIndex',
      meta: { 
        title: '项目权限管理', 
        icon: 'lock',
        noCache: true,
        roles: ['admin', 'viewer']
      }
    }
  ]
}

export { userRouter, roleRouter, projectPermissionRouter } 