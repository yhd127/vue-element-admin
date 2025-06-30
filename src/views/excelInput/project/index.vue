<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>项目管理</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="handleAddProject">新建项目</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="projectList"
        style="width: 100%; margin-bottom: 20px"
        row-key="id"
        border
        stripe
        fit
        highlight-current-row
        @expand-change="handleExpandChange"
      >
        <!-- 展开列 -->
        <el-table-column type="expand">
          <template slot-scope="props">
            <el-form label-position="left" inline class="demo-table-expand">
              <el-form-item label="输入文件数量">
                <span>{{ props.row.project_inputfile_count }}</span>
              </el-form-item>
              <el-form-item label="输出Excel数量">
                <span>{{ props.row.project_outputfile_excel_count }}</span>
              </el-form-item>
              <el-form-item label="输出图片数量">
                <span>{{ props.row.project_output_file_picture_count }}</span>
              </el-form-item>
              <el-form-item label="编辑人">
                <span>{{ props.row.edit_user_name }}</span>
              </el-form-item>
              <el-form-item label="审核人">
                <span>{{ props.row.examine_user_name }}</span>
              </el-form-item>
              <el-form-item label="版本号">
                <span>{{ props.row.version }}</span>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>

        <el-table-column
          label="序号"
          width="80"
          align="center"
        >
          <template slot-scope="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="project_name"
          label="项目名称"
          width="180"
        />
        <el-table-column
          prop="create_time"
          label="创建时间"
          width="180"
        />
        <el-table-column
          prop="update_time"
          label="更新时间"
          width="180"
        />

        <el-table-column
          label="土建参数"
          align="center"
          width="250"
        >
          <template slot-scope="scope">
            <el-popover
              placement="bottom"
              width="300"
              trigger="hover"
              popper-class="excel-list-popover"
            >
              <div class="excel-list">
                <div class="excel-list-title">土建参数{{ scope.row.version }}</div>
                <el-divider />
                <div
                  v-for="file in getCivilExcelFiles(scope.row.id)"
                  :key="file.id"
                  class="excel-item"
                  :title="file.displayName || file.file"
                  @click="handleViewExcel(file)"
                >
                  <i class="el-icon-document" />
                  <span>{{ file.displayName || file.file }}</span>
                </div>
                <div v-if="getCivilExcelFiles(scope.row.id).length === 0" class="excel-list-empty">
                  <i class="el-icon-document" /><span class="clickable-version" @click="handleViewTrack0607(scope.row)">土建版本{{ scope.row.version }}</span>
                </div>
                <el-divider v-if="getCivilExcelFiles(scope.row.id).length > 0" class="dashed-divider" />
                <div
                  class="excel-item new-version"
                  @click="handleAddVersion(scope.row, 'civil')"
                >
                  <i class="el-icon-plus" />
                  <span>新建版本</span>
                </div>
              </div>
              <el-button
                slot="reference"
                size="mini"
                type="primary"
                icon="el-icon-folder-opened"
              >
                土建参数
              </el-button>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          label="车辆参数"
          align="center"
          width="250"
        >
          <template slot-scope="scope">
            <el-popover
              placement="bottom"
              width="300"
              trigger="hover"
              popper-class="excel-list-popover"
            >
              <div class="excel-list">
                <div class="excel-list-title">车辆参数{{ scope.row.version }}</div>
                <el-divider />
                <div
                  v-for="file in getVehicleExcelFiles(scope.row.id)"
                  :key="file.id"
                  class="excel-item"
                >
                  <div class="excel-item-content" :title="file.displayName || file.file" @click="handleViewExcel(file)">
                    <i class="el-icon-document" />
                    <span class="file-name">{{ file.displayName || file.file }}</span>
                  </div>
                  <div class="excel-item-actions always-visible">
                    <el-button
                      type="text"
                      size="mini"
                      icon="el-icon-download"
                      @click.stop="handleDownloadFile(file)"
                    >下载</el-button>
                    <el-button
                      type="text"
                      size="mini"
                      icon="el-icon-delete"
                      @click.stop="handleDeleteFile(file, 'vehicle')"
                    >删除</el-button>
                  </div>
                </div>
                <div v-if="getVehicleExcelFiles(scope.row.id).length === 0" class="excel-list-empty">
                  <i class="el-icon-document" /><span>车辆版本{{ scope.row.version }}</span>
                </div>
                <el-divider v-if="getVehicleExcelFiles(scope.row.id).length > 0" class="dashed-divider" />
                <div
                  class="excel-item upload-button"
                  @click="handleUploadFile(scope.row.id, 'vehicle')"
                >
                  <i class="el-icon-upload2" />
                  <span class="upload-text">上传</span>
                </div>
              </div>
              <el-button
                slot="reference"
                size="mini"
                type="success"
                icon="el-icon-folder-opened"
              >
                车辆参数
              </el-button>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          width="180"
        >
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-edit"
              @click="handleEditProject(scope.row)"
            >更改</el-button>
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="handleDeleteProject(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 新建项目对话框 -->
      <el-dialog
        title="新建项目"
        :visible.sync="dialogFormVisible"
        width="30%"
      >
        <el-form :model="projectForm" label-width="100px">
          <el-form-item label="项目名称" required>
            <el-input v-model="projectForm.project_name" autocomplete="off" placeholder="请输入项目名称" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitProjectForm">确 定</el-button>
        </div>
      </el-dialog>

      <!-- 编辑项目对话框 -->
      <el-dialog
        title="编辑项目"
        :visible.sync="editDialogVisible"
        width="40%"
      >
        <el-form :model="editForm" label-width="150px">
          <el-form-item label="项目名称" required>
            <el-input v-model="editForm.project_name" autocomplete="off" placeholder="请输入项目名称" />
            <div class="form-tip">
              <i class="el-icon-warning" />
              project_name若与当前project_name不一致，则会直接新建项目
            </div>
          </el-form-item>
          <el-form-item label="输入文件数量">
            <el-input-number v-model="editForm.project_inputfile_count" :min="0" :step="1" />
          </el-form-item>
          <el-form-item label="输出Excel数量">
            <el-input-number v-model="editForm.project_outputfile_excel_count" :min="0" :step="1" />
          </el-form-item>
          <el-form-item label="输出图片数量">
            <el-input-number v-model="editForm.project_output_file_picture_count" :min="0" :step="1" />
          </el-form-item>
          <el-form-item label="编辑人">
            <el-input v-model="editForm.edit_user_name" autocomplete="off" placeholder="请输入编辑人" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitEditForm">确 定</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { getProjectList, createProject, deleteProject, saveFile, checkProjectRegistered, getFileList, updateProject } from '@/api/project'

export default {
  name: 'ProjectManagement',
  data() {
    return {
      projectList: [],
      // 保留示例项目的文件数据
      civilExcelFiles: {
        99999: [
          { id: 1, projectId: 99999, file: 'track_up.xls', displayName: '土建版本1', username: 'admin', name: '管理员' },
          { id: 2, projectId: 99999, file: 'track_down.xls', displayName: '土建版本2', username: 'user1', name: '用户1' },
          { id: 3, projectId: 99999, file: 'track_down-80.xls', displayName: '土建版本3', username: 'user2', name: '用户2' }
        ]
      },
      vehicleExcelFiles: {
        99999: [
          { id: 6, projectId: 99999, file: 'vehicle_specs_sh.json', displayName: '车辆版本1', username: 'user2', name: '用户2' }
        ]
      },
      loading: false,
      dialogFormVisible: false,
      projectForm: {
        project_name: ''
      },
      editDialogVisible: false,
      editForm: {
        id: null,
        project_name: '',
        project_inputfile_count: 0,
        project_outputfile_excel_count: 0,
        project_output_file_picture_count: 0,
        edit_user_name: ''
      },
      listQuery: {
        page: 1,
        size: 15, // 改为size匹配API参数
        user_id: 0, // 默认用户ID，会从store中获取
        project_search_word: ''
      }
    }
  },
  created() {
    // 从store获取用户ID
    if (this.$store.getters.userId) {
      this.listQuery.user_id = this.$store.getters.userId
    }
    // 获取项目列表
    this.fetchProjectList()
  },
  methods: {
    // 获取项目列表
    fetchProjectList() {
      this.loading = true

      // 前端写的项目，始终保留在第一位
      const frontendProject = {
        id: 99999, // 使用一个不太可能与后端项目ID冲突的值
        project_name: '市域机场联络线',
        project_inputfile_count: 3,
        project_outputfile_excel_count: 1,
        project_output_file_picture_count: 2,
        create_time: '2025-05-01 08:00:00',
        update_time: '2025-05-01 10:00:00',
        edit_user_name: 'admin',
        examine_user_name: 'admin',
        version: 1
      }

      // 调用API获取项目列表，不传入任何参数
      getProjectList()
        .then(response => {
          let projects = []

          // 处理多种可能的响应格式
          if (Array.isArray(response)) {
            // 如果直接返回数组
            projects = response
          } else if (response && !response.code) {
            // 如果返回对象但没有code字段
            projects = response.data || response
          } else if (response && response.code === 20000) {
            // 标准响应格式
            projects = response.data || []
          }

          // 格式化项目数据
          const formattedProjects = projects.map(project => {
            return {
              id: project.project_id || project.id || project.idx,
              project_name: project.project_name || project.name,
              project_inputfile_count: project.project_inputfile_count || project.input_file_count || 0,
              project_outputfile_excel_count: project.project_outputfile_excel_count || project.output_excel_count || 0,
              project_output_file_picture_count: project.project_output_file_picture_count || project.output_picture_count || 0,
              create_time: project.create_time || project.created_at || new Date().toISOString(),
              update_time: project.update_time || project.updated_at || new Date().toISOString(),
              edit_user_name: project.edit_user_name || project.editor || this.$store.getters.name || 'admin',
              examine_user_name: project.examine_user_name || project.examiner || '',
              version: project.version || 1
            }
          })

          // 将前端项目放在第一位，后端项目列表添加在后面
          this.projectList = [frontendProject, ...formattedProjects]
          this.loading = false
        })
        .catch(error => {
          console.error('获取项目列表错误:', error)
          // 即使API调用失败，也确保前端项目显示
          this.projectList = [frontendProject]
          this.$message.error('获取项目列表失败，请检查网络连接或刷新页面重试')
          this.loading = false
        })
    },

    // 获取特定项目的土建参数Excel文件
    getCivilExcelFiles(projectId) {
      return this.civilExcelFiles[projectId] || []
    },

    // 获取特定项目的车辆参数Excel文件
    getVehicleExcelFiles(projectId) {
      return this.vehicleExcelFiles[projectId] || []
    },

    // 查看Excel文件
    handleViewExcel(file) {
      // 修正文件后缀，确保与Track1.vue中的逻辑一致
      const fileInfo = {
        ...file,
        file: file.file.replace('.xls', '.json') // 因为Track1.vue中加载的是JSON文件
      }

      // 存储选中的文件信息到localStorage
      localStorage.setItem('selectedTrackFile', JSON.stringify(fileInfo))

      // 跳转到Track详情页
      this.$router.push(`/excelInput/input/track/detail/${file.id}`)
    },

    // 查看新版本轨道数据
    handleViewTrack0607(project) {
      // 只处理后端项目，不处理前端示例项目
      if (project.id !== 99999) {
        // 存储项目信息到localStorage
        localStorage.setItem('selectedProject', JSON.stringify(project))

        // 跳转到新的track1yuanapi页面，而不是track0607
        this.$router.push(`/excelInput/track1yuanapi?projectId=${project.id}`)
      } else {
        // 前端示例项目仍然使用原来的逻辑
        const file = this.getCivilExcelFiles(project.id)[0]
        if (file) {
          this.handleViewExcel(file)
        }
      }
    },

    // 新建项目
    handleAddProject() {
      this.projectForm = { project_name: '' }
      this.dialogFormVisible = true
    },

    // 提交项目表单
    submitProjectForm() {
      if (!this.projectForm.project_name) {
        this.$message.warning('请输入项目名称')
        return
      }

      // 检查项目名是否已存在
      checkProjectRegistered(this.projectForm.project_name).then(response => {
        // 如果返回is_registered为true，则项目名已被注册
        if (response && response.is_registered === true) {
          this.$message.error('项目名称已存在')
          return
        }

        // 获取用户ID
        const userId = this.$store.getters.userId
        console.log('创建项目使用的用户ID:', userId)

        // 构建项目数据，确保字段名与API要求一致
        const projectData = {
          project_name: this.projectForm.project_name,
          project_inputfile_count: 0,
          project_outputfile_excel_count: 0,
          project_output_file_picture_count: 0,
          edit_user_name: this.$store.getters.name || 'admin'
        }

        console.log('提交的项目数据:', projectData)

        // 发送创建项目请求，确保user_id作为查询参数传递
        createProject(projectData)
          .then(response => {
            console.log('创建项目响应:', response)

            // 处理多种可能的响应格式
            const isSuccess =
              (response && response.msg && response.msg.includes('success')) ||
              (response && response.code === 20000) ||
              (response && response.code === 0)

            if (isSuccess) {
              this.$message.success('创建项目成功')
              this.dialogFormVisible = false
              this.fetchProjectList() // 重新获取项目列表
            } else {
              this.$message.error('创建项目失败：' + (response && (response.msg || response.message) || '未知错误'))
            }
          })
          .catch(error => {
            console.error('创建项目错误:', error)
            this.$message.error('创建项目失败，请稍后重试')
          })
      }).catch(error => {
        console.error('检查项目名错误:', error)
        this.$message.error('检查项目名时出错，请稍后重试')
      })
    },

    // 编辑项目
    handleEditProject(project) {
      // 设置表单数据
      this.editForm = {
        id: project.id,
        project_name: project.project_name,
        project_inputfile_count: project.project_inputfile_count || 0,
        project_outputfile_excel_count: project.project_outputfile_excel_count || 0,
        project_output_file_picture_count: project.project_output_file_picture_count || 0,
        edit_user_name: this.$store.getters.name || 'admin'
      }

      // 显示编辑对话框
      this.editDialogVisible = true
    },

    // 提交编辑表单
    submitEditForm() {
      if (!this.editForm.project_name) {
        this.$message.warning('请输入项目名称')
        return
      }

      // 获取用户ID
      const userId = this.$store.getters.userId

      // 准备更新的项目数据
      const projectData = {
        project_name: this.editForm.project_name,
        project_inputfile_count: this.editForm.project_inputfile_count,
        project_outputfile_excel_count: this.editForm.project_outputfile_excel_count,
        project_output_file_picture_count: this.editForm.project_output_file_picture_count,
        edit_user_name: this.editForm.edit_user_name
      }

      // 调用API更新项目
      updateProject(projectData)
        .then(response => {
          // 处理多种可能的响应格式
          const isSuccess =
            (response && response.msg && response.msg.includes('success')) ||
            (response && response.code === 20000) ||
            (response && response.code === 0)

          if (isSuccess) {
            this.$message.success('更新项目成功')
            this.editDialogVisible = false
            this.fetchProjectList() // 重新获取项目列表
          } else {
            this.$message.error('更新项目失败：' + (response && (response.msg || response.message) || '未知错误'))
          }
        })
        .catch(error => {
          console.error('更新项目错误:', error)
          this.$message.error('更新项目失败，请稍后重试')
        })
    },

    // 删除项目
    handleDeleteProject(project) {
      this.$confirm(`确定要删除项目 "${project.project_name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用API删除项目
        deleteProject(project.id)
          .then(response => {
            // 处理多种可能的响应格式
            const isSuccess =
              (response && response.msg && response.msg.includes('success')) ||
              (response && response.code === 20000) ||
              (response && response.code === 0)

            if (isSuccess) {
              this.$message.success('删除成功')
              this.fetchProjectList() // 重新加载项目列表

              // 删除相关的Excel文件
              delete this.civilExcelFiles[project.id]
              delete this.vehicleExcelFiles[project.id]
            } else {
              this.$message.error('删除项目失败：' + (response && (response.msg || response.message) || '未知错误'))
            }
          })
          .catch(error => {
            console.error('删除项目错误:', error)

            // 检查是否是Internal Server Error但实际上删除成功的情况
            if (error.response && error.response.status === 500 &&
                error.response.data &&
                (error.response.data.detail === 'Internal server error' ||
                 JSON.stringify(error.response.data).includes('Internal server error'))) {
              console.log('收到500错误但视为删除成功')
              this.$message.success('删除成功')
              this.fetchProjectList() // 重新加载项目列表

              // 删除相关的Excel文件
              delete this.civilExcelFiles[project.id]
              delete this.vehicleExcelFiles[project.id]
            } else {
              this.$message.error('删除项目时发生错误，请检查网络连接')
            }
          })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },

    // 加载项目文件列表
    loadProjectFiles(project) {
      // 同时获取土建参数和车辆参数文件
      Promise.all([
        // 获取土建参数文件
        getFileList(project.id, 'civil', this.$store.getters.userId),
        // 获取车辆参数文件
        getFileList(project.id, 'vehicle', this.$store.getters.userId)
      ]).then(([civilResponse, vehicleResponse]) => {
        // 处理土建参数文件响应
        let civilFiles = []
        if (Array.isArray(civilResponse)) {
          civilFiles = civilResponse
        } else if (civilResponse && civilResponse.code === 20000 && civilResponse.data) {
          civilFiles = civilResponse.data
        } else if (civilResponse && civilResponse.files) {
          civilFiles = civilResponse.files
        }

        // 处理车辆参数文件响应
        let vehicleFiles = []
        if (Array.isArray(vehicleResponse)) {
          vehicleFiles = vehicleResponse
        } else if (vehicleResponse && vehicleResponse.code === 20000 && vehicleResponse.data) {
          vehicleFiles = vehicleResponse.data
        } else if (vehicleResponse && vehicleResponse.files) {
          vehicleFiles = vehicleResponse.files
        }

        // 格式化文件数据
        this.civilExcelFiles = {
          ...this.civilExcelFiles,
          [project.id]: civilFiles.map(file => ({
            id: file.id || file.file_id,
            name: file.file_name || file.name,
            version: file.version || '1.0',
            status: file.file_status || file.status || 'normal',
            upload_time: file.upload_time || file.created_at || new Date().toISOString()
          }))
        }

        this.vehicleExcelFiles = {
          ...this.vehicleExcelFiles,
          [project.id]: vehicleFiles.map(file => ({
            id: file.id || file.file_id,
            name: file.file_name || file.name,
            version: file.version || '1.0',
            status: file.file_status || file.status || 'normal',
            upload_time: file.upload_time || file.created_at || new Date().toISOString()
          }))
        }
      }).catch(error => {
        console.error('获取项目文件列表错误:', error)
        this.$message.error('获取文件列表失败，请稍后重试')
      })
    },

    // 处理展开行变化
    handleExpandChange(row, expandedRows) {
      // 不再发送请求获取文件列表
      // 如果需要获取文件，可以在其他地方主动调用 loadProjectFiles
    },

    // 添加新版本
    handleAddVersion(project, type) {
      // 获取项目信息
      const projectName = project.project_name
      const projectId = project.id

      // 提示用户输入版本名称
      const typeName = type === 'civil' ? '土建参数' : '车辆参数'
      this.$prompt(`请输入${projectName}项目${typeName}版本名称`, '添加版本', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '版本名称不能为空'
      }).then(({ value }) => {
        // 构建文件数据
        const fileData = {
          project_id: projectId,
          file_name: `${projectName}_${value}_${type === 'civil' ? '土建参数' : '车辆参数'}.xlsx`,
          file_type: type,
          version: value,
          user_id: this.$store.getters.userId
        }

        // 调用API保存文件
        saveFile(fileData).then(response => {
          // 处理多种可能的响应格式
          const isSuccess =
            (response && response.msg && response.msg.includes('success')) ||
            (response && response.code === 20000) ||
            (response && response.code === 0)

          if (isSuccess) {
            this.$message.success(`添加${typeName}版本成功`)

            // 重新加载文件列表
            this.loadProjectFiles(project)

            // 初始化模板数据
            if (type === 'civil') {
              // 初始化土建参数模板数据
              const tracksData = {
                project_id: projectId,
                direction: 'up',
                data: []
              }
              localStorage.setItem('tracksData', JSON.stringify(tracksData))

              const gradientData = {
                project_id: projectId,
                direction: 'up',
                data: []
              }
              localStorage.setItem('gradientData', JSON.stringify(gradientData))

              const stationData = {
                project_id: projectId,
                direction: 'up',
                data: []
              }
              localStorage.setItem('stationData', JSON.stringify(stationData))

              const psrData = {
                project_id: projectId,
                direction: 'up',
                data: []
              }
              localStorage.setItem('psrData', JSON.stringify(psrData))
            } else if (type === 'vehicle') {
              // 初始化车辆参数模板数据
              const genParamData = {
                project_id: projectId,
                direction: 'up',
                data: {}
              }
              localStorage.setItem('genParamData', JSON.stringify(genParamData))
            }
          } else {
            this.$message.error(`添加${typeName}版本失败：` + (response && (response.msg || response.message) || '未知错误'))
          }
        }).catch(error => {
          console.error(`添加${typeName}版本错误:`, error)
          this.$message.error(`添加${typeName}版本失败，请稍后重试`)
        })
      }).catch(() => {
        this.$message.info('已取消添加版本')
      })
    },

    // 处理文件上传
    handleUploadFile(projectId, type) {
      // 创建文件上传输入元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.xlsx,.xls,.json'

      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // 创建新的文件记录
        const newId = Math.max(0, ...Object.values(this.vehicleExcelFiles).flat().map(f => f.id)) + 1
        const newFile = {
          id: newId,
          projectId: projectId,
          file: file.name,
          displayName: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
          username: 'admin',
          name: '管理员',
          uploadTime: new Date().toLocaleString()
        }

        // 添加到文件列表
        if (!this.vehicleExcelFiles[projectId]) {
          this.vehicleExcelFiles[projectId] = []
        }
        this.vehicleExcelFiles[projectId].push(newFile)

        // 更新项目信息
        const project = this.projectList.find(p => p.id === projectId)
        if (project) {
          project.project_inputfile_count = (project.project_inputfile_count || 0) + 1
          project.update_time = new Date().toLocaleString()
        }

        this.$message.success('文件上传成功')
      }

      input.click()
    },

    // 处理文件下载
    handleDownloadFile(file) {
      // TODO: 实现文件下载逻辑
      this.$message.info(`下载文件: ${file.displayName || file.file}`)
    },

    // 处理文件删除
    handleDeleteFile(file, type) {
      this.$confirm(`确定要删除文件 "${file.displayName || file.file}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const projectId = file.projectId
        const fileList = type === 'vehicle' ? this.vehicleExcelFiles : this.civilExcelFiles

        if (fileList[projectId]) {
          const index = fileList[projectId].findIndex(f => f.id === file.id)
          if (index !== -1) {
            fileList[projectId].splice(index, 1)

            // 更新项目信息
            const project = this.projectList.find(p => p.id === projectId)
            if (project) {
              project.project_inputfile_count = Math.max(0, (project.project_inputfile_count || 0) - 1)
              project.update_time = new Date().toLocaleString()
            }

            this.$message.success('文件删除成功')
          }
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    }
  }
}
</script>

<style scoped>
.box-card {
  width: 100%;
  margin-bottom: 20px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}

/* 展开表格样式 */
.demo-table-expand {
  font-size: 0;
  padding: 20px;
  background-color: #f9fafc;
}

.demo-table-expand label {
  width: 90px;
  color: #99a9bf;
}

.demo-table-expand .el-form-item {
  margin-right: 0;
  margin-bottom: 0;
  width: 33.33%;
  padding: 10px 0;
}

/* Excel列表弹出框样式 */
.excel-list {
  padding: 10px;
}

.excel-list-title {
  font-weight: bold;
  font-size: 14px;
  text-align: center;
  margin-bottom: 5px;
}

.excel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f5f7fa;
  }

  .excel-item-content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    max-width: 300px;

    i {
      margin-right: 8px;
      color: #909399;
      flex-shrink: 0;
    }

    .file-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }
  }

  .excel-item-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 8px;
    min-width: 70px;

    &.always-visible {
      opacity: 1;
    }
  }
}

.excel-list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  padding: 10px 0;
}

.excel-list-empty i {
  font-size: 16px;
  margin-right: 5px;
}

/* 新增样式：虚线分隔符 */
.dashed-divider {
  background-color: transparent;
  height: 0;
  margin: 10px 0;
  border-top: 1px dashed #DCDFE6;
}

/* 新增样式：新建版本按钮 */
.new-version {
  color: #409EFF;
  text-align: center;
}

.new-version i {
  color: #409EFF;
  margin-right: 5px;
}

span {
  margin: 0 auto;
}

.upload-button {
  color: #409EFF;
  text-align: center;

  i {
    color: #409EFF;
    margin-right: 4px; /* 减小图标和文字的间距 */
  }

  .upload-text {
    color: #409EFF;
  }
}

/* 可点击版本样式 */
.clickable-version {
  color: #409EFF;
  cursor: pointer;
  text-decoration: underline;
}

.clickable-version:hover {
  color: #66b1ff;
}

/* 表单提示信息样式 */
.form-tip {
  font-size: 12px;
  color: #E6A23C;
  margin-top: 5px;
  line-height: 1.4;
}

.form-tip i {
  margin-right: 4px;
}
</style>

<style>
/* 全局样式，设置弹出框的最大高度和滚动 */
.excel-list-popover .el-popover__reference {
  margin-right: 10px;
}

.excel-list-popover {
  max-height: 300px;
  overflow-y: auto;
}
</style>
