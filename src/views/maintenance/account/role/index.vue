<template>
  <div class="app-container">
    <el-button type="success" @click="handleAddRole">
      添加角色
    </el-button>

    <div class="block block-custom">
      <el-table :data="rolesList" style="width: 100%;margin-top:30px;" height="calc(85vh - 140px)" border>
        <el-table-column label="序号" align="center" width="80">
          <template slot-scope="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="角色ID" prop="idx" width="100">
          <template slot-scope="scope">
            {{ scope.row.idx }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="角色名称" width="180">
          <template slot-scope="scope">
            {{ scope.row.role_name }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="角色描述">
          <template slot-scope="scope">
            {{ scope.row.role_description }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.create_time }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="更新时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.update_time }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作">
          <template slot-scope="scope">
            <el-button :disabled="scope.row.idx === 1" type="primary" size="small" @click="handleEdit(scope)">
              编辑
            </el-button>
            <el-button :disabled="scope.row.idx === 1 || scope.row.idx === 2" type="danger" size="small" @click="handleDelete(scope)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog :visible.sync="dialogVisible" :title="dialogType === 'edit' ? '修改角色' : '创建角色'" class="view-dialog" :modal="true" :show-close="false">
      <el-form ref="roleForm" :model="roleForm" label-position="left" label-width="40%" style="width:60%;" :rules="rules">
        <el-form-item v-if="dialogType === 'edit'" label="角色ID (idx)">
          <el-input v-model="roleForm.idx" disabled style="background-color: #f5f7fa;" />
        </el-form-item>
        <el-form-item label="角色名" prop="role_name">
          <el-input v-model="roleForm.role_name" placeholder="请输入角色名" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="roleForm.role_description" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea" placeholder="请输入角色相关说明信息" />
        </el-form-item>
      </el-form>
      <div style="text-align:right;">
        <el-button type="danger" @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="confirmRole">
          确认
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { deepClone } from '@/utils'
import { getRoleListV1, deleteRoleV1, updateRoleV1, createRoleV1 } from '@/api/role'

const defaultRole = {
  idx: '',
  role_name: '',
  role_description: ''
}

export default {
  name: 'RoleManagement',
  data() {
    return {
      rules: {
        role_name: [{ required: true, message: '角色名为必填项', trigger: 'blur' }]
      },
      roleForm: {
        role_name: '',
        role_description: ''
      },
      roleFormBeforeChange: {},
      rolesList: [],
      dialogVisible: false,
      dialogType: 'new'
    }
  },
  created() {
    this.getRoles()
  },
  methods: {
    // 获取角色列表
    async getRoles() {
      try {
        const res = await getRoleListV1()
        // 适配后端返回结构
        this.rolesList = (Array.isArray(res) ? res : (res.data || [])).map(item => ({
          idx: item.idx,
          role_name: item.role_name,
          role_description: item.role_description,
          create_time: item.created_at,
          update_time: item.updated_at
        }))
      } catch (error) {
        console.error('获取角色列表失败', error)
        this.$message.error('获取角色列表失败')
      }
    },
    // 添加角色
    handleAddRole() {
      this.roleForm = Object.assign({}, defaultRole)
      this.roleFormBeforeChange = Object.assign({}, defaultRole)
      this.dialogType = 'new'
      this.dialogVisible = true
    },
    // 编辑角色
    handleEdit(scope) {
      this.dialogType = 'edit'
      this.roleForm = deepClone(scope.row)
      this.roleFormBeforeChange = deepClone(scope.row)
      this.dialogVisible = true
    },
    // 删除角色
    handleDelete({ row }) {
      this.$confirm('确认删除该角色?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          try {
            console.log('调用deleteRoleV1, idx:', row.idx)
            await deleteRoleV1(row.idx)
            console.log('删除成功')
            this.getRoles()
            this.$message.success('删除成功')
          } catch (error) {
            console.error('删除角色失败:', error)
            const errorMsg = error.response && error.response.data && error.response.data.detail
              ? error.response.data.detail
              : (error.message || '未知错误')
            this.$message.error(`删除失败: ${errorMsg}`)
          }
        })
        .catch(() => {
          // 用户取消删除操作，不需要处理
        })
    },
    // 确认角色添加/编辑
    confirmRole() {
      console.log('点击确认按钮')
      this.$refs.roleForm.validate(valid => {
        console.log('表单验证结果:', valid)
        if (valid) {
          const isEdit = this.dialogType === 'edit'
          const data = {
            role_name: this.roleForm.role_name,
            role_description: this.roleForm.role_description
          }
          console.log('提交数据:', data)

          if (isEdit) {
            // 编辑角色时使用updateRoleV1，不再传入userId
            console.log('调用updateRoleV1, idx:', this.roleForm.idx)
            updateRoleV1(this.roleForm.idx, data).then(response => {
              console.log('更新成功，响应:', response)
              this.dialogVisible = false
              this.$message({
                type: 'success',
                message: '更新成功!'
              })
              this.getRoles()
            }).catch(error => {
              console.error('更新角色失败:', error)
              const errorMsg = error.response && error.response.data && error.response.data.detail
                ? error.response.data.detail
                : (error.message || '未知错误')
              this.$message.error(`更新失败: ${errorMsg}`)
            })
          } else {
            // 创建角色
            console.log('调用createRoleV1')
            createRoleV1(data).then(response => {
              console.log('创建成功，响应:', response)
              this.dialogVisible = false
              this.$message({
                type: 'success',
                message: '创建成功!'
              })
              this.getRoles()
            }).catch(error => {
              console.error('创建角色失败:', error)
              // 获取错误消息
              let errorMsg = error.response && error.response.data && error.response.data.detail
                ? error.response.data.detail
                : (error.message || '未知错误')

              // 翻译特定的英文错误消息为中文
              if (errorMsg === 'The role with this name already exists in the system.') {
                errorMsg = '该角色名称已存在，请使用其他名称'
              }

              this.$message.error(`创建失败: ${errorMsg}`)
            })
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  .roles-table {
    margin-top: 30px;
  }
  .block-custom {
    margin-top: 20px;
  }
  .permission-tree {
    margin-bottom: 30px;
  }
}
</style>
