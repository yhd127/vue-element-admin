<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.user_name" placeholder="请输入用户名" style="width: 200px" class="filter-item" />
      <el-input v-model="listQuery.user_full_name" placeholder="请输入姓名" style="width: 200px" class="filter-item" />
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" type="success" @click="createUser">
        创建账号
      </el-button>
    </div>
    <div class="block block-regular">
      <el-table v-loading="loading" :data="tableData" style="width: 100%" height="calc(85vh - 155px)">
        <el-table-column label="序号" prop="id" sortable="custom" align="center" width="80">
          <template slot-scope="scope">
            <span>{{ (listQuery.page - 1) * listQuery.size + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" align="center" label="用户名" />
        <el-table-column prop="user_full_name" align="center" label="姓名" />
        <el-table-column prop="user_project_infor" align="center" label="项目信息" />
        <el-table-column align="center" label="角色">
          <template slot-scope="scope">
            {{ getRoleName(scope.row.user_role) }}
          </template>
        </el-table-column>
        <el-table-column prop="create_time" align="center" label="创建时间" width="180" />
        <el-table-column prop="update_time" align="center" label="更新时间" width="180" />
        <el-table-column label="操作" align="center" min-width="180">
          <template slot-scope="scope">
            <el-button size="medium" type="warning" @click="updateUserInfo(scope.row)" :disabled="isSpecialAdmin(scope.row)">
              修改信息
            </el-button>
            <el-button size="medium" type="danger" @click="delUser(scope.row.id)" :disabled="isSpecialAdmin(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <pagination :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.size" @pagination="handlePagination" />

    <el-dialog :title="formTextMap[formOperationType]"
      :visible.sync="userDialogFormVisible" :modal="true" custom-class="ly-running-info-body"
      @close="createUserDialogClosed" class="view-dialog" :show-close="false">
      <el-form ref="userForm" :model="userForm" label-width="40%" style="width:60%;" :rules="rules">
        <el-form-item label="ID:" v-if="formOperationType == 'edit'">
          <el-input v-model="userForm.id" disabled />
        </el-form-item>
        <el-form-item label="用户名:" prop="user_name" key="userName1">
          <el-input v-model="userForm.user_name" />
        </el-form-item>
        <el-form-item v-if="formOperationType == 'create'" label="密码：" prop="user_password">
          <el-input v-model="userForm.user_password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item v-if="formOperationType == 'create'" label="确认密码：" prop="password1">
          <el-input v-model="userForm.password1" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名:" key="personName1" prop="user_full_name">
          <el-input v-model="userForm.user_full_name" />
        </el-form-item>
        <el-form-item label="项目信息:">
          <el-input v-model="userForm.user_project_infor" placeholder="请输入项目信息" />
        </el-form-item>
        <el-form-item label="角色:" prop="user_role">
          <el-select v-model="userForm.user_role" placeholder="请选择角色" style="width: 60%;">
            <el-option v-for="item in roleOptions" :key="item.id" :label="item.role_name" :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <div style="display: flex; justify-content: flex-end;">
            <el-button v-if="formOperationType == 'edit'" type="danger" @click="resetPassword">重置密码</el-button>
            <el-button v-if="formOperationType == 'create'" type="primary" @click="addUserSubmit">立即创建</el-button>
            <el-button v-else type="primary" @click.native="updateUserSubmit">确定修改</el-button>
            <el-button @click="createUserDialogClosed">取消</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 密码重置对话框 -->
    <el-dialog
      title="重置密码"
      :visible.sync="passwordDialogVisible"
      width="30%"
    >
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="旧密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPasswordReset">确认</el-button>
      </span>
    </el-dialog>
    
    <!-- 修改用户信息时的密码确认对话框 -->
    <el-dialog
      title="请输入当前用户密码"
      :visible.sync="confirmPasswordVisible"
      width="30%"
    >
      <el-form :model="confirmPasswordForm" label-width="80px">
        <el-form-item label="密码">
          <el-input v-model="confirmPasswordForm.password" type="password" placeholder="请输入当前用户密码" show-password />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="confirmPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWithPassword">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getUserListV1, deleteUser, deleteUserV1, checkUserRegistered, createOrUpdateUser, createOrUpdateUserV1, resetPwd, updateUserV1, getUserByIdxV1, updatePasswordV1 } from '@/api/user'
import { getRoleListV1 } from '@/api/role'
import Pagination from '@/components/Pagination'

export default {
  name: 'UserManagement',
  components: { Pagination },
  data() {
    const validateUsername = (rule, value, callback) => {
      // 如果是编辑模式，并且用户名没有修改，直接通过验证
      if (this.formOperationType === 'edit' && this.userForm.id) {
        const originalUser = this.allUsers.find(user => user.id === this.userForm.id)
        if (originalUser && originalUser.user_name === value) {
          callback()
          return
        }
      }
      
      // 在前端检查用户名是否已存在
      const userExists = this.allUsers.some(user => 
        user.user_name && user.user_name.toLowerCase() === value.toLowerCase()
      )
      
      if (userExists) {
        callback(new Error('用户名已存在，请更换其他用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 5) {
        callback(new Error('密码不能少于5个字符'))
      } else {
        callback()
      }
    }
    const validatePassword1 = (rule, value, callback) => {
      if (value !== this.userForm.user_password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }
    return {
      tableData: [],
      allUsers: [], // 存储所有用户数据
      loading: false,
      total: 0,
      listQuery: {
        page: 1,
        size: 10,
        user_name: '',
        user_full_name: ''
      },
      roleOptions: [],
      userDialogFormVisible: false,
      formOperationType: '',
      formTextMap: {
        create: '创建用户',
        edit: '编辑用户'
      },
      userForm: {
        user_name: '',
        user_password: '',
        user_full_name: '',
        user_role: '',
        user_project_infor: ''
      },
      rules: {
        user_name: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { validator: validateUsername, trigger: 'blur' }
        ],
        user_password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ],
        password1: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validatePassword1, trigger: 'blur' }
        ],
        user_full_name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        user_role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      },
      passwordDialogVisible: false,
      passwordForm: {
        oldPassword: '',
        newPassword: ''
      },
      // 新增确认密码对话框相关数据
      confirmPasswordVisible: false,
      confirmPasswordForm: {
        password: ''
      },
      pendingFormData: null // 暂存待提交的表单数据
    }
  },
  created() {
    this.getList()
    this.getRoleList() // 获取角色列表
  },
  methods: {
    // 判断是否是特殊的管理员账号（用户名为admin且姓名为Administrator）
    isSpecialAdmin(user) {
      return user.user_name === 'admin' && user.user_full_name === 'Administrator' && user.role_name === 'admin';
    },
    // 获取角色列表
    getRoleList() {
      getRoleListV1().then(response => {
        // 适配后端返回结构
        const roleData = Array.isArray(response) ? response : (response.data || [])
        this.roleOptions = roleData.map(role => ({
          id: role.idx,
          role_name: role.role_name
        }))
        console.log('角色列表:', this.roleOptions)
      }).catch(error => {
        console.error('获取角色列表失败', error)
        this.$message.error('获取角色列表失败')
      })
    },
    // 获取角色名称
    getRoleName(roleId) {
      if (!roleId) return '无角色'
      
      // 查找具有此角色ID的用户，并返回其角色名称
      const userWithRole = this.allUsers.find(user => user.user_role === roleId && user.role_name)
      if (userWithRole && userWithRole.role_name) {
        // 角色名称中文映射
        const roleNameMap = {
          'admin': '管理员',
          'user': '用户',
          'viewer': '审核员'
        }
        
        // 如果角色名在映射表中存在，返回中文名称，否则返回原名
        return roleNameMap[userWithRole.role_name] || userWithRole.role_name
      }
      
      return `角色(${roleId})`
    },
    // 获取用户列表
    getList() {
      this.loading = true
      getUserListV1().then(response => {
        this.loading = false
        // 直接返回数组
        let userData = Array.isArray(response) ? response : (response.data || [])
        this.allUsers = userData.map(user => ({
          id: user.idx,
          user_name: user.user_name,
          user_password: user.user_password,
          user_full_name: user.user_full_name,
          user_project_infor: user.user_project_infor,
          user_role: user.user_role,
          role_name: user.role ? user.role.role_name : '',
          create_time: user.created_at,
          update_time: user.updated_at
        }))
        this.applyFilters()
      }).catch(error => {
        this.loading = false
        this.$message.error('获取用户列表失败')
      })
    },
    // 搜索 - 前端过滤
    handleFilter() {
      this.listQuery.page = 1
      this.applyFilters()
    },
    // 应用过滤器 - 在前端过滤数据
    applyFilters() {
      const { user_name, user_full_name } = this.listQuery
      
      // 如果没有搜索条件，显示所有数据
      if (!user_name && !user_full_name) {
        this.filterPageData()
        return
      }
      
      // 过滤符合条件的用户
      const filteredUsers = this.allUsers.filter(user => {
        const matchUsername = !user_name || (user.user_name && user.user_name.toLowerCase().includes(user_name.toLowerCase()))
        const matchFullname = !user_full_name || (user.user_full_name && user.user_full_name.toLowerCase().includes(user_full_name.toLowerCase()))
        return matchUsername && matchFullname
      })
      
      // 设置总数并应用分页
      this.total = filteredUsers.length
      
      // 获取当前页的数据
      const start = (this.listQuery.page - 1) * this.listQuery.size
      const end = start + this.listQuery.size
      this.tableData = filteredUsers.slice(start, end)
    },
    // 处理分页
    filterPageData() {
      this.total = this.allUsers.length
      const start = (this.listQuery.page - 1) * this.listQuery.size
      const end = start + this.listQuery.size
      this.tableData = this.allUsers.slice(start, end)
    },
    // 创建用户
    createUser() {
      // 确保已加载最新的用户数据，以便进行前端验证
      if (this.allUsers.length === 0) {
        this.loading = true
        getUserListV1().then(response => {
          this.loading = false
          // 处理响应数据
          let userData = []
          if (Array.isArray(response)) {
            userData = response
          } else if (response && !response.code) {
            userData = response.items || response
          } else if (response.code === 0 || response.code === 20000) {
            userData = response.data || []
          }
          
          // 更新allUsers数组
          this.allUsers = userData.map(user => ({
            id: user.idx,
            user_name: user.user_name,
            user_password: user.user_password,
            user_full_name: user.user_full_name,
            user_project_infor: user.user_project_infor,
            user_role: user.user_role,
            role_name: user.role ? user.role.role_name : '',
            create_time: user.created_at,
            update_time: user.updated_at
          }))
          
          // 打开创建用户对话框
          this.openCreateUserDialog()
        }).catch(error => {
          this.loading = false
          console.error('获取用户列表失败', error)
          this.$message.error('获取用户列表失败，无法验证用户名唯一性')
        })
      } else {
        // 如果已经有用户数据，直接打开对话框
        this.openCreateUserDialog()
      }
    },
    // 打开创建用户对话框
    openCreateUserDialog() {
      this.formOperationType = 'create'
      this.userForm = {
        user_name: '',
        user_password: '',
        password1: '',
        user_full_name: '',
        user_role: '',
        user_project_infor: ''
      }
      this.userDialogFormVisible = true
    },
    // 更新用户信息
    updateUserInfo(row) {
      // 先调用API获取用户详细信息
      getUserByIdxV1(row.id).then(response => {
        // 获取返回的用户数据
        const userData = response;
        console.log('获取到的用户详情:', userData);
        
        this.formOperationType = 'edit'
        this.userForm = {
          id: userData.idx,
          user_name: userData.user_name,
          user_password: userData.user_password, // 获取到的密码
          password1: userData.user_password, // 设置确认密码与密码相同
          user_full_name: userData.user_full_name,
          user_role: userData.user_role,
          user_project_infor: userData.user_project_infor,
          role_name: userData.role ? userData.role.role_name : ''
        }
        this.userDialogFormVisible = true
      }).catch(error => {
        console.error('获取用户详情失败:', error)
        this.$message.error('获取用户详情失败')
      })
    },
    // 删除用户
    delUser(id) {
      this.$confirm('确认删除该用户?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 使用新的API
        deleteUserV1(id).then(response => {
          this.$message.success('删除成功')
          this.getList() // 重新获取所有用户数据
        }).catch((error) => {
          console.error('删除用户错误:', error)
          
          // 处理错误信息
          let errorMsg = '删除失败';
          if (error.response && error.response.data && error.response.data.detail) {
            errorMsg = error.response.data.detail;
          }
          
          this.$message.error(errorMsg)
        })
      }).catch(() => {})
    },
    // 重置密码
    resetPassword() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: ''
      }
      this.passwordDialogVisible = true
    },
    // 提交密码重置
    submitPasswordReset() {
      if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
        this.$message.warning('请输入完整的旧密码和新密码')
        return
      }

      // 验证新密码长度
      if (this.passwordForm.newPassword.length < 5) {
        this.$message.warning('新密码长度至少为5位')
        return
      }
      
      // 调用新的API
      updatePasswordV1(
        this.userForm.id, 
        this.passwordForm.oldPassword, 
        this.passwordForm.newPassword
      ).then(response => {
        // 密码更新成功
        this.$message.success('密码重置成功')
        this.passwordDialogVisible = false
      }).catch(error => {
        console.error('密码重置错误:', error)
        
        // 处理错误信息
        let errorMsg = '密码重置失败';
        if (error.response && error.response.data && error.response.data.detail) {
          if (error.response.data.detail === 'Incorrect old password') {
            errorMsg = '旧密码不正确';
          } else {
            errorMsg = error.response.data.detail;
          }
        }
        
        this.$message.error(errorMsg)
      })
    },
    // 添加用户
    addUserSubmit() {
      this.$refs.userForm.validate(valid => {
        if (valid) {
          // 在提交前再次检查用户名是否已存在
          const username = this.userForm.user_name.toLowerCase()
          const userExists = this.allUsers.some(user => 
            user.user_name && user.user_name.toLowerCase() === username
          )
          
          if (userExists) {
            this.$message.error('用户名已存在，请更换其他用户名')
            return
          }
          
          // 准备请求数据
          const requestData = {
            user_name: this.userForm.user_name,
            user_password: this.userForm.user_password,
            user_full_name: this.userForm.user_full_name,
            user_role: this.userForm.user_role,
            user_project_infor: this.userForm.user_project_infor || ''
          }
          
          // 验证通过，提交表单
          createOrUpdateUserV1(requestData).then(response => {
            this.userDialogFormVisible = false
            this.$message.success('创建成功')
            this.getList() // 重新获取所有用户数据
          }).catch((error) => {
            console.error('创建用户失败:', error)
            const errorMsg = error.response && error.response.data && error.response.data.detail 
              ? error.response.data.detail 
              : (error.message || '未知错误')
            this.$message.error(`创建失败: ${errorMsg}`)
          })
        }
      })
    },
    // 更新用户信息
    updateUserSubmit() {
      this.$refs.userForm.validate(valid => {
        if (valid) {
          // 创建表单数据副本，避免直接修改this.userForm
          const formData = {
            user_name: this.userForm.user_name,
            user_full_name: this.userForm.user_full_name,
            user_role: this.userForm.user_role,
            user_project_infor: this.userForm.user_project_infor
          }
          
          // 如果密码为空，则先请求用户输入密码
          if (!this.userForm.user_password || this.userForm.user_password === '') {
            // 保存待提交的表单数据
            this.pendingFormData = formData
            
            // 打开密码确认对话框
            this.confirmPasswordForm.password = ''
            this.confirmPasswordVisible = true
          } else {
            // 如果已有密码，直接提交
            formData.user_password = this.userForm.user_password
            this.submitFormData(formData)
          }
        }
      })
    },
    // 提交带有密码的表单数据
    submitWithPassword() {
      if (!this.confirmPasswordForm.password) {
        this.$message.warning('请输入密码')
        return
      }
      
      // 将密码添加到表单数据中
      const formData = {
        ...this.pendingFormData,
        user_password: this.confirmPasswordForm.password
      }
      
      // 提交数据
      this.submitFormData(formData)
      
      // 关闭密码确认对话框
      this.confirmPasswordVisible = false
    },
    // 提交表单数据的核心方法
    submitFormData(formData) {
      console.log('提交更新表单：', formData)
      
      // 使用原来的API更新用户
      updateUserV1(this.userForm.id, formData).then(response => {
        console.log('更新成功，响应:', response)
        this.$message.success('修改成功')
        this.userDialogFormVisible = false
        this.getList() // 重新获取所有用户数据
      }).catch(error => {
        console.error('修改用户错误:', error)
        
        // 从错误中提取详细信息
        let errorMsg = '修改失败'
        if (error.response && error.response.data && error.response.data.detail) {
          errorMsg = error.response.data.detail
        }
        
        this.$message.error(`修改失败: ${errorMsg}`)
      })
    },
    // 关闭创建/编辑对话框
    createUserDialogClosed() {
      this.userDialogFormVisible = false
      this.$refs.userForm && this.$refs.userForm.resetFields()
    },
    // 处理分页变化
    handlePagination() {
      this.applyFilters()
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  padding-bottom: 10px;
  .filter-item {
    margin-right: 10px;
  }
}
.block {
  margin: 20px 0;
}
</style> 