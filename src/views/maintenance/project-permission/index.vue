<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>项目权限管理</span>
      </div>
      <div class="card-content">
        <p class="description">
          在此页面可以管理普通用户(编辑员)对项目的访问权限。管理员和审核员可以为编辑员分配或移除项目权限。
        </p>
      </div>
    </el-card>

    <div class="filter-container">
      <el-input v-model="listQuery.user_name" placeholder="请输入用户名" style="width: 200px" class="filter-item" />
      <el-input v-model="listQuery.user_full_name" placeholder="请输入姓名" style="width: 200px" class="filter-item" />
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        搜索
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="userList"
      style="width: 100%; margin-bottom: 20px"
      border
      fit
      highlight-current-row
    >
      <el-table-column label="序号" align="center" width="80">
        <template slot-scope="scope">
          <span>{{ (listQuery.page - 1) * listQuery.size + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="user_name" label="用户名" align="center" />
      <el-table-column prop="user_full_name" label="姓名" align="center" />
      <el-table-column prop="role_name" label="角色" align="center" />
      <el-table-column label="可编辑项目" align="center">
        <template slot-scope="scope">
          <el-tag v-for="project in scope.row.projects" :key="project.id" style="margin-right: 5px; margin-bottom: 5px">
            {{ project.project_name }}
          </el-tag>
          <span v-if="!scope.row.projects || scope.row.projects.length === 0">无项目权限</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150">
        <template slot-scope="scope">
          <el-button 
            type="primary" 
            size="mini" 
            @click="handleEditPermission(scope.row)"
            v-if="scope.row.role_name === 'user'"
          >
            编辑权限
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination 
      v-show="total > 0" 
      :total="total" 
      :page.sync="listQuery.page" 
      :limit.sync="listQuery.size" 
      @pagination="getList" 
    />

    <!-- 编辑项目权限对话框 -->
    <el-dialog 
      title="编辑项目权限" 
      :visible.sync="dialogVisible" 
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser">
        <p class="dialog-user-info">
          <span>用户名: {{ currentUser.user_name }}</span>
          <span style="margin-left: 20px">姓名: {{ currentUser.user_full_name }}</span>
        </p>
        
        <el-transfer
          v-loading="transferLoading"
          filterable
          :filter-method="filterMethod"
          filter-placeholder="请输入城市拼音"
          v-model="value"
          :titles="['所有项目', '授权项目']"
          :data="data">
        </el-transfer>
        
        <div style="margin-top: 20px; text-align: right">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProjectPermissions">保存</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getUserListV1 } from '@/api/user'
import { getProjectList } from '@/api/project'
import { getUserProjects, updateUserProjects } from '@/api/permission'
import Pagination from '@/components/Pagination'

export default {
  name: 'ProjectPermission',
  components: { Pagination },
  data() {
    return {
      loading: false,
      transferLoading: false,
      userList: [],
      allProjects: [], // 所有项目列表
      total: 0,
      listQuery: {
        page: 1,
        size: 10,
        user_name: '',
        user_full_name: ''
      },
      dialogVisible: false,
      currentUser: null,
      data: [], // 穿梭框数据，将通过API获取
      value: [],
    }
  },
  created() {
    this.getList()
    this.fetchProjectList() // 获取项目列表
  },
  methods: {
    filterMethod(query, item) {
      return item.label.indexOf(query) > -1;
    },
    
    // 获取项目列表
    fetchProjectList() {
      this.transferLoading = true
      getProjectList().then(response => {
        const projects = Array.isArray(response) ? response : (response.data || [])
        
        // 格式化项目数据为穿梭框所需格式
        this.data = projects.map(project => {
          return {
            key: project.project_id || project.id || project.idx,
            label: project.project_name || project.name,
            pinyin: project.project_name || project.name // 可用于搜索
          }
        })
        
        this.transferLoading = false
      }).catch(error => {
        console.error('获取项目列表失败', error)
        this.$message.error('获取项目列表失败')
        this.transferLoading = false
      })
    },
    
    // 获取用户列表
    getList() {
      this.loading = true
      getUserListV1().then(response => {
        const userData = Array.isArray(response) ? response : (response.data || [])
        
        // 只显示普通用户(user角色)
        this.userList = userData
          .filter(user => user.role && user.role.role_name === 'user')
          .map(user => ({
            id: user.idx,
            user_name: user.user_name,
            user_full_name: user.user_full_name,
            role_name: user.role ? user.role.role_name : '',
            projects: user.projects || [] // 假设API返回了用户的项目列表
          }))
        
        this.total = this.userList.length
        this.loading = false
      }).catch(error => {
        console.error('获取用户列表失败', error)
        this.$message.error('获取用户列表失败')
        this.loading = false
      })
    },
    
    // 搜索
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    
    // 编辑权限
    handleEditPermission(user) {
      this.currentUser = user
      this.dialogVisible = true
      
      // 获取用户当前拥有的项目权限
      this.value = user.projects ? user.projects.map(project => project.id) : []
    },
    
    // 保存项目权限
    saveProjectPermissions() {
      if (!this.currentUser) return
      
      // 如果有真实API，可以调用updateUserProjects
      // updateUserProjects(this.currentUser.id, this.value).then(() => {
      //   this.$message.success('项目权限更新成功')
      //   this.dialogVisible = false
      //   this.getList() // 刷新用户列表
      // }).catch(error => {
      //   console.error('更新项目权限失败', error)
      //   this.$message.error('更新项目权限失败')
      // })
      
      // 模拟API调用成功
      this.$message.success('项目权限更新成功（模拟）')
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.box-card {
  margin-bottom: 20px;
  
  .card-content {
    padding: 10px 0;
  }
  
  .description {
    font-size: 14px;
    color: #606266;
    line-height: 1.5;
  }
}

.filter-container {
  margin-bottom: 20px;
  
  .filter-item {
    margin-right: 10px;
  }
}

.dialog-user-info {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;
}

.el-transfer {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}
</style> 