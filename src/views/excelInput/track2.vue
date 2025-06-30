<!-- 由于本人原以为track1的开发功能较少，于是这里写了个屎山代码，关于这部分，已经模块化到了：trackyuan的文件夹下 -->
<template>
  <div class="app-container">
    <!-- 返回按钮 -->
    <el-button
      style="margin-bottom: 15px"
      icon="el-icon-back"
      @click="goBack"
    >
      返回列表
    </el-button>

    <!-- 当前路径提示 -->
    <div v-if="selectedFile" class="current-path">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ selectedFile.displayName || selectedFile.file }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="activeFolder">{{ activeFolder }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="activeExcel">{{ activeExcel }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="activeSheet">{{ activeSheet }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="loading || apiLoading" class="loading-status">
      <i class="el-icon-loading" /> {{ apiLoading ? '正在处理API数据...' : '正在加载轨道数据...' }}
    </div>

    <!-- API同步状态 -->
    <el-alert
      v-if="syncStatus"
      :title="syncStatus"
      type="info"
      show-icon
      class="sync-status"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="loadError"
      title="数据加载错误"
      type="error"
      :description="loadError"
      show-icon
      class="error-alert"
    />

    <!-- 新建Excel弹窗 -->
    <el-dialog
      title="新增版本"
      :visible.sync="showNewExcelDialog"
      width="30%"
    >
      <el-form>
        <el-form-item label="文件名" required>
          <el-input
            v-model="newExcelName"
            placeholder="请输入文件名（无需后缀）"
            clearable
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showNewExcelDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!newExcelName"
          @click="confirmCreateExcel"
        >确认</el-button>
      </span>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      title="删除确认"
      :visible.sync="showDeleteConfirm"
      width="30%"
    >
      <span>确定要删除文件 <strong>{{ deleteTarget }}</strong> 吗？</span>
      <span slot="footer">
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button
          type="danger"
          @click="confirmDelete"
        >确认删除</el-button>
      </span>
    </el-dialog>

    <!-- 新增行表单对话框 -->
    <el-dialog
      :title="insertPosition >= 0 ? `在第${insertPosition+1}行后插入数据` : '添加新行数据'"
      :visible.sync="showRowDialog"
      width="50%"
    >
      <el-form
        ref="rowForm"
        :model="newRowData"
        label-width="180px"
        size="small"
        class="row-form"
      >
        <el-form-item
          v-for="(header, index) in currentHeaders"
          :key="index"
          :label="header.label"
          :prop="header.prop"
        >
          <el-input
            v-model="newRowData[header.prop]"
            :placeholder="'请输入' + header.label"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showRowDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRowForm">确认</el-button>
      </span>
    </el-dialog>

    <!-- 运行配置文件特有的计算对话框 -->
    <el-dialog
      title="计算功能"
      :visible.sync="calculationDialogVisible"
      width="60%"
    >
      <div class="calculation-panel-dialog">
        <div class="calculation-header">
          <h3>选择计算类型</h3>
          <p v-if="selectedCalculationRow">正在计算: {{ selectedCalculationRow.data.departureStation }} 到 {{ selectedCalculationRow.data.arrivalStation }}</p>
        </div>
        <el-divider></el-divider>

        <div class="calculation-buttons">
          <div class="calculation-item">
            <el-button
              type="primary"
              @click="calculateTravelTimeForRow"
              :disabled="calculationState.travelTime.status === 'warning'"
            >
              计算通行时间
            </el-button>

            <div v-if="calculationState.travelTime.status" class="progress-wrapper">
              <el-progress
                type="circle"
                :percentage="calculationState.travelTime.percentage"
                :status="calculationState.travelTime.status"
              ></el-progress>
            </div>

            <div v-if="calculationResults.travelTime" class="result-info">
              <p><strong>结果:</strong> {{ calculationResults.travelTime.time }}</p>
              <p>{{ calculationResults.travelTime.details }}</p>
            </div>

            <div v-if="calculationResults.travelTime" class="result-actions">
              <el-button size="small" @click="exportResultToExcel('travelTime')">输出Excel文件</el-button>
              <el-button size="small" @click="exportResultToImage('travelTime')">图片文件</el-button>
            </div>
          </div>

          <div class="calculation-item">
            <el-button
              type="primary"
              @click="calculateMinHeadwayForRow"
              :disabled="!calculationState.minHeadway.enabled || calculationState.minHeadway.status === 'warning'"
            >
              计算最小间隔时间
            </el-button>

            <div v-if="calculationState.minHeadway.status" class="progress-wrapper">
              <el-progress
                type="circle"
                :percentage="calculationState.minHeadway.percentage"
                :status="calculationState.minHeadway.status"
              ></el-progress>
            </div>

            <div v-if="calculationResults.minHeadway" class="result-info">
              <p><strong>结果:</strong> {{ calculationResults.minHeadway.time }}</p>
              <p>{{ calculationResults.minHeadway.details }}</p>
            </div>

            <div v-if="calculationResults.minHeadway" class="result-actions">
              <el-button size="small" @click="exportResultToExcel('minHeadway')">输出Excel文件</el-button>
              <el-button size="small" @click="exportResultToImage('minHeadway')">图片文件</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 主体内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧侧边栏 -->
      <el-col :span="6">
        <el-card class="folder-sidebar">
          <div slot="header" class="clearfix">
            <div class="folder-header">
              <span>文件夹</span>
              <div class="search-wrapper">
                <el-input
                  v-model="filterText"
                  size="small"
                  placeholder="搜索文件或文件夹"
                  prefix-icon="el-icon-search"
                  clearable
                  @clear="clearFilter"
                />
              </div>
            </div>
          </div>
          <!-- 使用el-menu代替el-tree -->
          <el-menu
            :default-active="activeMenuIndex"
            class="folder-menu"
            :default-openeds="expandedFolders"
            @select="handleMenuSelect"
          >
            <template v-for="folder in folderTreeData">
              <el-submenu
                :key="folder.id"
                :index="folder.id"
                :popper-append-to-body="false"
                @mouseenter.native="handleMenuHover(folder.id, true)"
                @mouseleave.native="handleMenuHover(folder.id, false)"
              >
                <template slot="title">
                  <div class="folder-title" @click.stop="handleMenuClick(folder.id, $event)">
                    <i class="el-icon-folder" />
                    <span class="folder-name">{{ folder.label }}</span>
                    <i
                      v-if="isPermanentlyExpanded(folder.id)"
                      class="el-icon-lock"
                      style="margin-left: auto; font-size: 12px; color: #909399;"
                    />
                  </div>
                </template>
                <!-- 文件列表 -->
                <el-menu-item
                  v-for="file in folder.children"
                  :key="file.id"
                  :index="file.id"
                >
                  <i class="el-icon-document" />
                  <span>{{ file.label }}</span>
                </el-menu-item>
              </el-submenu>
            </template>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="18" class="right-panel">
        <div class="right-container">
          <!-- 按钮操作区域 -->
          <div class="excel-control">
            <!-- 移除Excel文件选择下拉框 -->
            <div v-if="activeExcel" class="excel-header">
              <h3 class="excel-title">当前文件: {{ activeExcel }}</h3>
            </div>

            <!-- 操作按钮区域 - 修改v-if条件 -->
            <div class="button-group">
              <!-- 添加查看所有文件下拉菜单 -->
              <el-dropdown trigger="click" @command="handleExcelSelect">
                <el-button type="info">
                  查看所有文件 <i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-for="fileName in Object.keys(excelFiles)"
                    :key="fileName"
                    :command="fileName"
                    :disabled="fileName === activeExcel"
                  >
                    {{ fileName }}
                    <span v-if="fileName === 'api_data.xls'" style="color: #67C23A; margin-left: 5px;">[API]</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>

              <el-button @click="showNewExcelDialog = true">新增版本</el-button>

              <!-- 只有非running_profile文件才显示删除和返回文件夹按钮 -->
              <template v-if="!isRunningProfileFile()">
                <el-button
                  type="danger"
                  :disabled="!activeExcel"
                  @click="showDeleteConfirm = true"
                >删除当前文件</el-button>

                <!-- 返回上层按钮 -->
                <el-button
                  type="info"
                  icon="el-icon-back"
                  @click="backToFolderList"
                >
                  返回文件夹
                </el-button>
              </template>

              <!-- API操作按钮 -->
              <el-button
                type="primary"
                :loading="apiLoading"
                @click="isRunningProfileFile() ? getRunningProfileFromAPI() : fetchTrackRecords()"
              >
                从API加载
              </el-button>
              <el-button
                type="success"
                :loading="apiLoading"
                :disabled="!activeExcel || (activeSheet !== 'Tracks' && activeSheet !== 'Running list') || !dataModified"
                @click="isRunningProfileFile() ? saveRunningProfileToAPI() : saveTrackToApi()"
              >
                {{ dataModified ? '保存到API' : '未进行数据修改' }}
              </el-button>

              <!-- 运行配置文件特有的全局计算按钮，仅在Running list工作表显示 -->
              <el-dropdown
                v-if="isRunningProfileFile() && activeSheet === 'Running list'"
                trigger="click"
                @command="handleCalculateCommand"
              >
                <el-button type="warning" :loading="calculatingAllRows">
                  计算所有行 <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="travelTime">计算通行时间</el-dropdown-item>
                  <el-dropdown-item command="minHeadway" :disabled="!globalTravelTimeCalculated">计算最小间隔时间</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>

            <!-- 运行配置文件特有的计算面板 -->
            <div v-if="isRunningProfileFile() && showCalculation" class="calculation-panel">
              <div class="calculation-header">
                <h3>计算功能</h3>
              </div>
              <el-divider></el-divider>

              <div class="calculation-buttons">
                <div class="calculation-item">
                  <el-button
                    type="primary"
                    @click="calculateTravelTime"
                    :disabled="calculationState.travelTime.status === 'warning'"
                  >
                    计算通行时间
                  </el-button>

                  <div v-if="calculationState.travelTime.status" class="progress-wrapper">
                    <el-progress
                      type="circle"
                      :percentage="calculationState.travelTime.percentage"
                      :status="calculationState.travelTime.status"
                    ></el-progress>
                  </div>

                  <div v-if="calculationResults.travelTime" class="result-actions">
                    <el-button size="small" @click="exportResultToExcel('travelTime')">输出Excel文件</el-button>
                    <el-button size="small" @click="exportResultToImage('travelTime')">图片文件</el-button>
                  </div>
                </div>

                <div class="calculation-item">
                  <el-button
                    type="primary"
                    @click="calculateMinHeadway"
                    :disabled="!calculationState.minHeadway.enabled || calculationState.minHeadway.status === 'warning'"
                  >
                    计算最小间隔时间
                  </el-button>

                  <div v-if="calculationState.minHeadway.status" class="progress-wrapper">
                    <el-progress
                      type="circle"
                      :percentage="calculationState.minHeadway.percentage"
                      :status="calculationState.minHeadway.status"
                    ></el-progress>
                  </div>

                  <div v-if="calculationResults.minHeadway" class="result-actions">
                    <el-button size="small" @click="exportResultToExcel('minHeadway')">输出Excel文件</el-button>
                    <el-button size="small" @click="exportResultToImage('minHeadway')">图片文件</el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 删除未选择文件时显示的从API加载按钮区域 -->
          </div>

          <!-- Sheet选择器重构 -->
          <div v-if="activeExcel" class="sheet-toolbar">
            <div class="toolbar-left">
              <span class="toolbar-label">选择工作表</span>
              <el-select
                v-model="activeSheet"
                placeholder="请选择工作表"
                size="small"
                class="sheet-select"
                @change="handleSheetChange"
              >
                <el-option
                  v-for="(sheet, name) in currentSheets"
                  :key="name"
                  :label="getSheetDisplayName(name)"
                  :value="name"
                />
              </el-select>
            </div>
          </div>

          <!-- 动态表格 -->
          <div
            v-for="(sheet, name) in currentSheets"
            v-show="activeSheet === name"
            :key="name"
          >
            <!-- Block description表格特有的多级表头结构 -->
            <template v-if="activeSheet === 'Block description'">
              <el-table
                :data="sheet.data"
                border
                style="width: 100%; margin-top: 20px"
                :cell-class-name="cellClassName"
              >
                <!-- 常规列 -->
                <el-table-column
                  v-for="header in sheet.headers.slice(0, 5)"
                  :key="header.prop"
                  :prop="header.prop"
                  :label="header.label"
                  :min-width="getColumnMinWidth(header.prop)"
                  align="center"
                >
                  <template #default="scope">
                    <el-tooltip :content="String(scope.row[header.prop] || '')" placement="top" :disabled="!shouldShowTooltip(scope.row[header.prop])">
                      <el-input
                        v-model="scope.row[header.prop]"
                        :placeholder="isFieldDisabled(header.prop, activeSheet) ? '' : '请输入内容'"
                        :disabled="isFieldDisabled(header.prop, activeSheet)"
                        class="cell-input text-center"
                        @input="handleInputChange(header.prop, scope.row, scope.$index)"
                      />
                    </el-tooltip>
                  </template>
                </el-table-column>

                <!-- Sub Block 分组 -->
                <el-table-column label="Sub Block" align="center">
                  <el-table-column
                    prop="SubBlock_Start"
                    label="Start_KP"
                    :min-width="getColumnMinWidth('SubBlock_Start')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.SubBlock_Start || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_Start)">
                        <el-input
                          v-model="scope.row.SubBlock_Start"
                          :placeholder="isFieldDisabled('SubBlock_Start', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('SubBlock_Start', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('SubBlock_Start', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="SubBlock_End"
                    label="End"
                    :min-width="getColumnMinWidth('SubBlock_End')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.SubBlock_End || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_End)">
                        <el-input
                          v-model="scope.row.SubBlock_End"
                          :placeholder="isFieldDisabled('SubBlock_End', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('SubBlock_End', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('SubBlock_End', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="Track2"
                    label="Track2"
                    :min-width="getColumnMinWidth('Track2')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.Track2 || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Track2)">
                        <el-input
                          v-model="scope.row.Track2"
                          :placeholder="isFieldDisabled('Track2', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('Track2', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('Track2', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="KP_correction"
                    label="KP correction"
                    :min-width="getColumnMinWidth('KP_correction')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.KP_correction || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.KP_correction)">
                        <el-input
                          v-model="scope.row.KP_correction"
                          :placeholder="isFieldDisabled('KP_correction', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('KP_correction', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('KP_correction', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="SubBlock_StartDistance"
                    label="Start distance"
                    :min-width="getColumnMinWidth('SubBlock_StartDistance')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.SubBlock_StartDistance || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_StartDistance)">
                        <el-input
                          v-model="scope.row.SubBlock_StartDistance"
                          :placeholder="isFieldDisabled('SubBlock_StartDistance', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('SubBlock_StartDistance', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('SubBlock_StartDistance', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="SubBlock_Track"
                    label="Track"
                    :min-width="getColumnMinWidth('SubBlock_Track')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.SubBlock_Track || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.SubBlock_Track)">
                        <el-input
                          v-model="scope.row.SubBlock_Track"
                          :placeholder="isFieldDisabled('SubBlock_Track', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('SubBlock_Track', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('SubBlock_Track', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table-column>

                <!-- overlap分组 -->
                <el-table-column label="overlap" align="center">
                  <el-table-column
                    prop="Overlap_Value"
                    label="Value"
                    :min-width="getColumnMinWidth('Overlap_Value')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.Overlap_Value || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Overlap_Value)">
                        <el-input
                          v-model="scope.row.Overlap_Value"
                          :placeholder="isFieldDisabled('Overlap_Value', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('Overlap_Value', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('Overlap_Value', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="Overlap_Track"
                    label="Track"
                    :min-width="getColumnMinWidth('Overlap_Track')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.Overlap_Track || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Overlap_Track)">
                        <el-input
                          v-model="scope.row.Overlap_Track"
                          :placeholder="isFieldDisabled('Overlap_Track', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('Overlap_Track', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('Overlap_Track', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="Overlap_Sens"
                    label="Sens"
                    :min-width="getColumnMinWidth('Overlap_Sens')"
                    align="center"
                  >
                    <template #default="scope">
                      <el-tooltip :content="String(scope.row.Overlap_Sens || '')" placement="top" :disabled="!shouldShowTooltip(scope.row.Overlap_Sens)">
                        <el-input
                          v-model="scope.row.Overlap_Sens"
                          :placeholder="isFieldDisabled('Overlap_Sens', activeSheet) ? '' : '请输入内容'"
                          :disabled="isFieldDisabled('Overlap_Sens', activeSheet)"
                          class="cell-input text-center"
                          @input="handleInputChange('Overlap_Sens', scope.row, scope.$index)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table-column>

                <!-- 操作列 -->
                <el-table-column label="操作" width="230" align="center">
                  <template #default="scope">
                    <div class="operation-buttons">
                      <el-button
                        size="mini"
                        type="primary"
                        icon="el-icon-plus"
                        class="insert-btn"
                        @click="handleInsertRow(scope.$index)"
                      >下行插入</el-button>
                      <el-button
                        size="mini"
                        type="danger"
                        @click="handleDeleteRow(scope.$index)"
                      >删除</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </template>
            <!-- 常规表格结构(无分组) -->
            <template v-else>
              <el-table
                :data="sheet.data"
                border
                style="width: 100%; margin-top: 20px"
                :cell-class-name="cellClassName"
              >
                <el-table-column
                  v-for="(header, index) in sheet.headers"
                  :key="index"
                  :prop="header.prop"
                  :label="header.label"
                  :min-width="getColumnMinWidth(header.prop)"
                  align="center"
                >
                  <template #default="scope">
                    <el-tooltip :content="String(scope.row[header.prop] || '')" placement="top" :disabled="!shouldShowTooltip(scope.row[header.prop])">
                      <el-input
                        v-model="scope.row[header.prop]"
                        :placeholder="isFieldDisabled(header.prop, activeSheet) ? '' : '请输入内容'"
                        :disabled="isFieldDisabled(header.prop, activeSheet)"
                        class="cell-input text-center"
                        @input="handleInputChange(header.prop, scope.row, scope.$index)"
                      />
                    </el-tooltip>
                  </template>
                </el-table-column>

                <el-table-column v-if="activeSheet !== 'Gen. Param.'" label="操作" width="230" align="center">
                  <template #default="scope">
                    <div class="operation-buttons">
                      <!-- 只在 Running list 工作表中显示计算按钮 -->
                      <el-button
                        v-if="isRunningProfileFile() && activeSheet === 'Running list'"
                        size="mini"
                        :type="getCalculationButtonType(scope.row)"
                        :loading="isCalculating(scope.row)"
                        @click="handleSingleRowCalculate(scope.row, scope.$index)"
                      >
                        {{ getCalculationButtonText(scope.row) }}
                      </el-button>
                      <el-button
                        size="mini"
                        type="primary"
                        icon="el-icon-plus"
                        class="insert-btn"
                        @click="handleInsertRow(scope.$index)"
                      >下行插入</el-button>
                      <el-button
                        size="mini"
                        type="danger"
                        @click="handleDeleteRow(scope.$index)"
                      >删除</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </div>

          <!-- 导出按钮 -->
          <div v-if="activeExcel" class="export-control">
            <el-button
              :loading="downloadLoading"
              type="primary"
              @click="handleDownload"
            >
              保存
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
                    </template>

<script>
import * as trackApi from '@/api/track1' // 导入分离出来的API方法
import * as runningProfileApi from '@/api/runningprofile' // 导入Running Profile API方法

export default {
  data() {
    return {
      // 数据状态
      loading: false,
      loadError: null,
      trackData: null, // 存储加载的JSON数据
      fileId: null, // 从路由参数获取的文件ID
      selectedFile: null, // 从localStorage获取的文件信息

      excelFiles: {
        'track_down.xls': this.createDefaultSheets(),
        'track_down-80.xls': this.createDefaultSheets()
      },
      activeExcel: null,
      activeSheet: null,
      showNewExcelDialog: false,
      newExcelName: '',
      downloadLoading: false,
      showDeleteConfirm: false,
      deleteTarget: '',

      // API相关
      apiLoading: false,
      dataModified: false, // 添加数据修改标记
      syncStatus: '',
      trackRecords: [], // 存储从API获取的记录
      authToken: null, // 存储认证token

      // 文件夹和文件管理
      activeFolder: null,
      availableFolders: [
        'Track',
        //'Block_description',
        'Running_profile',
        //'Block_perturbation_drawing',
        //'Block_perturbed_headway',
        //'Constraint',
        //'Headway_2trains_tool',
        //'Interstation',
        //'Mission',
        //'Parameters',
        //'Station'
      ],
      folderFiles: {
        'Track': [
          { name: 'track_up.xls', displayName: 'track_up.xls' },
          { name: 'track_down.xls', displayName: 'track_down.xls' },
          { name: 'track_down-80.xls', displayName: 'track_down-80.xls' }
        ],
        /*
        'Block_description': [
          { name: 'block_desc.xls', displayName: 'block_desc.xls' }
        ],
        */
        'Running_profile': [
          { name: 'running_profile.xls', displayName: 'running_profile.xls' }
        ],
        /*
        'Station': [
          { name: 'station_data.xls', displayName: 'station_data.xls' }
        ],
        'Block_perturbation_drawing': [
          { name: 'block_pert_drawing.xls', displayName: 'block_pert_drawing.xls' }
        ],
        'Block_perturbed_headway': [
          { name: 'block_pert_headway.xls', displayName: 'block_pert_headway.xls' }
        ],
        'Constraint': [
          { name: 'constraint.xls', displayName: 'constraint.xls' }
        ],
        'Headway_2trains_tool': [
          { name: 'headway_tool.xls', displayName: 'headway_tool.xls' }
        ],
        'Interstation': [
          { name: 'interstation.xls', displayName: 'interstation.xls' }
        ],
        'Mission': [
          { name: 'mission.xls', displayName: 'mission.xls' }
        ],
        'Parameters': [
          { name: 'parameters.xls', displayName: 'parameters.xls' }
        ]
        */
      },
      folderExcelFiles: [],
      folderTreeData: [],
      filterText: '',
      activeMenuIndex: 'Track',
      expandedFolders: [],
      permanentlyExpandedFolders: [],
      showRowDialog: false,
      newRowData: {},
      currentHeaders: [],
      insertPosition: -1, // -1表示在末尾添加，否则表示在指定位置后添加

      // 运行配置文件特有的计算功能相关状态
      showCalculation: false, // 是否显示计算面板
      calculationState: {
        travelTime: {
          status: '', // 可以是 'calculating', 'success', 'error'
          percentage: 0,
          enabled: true
        },
        minHeadway: {
          status: '', // 可以是 'calculating', 'success', 'error'
          percentage: 0,
          enabled: false // 初始禁用，只有计算通行时间完成后才能启用
        }
      },
      calculationResults: {
        travelTime: null,
        minHeadway: null
      },

      // 选中的计算行
      selectedCalculationRow: null,

      // 添加新的数据属性
      calculationDialogVisible: false,
      calculatedRows: {}, // 记录每行的计算状态, 格式: { rowIndex: { calculated: true, calculating: false } }
      calculatingAllRows: false, // 是否正在进行全局计算
      globalTravelTimeCalculated: false, // 是否已计算所有行的通行时间
    }
  },

  computed: {
    currentSheets() {
      return this.activeExcel && this.excelFiles[this.activeExcel]
        ? this.excelFiles[this.activeExcel]
        : {}
    }
  },

  watch: {
    showDeleteConfirm(val) {
      if (val) this.deleteTarget = this.activeExcel
    },

    filterText(val) {
      this.$nextTick(() => {
        this.applyMenuFilter(val)
      })
    }
  },

  created() {
    // 从路由参数获取文件ID
    this.fileId = this.$route.params.id

    // 从localStorage获取选择的文件信息
    const fileInfo = localStorage.getItem('selectedTrackFile')
    if (fileInfo) {
      this.selectedFile = JSON.parse(fileInfo)
      document.title = `Track详情 - ${this.selectedFile.displayName || this.selectedFile.file}`
    }

    // 初始化树形数据
    this.initFolderTreeData()
    this.loadTrackData()
    // 已移除console.log语句
  },

  async mounted() {
    // 尝试获取token
    await this.initAuthToken()
  },

  methods: {
    // 返回到列表页面
    goBack() {
      this.$router.push('/excelInput/project')
    },

    // 初始化认证Token
    async initAuthToken() {
      // 由于不需要实际的token获取，直接返回成功
      this.syncStatus = ''
      return true
    },

    // 从API获取轨道记录
    async fetchTrackRecords() {
      this.apiLoading = true
      this.syncStatus = '正在从API加载轨道数据...'

      try {
        const data = await trackApi.getTracks(this.selectedFile?.projectId || 1, 'down')
        this.trackRecords = data
        this.syncStatus = `成功加载了 ${data.length} 条轨道记录`
        this.convertApiDataToExcel()
        this.$message.success('数据已从API加载并创建api_data.xls文件，可在"查看所有文件"下拉菜单中找到')

        // 数据加载完成后重置修改标记
        this.dataModified = false
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$message.warning('token已过期，正在尝试获取新token...')
          const success = await this.initAuthToken()
          if (success) {
            this.apiLoading = false
            return this.fetchTrackRecords()
          }
        }
        this.syncStatus = `API数据加载失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 添加从API获取Running Profile数据的方法
    async getRunningProfileFromAPI() {
      this.apiLoading = true
      this.syncStatus = '正在从API加载运行配置数据...'

      try {
        const response = await runningProfileApi.getRunningList(this.selectedFile?.projectId || 1, 'down')
        const data = response.data || [] // 确保data是一个数组

        this.syncStatus = `成功加载了 ${data.length} 条运行配置记录`

        // 创建 Running list 工作表
        const runningListSheet = {
          headers: [
            { prop: 'departureStation', label: 'Departure Station name' },
            { prop: 'departureDistance', label: 'Departure Station Distance' },
            { prop: 'arrivalStation', label: 'Arrival Station name' },
            { prop: 'arrivalDistance', label: 'Arrival Station Distance' },
            { prop: 'track', label: 'Track' },
            { prop: 'train', label: 'Train' },
            { prop: 'trainLoad', label: 'train load [0 1]' },
            { prop: 'stationStopTime', label: 'Station Stop Time' }
          ],
          data: data.length > 0 ? data.map(item => ({
            departureStation: item.departure_station_name,
            departureDistance: item.departure_station_distance,
            arrivalStation: item.arrival_station_name,
            arrivalDistance: item.arrival_station_distance,
            track: item.track,
            train: item.train,
            trainLoad: item.train_load === true ? 1 : 0, // 将布尔值转换为数值1或0
            stationStopTime: item.station_stop_time || ''
          })) : [] // 如果data为空，则设置为空数组
        }

        // 更新 excelFiles
        this.$set(this.excelFiles, 'api_running_profile.xls', {
          'Running list': runningListSheet
        })

        this.$message.success('可在"查看所有文件"下拉菜单中找到')

        // 重置数据修改标记
        this.dataModified = false
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$message.warning('token已过期，正在尝试获取新token...')
          const success = await this.initAuthToken()
          if (success) {
            this.apiLoading = false
            return this.getRunningProfileFromAPI()
          }
        }
        this.syncStatus = `API数据加载失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 将API数据转换为Excel格式
    convertApiDataToExcel() {
      if (!this.trackRecords || this.trackRecords.length === 0) {
        return
      }

      try {
        // 创建数据工作表
        const apiExcel = this.createDefaultSheets()

        // 填充Tracks工作表数据
        apiExcel['Tracks'].data = this.trackRecords.map(record => {
          if (!record) return null
          return {
            Track_ID_before_jump: record.id || '',
            KP_before_jump: record.kp_before_jump || '',
            KP_after_jump: record.kp_after_jump || '',
            Track_ID_after_jump: record.if_after_jump || '',
            Correction_applied_to_KP: 0,
            Distance_from_track_origin_to_jump_point: '',
            Distance: 0
          }
        }).filter(Boolean) // 过滤掉null值

        // 填充Gen. Param.工作表数据
        if (this.trackRecords.length > 0 && this.trackRecords[0]) {
          const direction = this.trackRecords[0].direction || 1
          apiExcel['Gen. Param.'].data = [
            {
              paramName: 'Direction',
              value: direction,
              description: '轨道方向'
            }
          ]
        }

        // 保存到excelFiles
        this.$set(this.excelFiles, 'api_data.xls', apiExcel)

        // 如果没有活动的Excel，设置此Excel为活动
        if (!this.activeExcel) {
          this.activeExcel = 'api_data.xls'
          this.activeSheet = 'Tracks'
        }
      } catch (error) {
        this.$message.error('API数据转换失败: ' + error.message)
      }
    },

    // 保存数据到API
    async saveTrackToApi() {
      if (!this.activeExcel || !this.activeSheet || this.activeSheet !== 'Tracks') {
        this.$message.warning('请先选择Tracks工作表')
        return
      }

      // 检查数据是否被修改
      if (!this.dataModified) {
        this.$message.info('未进行数据修改')
        return
      }

      this.apiLoading = true
      this.syncStatus = '正在保存数据到API...'

      try {
        const tracksData = this.currentSheets['Tracks'].data
        if (!tracksData || !Array.isArray(tracksData)) {
          throw new Error('无效的轨道数据')
        }

        const genParamSheet = this.excelFiles[this.activeExcel]['Gen. Param.']
        if (!genParamSheet || !genParamSheet.data) {
          throw new Error('无效的Gen. Param.数据')
        }

        const directionParam = genParamSheet.data.find(item => item && item.paramName === 'Direction')
        const directionValue = directionParam ? Number(directionParam.value) || 1 : 1
        // 将数字类型的direction转换为字符串类型（1='down', 0='up'）
        const direction = directionValue === 0 ? 'up' : 'down'

        // 使用API保存数据
        await trackApi.saveTracks(tracksData.map(track => ({
          id: track.id || 0,
          track_id_before_jump: track.Track_ID_before_jump,
          kp_before_jump: Number(track.KP_before_jump),
          kp_after_jump: Number(track.KP_after_jump),
          track_id_after_jump: track.Track_ID_after_jump,
          jump_length: Number(track.Jump_length || 0),
          correction_applied_to_kp: Number(track.Correction_applied_to_KP || 0),
          distance_from_origin: Number(track.Distance_from_track_origin_to_jump_point || 0),
          project_id: this.selectedFile?.projectId || 1,
          direction: direction
        })))

        // 成功保存后重置修改标记
        this.dataModified = false
        this.$message.success('数据保存成功')
        this.syncStatus = '数据保存成功'
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$message.warning('token已过期，正在尝试获取新token...')
          const success = await this.initAuthToken()
          if (success) {
            this.apiLoading = false
            return this.saveTrackToApi()
          }
        }
        this.syncStatus = `API数据保存失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 添加保存Running Profile数据到API的方法
    async saveRunningProfileToAPI() {
      if (!this.activeExcel || !this.activeSheet || this.activeSheet !== 'Running list') {
        this.$message.warning('请先选择Running list工作表')
        return
      }

      // 检查数据是否被修改
      if (!this.dataModified) {
        this.$message.info('未进行数据修改')
        return
      }

      this.apiLoading = true
      this.syncStatus = '正在保存运行配置数据到API...'

      try {
        const runningListData = this.currentSheets['Running list'].data
        if (!runningListData || !Array.isArray(runningListData)) {
          throw new Error('无效的运行配置数据')
        }

        // 准备API请求数据 - 将数据包装成后端期望的格式
        const requestData = {
          project_id: this.selectedFile?.projectId || 1,
          direction: 'down', // 默认方向
          records: runningListData.map(item => ({
            id: item.id || 0,
            project_id: this.selectedFile?.projectId || 1,
            direction: 'down', // 修改为字符串类型，与API要求匹配
            min_version: 1,
            max_version: 1,
            profile_name: 'Default Profile',
            departure_station_name: item.departureStation,
            departure_station_distance: Number(item.departureDistance),
            arrival_station_name: item.arrivalStation,
            arrival_station_distance: Number(item.arrivalDistance),
            performance_objective: 0,
            safe_visibility: 0,
            functional_visibility: 0,
            perf: 0,
            limit_visibility: 0,
            perf2: 0,
            track: item.track,
            train: item.train,
            train_load: item.trainLoad === true || item.trainLoad === 'true' || item.trainLoad === 1,
            station_stop_time: item.stationStopTime || '',
            profile_type_1: 0,
            runing_profile_1: 0
          }))
        }

        // 使用API保存数据
        await runningProfileApi.saveRunningList(requestData)

        // 成功保存后重置修改标记
        this.dataModified = false
        this.$message.success('运行配置数据保存成功')
        this.syncStatus = '运行配置数据保存成功'
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$message.warning('token已过期，正在尝试获取新token...')
          const success = await this.initAuthToken()
          if (success) {
            this.apiLoading = false
            return this.saveRunningProfileToAPI()
          }
        }
        this.syncStatus = `API数据保存失败: ${error.message || '未知错误'}`
        this.$message.error(this.syncStatus)
      } finally {
        this.apiLoading = false
      }
    },

    // 从API删除轨道记录
    async deleteTrackFromApi(id) {
      if (!id) return false

      try {
        await trackApi.deleteTrackFromApi(id)
        this.$message.success(`成功删除记录 ID: ${id}`)
        return true
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.$message.warning('token已过期，正在尝试获取新token...')
          const success = await this.initAuthToken()
          if (success) {
            return this.deleteTrackFromApi(id)
          }
        }
        this.$message.error(`删除记录失败: ${error.message || '未知错误'}`)
        return false
      }
    },

    async loadTrackData() {
      if (!this.activeFolder) return

      this.loading = true
      this.loadError = null

      try {
        // 如果从列表页面直接选择了特定文件，我们加载这个文件
        if (this.selectedFile && this.selectedFile.file && !this.activeExcel) {
          const originalFileName = this.selectedFile.file.replace('.json', '.xls')

          // 默认进入Track文件夹
          this.activeFolder = 'Track'
          this.folderExcelFiles = this.folderFiles['Track'] || []

          // 加载指定的文件
          await this.loadExcelFile(originalFileName)
        }
      } catch (error) {
        this.loadError = `加载数据失败: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    // 添加自增ID字段到表格数据
    addAutoIncrementIds(data, sheetName) {
      if (!data || !Array.isArray(data)) return data

      // 如果是Block description，直接使用自增ID，不从已有数据中获取
      if (sheetName === 'Block description') {
        return data.map((row, index) => ({
          ...row,
          id: index + 1
        }))
      }

      return data.map((row, index) => ({
        ...row,
        id: index + 1
      }))
    },

    populateExcelData(rawData) {
      // 将处理后的数据填充到excelFiles对象中
      if (rawData) {
        // 转换数据
        const transformedData = this.transformJSONData(rawData)

        // 填充到Excel文件中
        Object.keys(transformedData).forEach(sheetName => {
          if (this.excelFiles[this.activeExcel][sheetName]) {
            // 添加自增ID
            if (['Tracks', 'Gradient', 'Stations', 'PSR', 'Block description'].includes(sheetName)) {
              transformedData[sheetName] = this.addAutoIncrementIds(transformedData[sheetName], sheetName)
            }

            this.excelFiles[this.activeExcel][sheetName].data = transformedData[sheetName]

            // 只为Tracks工作表添加一行空行，其他工作表不添加
            if (sheetName === 'Tracks') {
              const emptyRow = {}
              this.excelFiles[this.activeExcel][sheetName].headers.forEach(header => {
                emptyRow[header.prop] = ''
              })

              // 设置正确的自增ID
              const currentData = this.excelFiles[this.activeExcel][sheetName].data
              const maxId = currentData.length > 0
                ? Math.max(...currentData.map(row => parseInt(row.id) || 0))
                : 0
              emptyRow.id = maxId + 1

              this.excelFiles[this.activeExcel][sheetName].data.push(emptyRow)
            }
          }
        })

        // 数据加载完成后，计算Tracks表的相关字段
        if (this.activeExcel && this.excelFiles[this.activeExcel]['Tracks'] &&
            this.excelFiles[this.activeExcel]['Tracks'].data.length > 0) {
          const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
          this.activeSheet = 'Tracks' // 临时设置为Tracks表以便计算

          // 计算第一行的KP_before_jump值：=IF(E3="","",IF(ISTEXT(E3),E4,E3))
          // E3是表头的Track ID after jump(文本)，E4是第一行的Track ID after jump
          if (this.excelFiles[this.activeExcel]['Tracks'].data.length > 0) {
            const firstRow = this.excelFiles[this.activeExcel]['Tracks'].data[0]
            // 获取第一行的Track ID after jump
            const trackIdAfterJump = firstRow.Track_ID_after_jump

            // 应用公式：IF(E3="","",IF(ISTEXT(E3),E4,E3))
            // 因为E3是表头(Track ID after jump)，是文本，所以应该返回E4(Track_ID_after_jump)的值
            firstRow.Track_ID_before_jump = trackIdAfterJump || ''
          }

          // 计算从第二行开始的Track_ID_before_jump
          const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
          for (let i = 1; i < tracksData.length; i++) {
            // 其他行的Track_ID_before_jump等于上一行的Track_ID_after_jump
            const prevRow = tracksData[i - 1]
            const prevValue = prevRow.Track_ID_after_jump

            if (prevValue === '' || (typeof prevValue === 'string' && isNaN(prevValue))) {
              tracksData[i].Track_ID_before_jump = ''
            } else {
              tracksData[i].Track_ID_before_jump = prevValue
            }
          }

          // 计算所有行的Jump length
          for (let i = 0; i < this.excelFiles[this.activeExcel]['Tracks'].data.length; i++) {
            this.updateJumpLength(i)
          }

          // 计算所有行的Correction applied to KP
          this.updateCorrectionValues()

          // 计算所有行的Distance from track origin
          for (let i = 0; i < this.excelFiles[this.activeExcel]['Tracks'].data.length; i++) {
            this.updateDistanceFromOrigin(i)
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalActiveSheet
        }

        // 计算Gradient工作表的相关字段
        if (this.activeExcel && this.excelFiles[this.activeExcel]['Gradient'] &&
            this.excelFiles[this.activeExcel]['Gradient'].data.length > 0) {
          const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
          this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

          // 计算所有行的字段值
          for (let i = 0; i < this.excelFiles[this.activeExcel]['Gradient'].data.length; i++) {
            this.updateGradientT1(i)
            this.updateGradientT2(i)
            this.updateGradientTrack2(i)
            this.updateGradientKPCorrection(i)
            this.updateGradientDistance(i) // 添加Distance计算
            this.updateGradientSlopePermille(i) // 添加Slope_permille计算
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalActiveSheet
        }

        // 计算Stations工作表的相关字段
        if (this.activeExcel && this.excelFiles[this.activeExcel]['Stations'] &&
            this.excelFiles[this.activeExcel]['Stations'].data.length > 0) {
          const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
          this.activeSheet = 'Stations' // 临时设置为Stations表以便计算

          // 计算所有行的字段值 - 调整计算顺序
          for (let i = 0; i < this.excelFiles[this.activeExcel]['Stations'].data.length; i++) {
            this.updateStationsKPOfSSP(i) // 先计算KP_of_SSP
            this.updateStationsT1(i)
            this.updateStationsT2(i)
            this.updateStationsTrack1(i)
            this.updateStationsTrack2(i) // 添加Track2的计算
            this.updateStationsKPCorrection(i) // 添加KP_correction的计算
            this.updateStationsDistanceOfPFCenter(i) // 添加Distance_of_PF_center的计算
            this.updateStationsDistanceOfSSP(i) // 添加Distance_of_SSP的计算
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalActiveSheet
        }

        // 计算PSR工作表的相关字段
        if (this.activeExcel && this.excelFiles[this.activeExcel]['PSR'] &&
            this.excelFiles[this.activeExcel]['PSR'].data.length > 0) {
          const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
          this.activeSheet = 'PSR' // 临时设置为PSR表以便计算

          // 计算所有行的T1和T2值
          for (let i = 0; i < this.excelFiles[this.activeExcel]['PSR'].data.length; i++) {
            this.updatePSRT1(i)
            this.updatePSRT2(i)
          }

          // 计算所有行的Track2和PSR_ms值
          for (let i = 0; i < this.excelFiles[this.activeExcel]['PSR'].data.length; i++) {
            this.updatePSRTrack2(i)
            this.updatePSRMs(i)
          }

          // 计算所有行的KP_correction和Distance值
          for (let i = 0; i < this.excelFiles[this.activeExcel]['PSR'].data.length; i++) {
            this.updatePSRKPCorrection(i)
            this.updatePSRDistance(i)
          }

          // 恢复原始选中的工作表
          this.activeSheet = originalActiveSheet
        }

        // 计算Block description工作表的相关字段
        if (this.activeExcel && this.excelFiles[this.activeExcel]['Block description'] &&
            this.excelFiles[this.activeExcel]['Block description'].data.length > 0) {
          this.updateAllBlockDescriptionFields()
        }

        // 这里不需要重置数据修改标记，因为数据是从文件加载的，不是从API加载的
        // 从API加载数据时，应该在相应的API加载方法中重置标记
      }
    },

    // 转换JSON数据为前端所需格式
    transformJSONData(jsonData) {
      const result = {}

      Object.keys(jsonData).forEach(key => {
        if (key === 'Gradient' && Array.isArray(jsonData[key])) {
          result[key] = jsonData[key].map(item => ({
            T1: '',
            T2: '',
            Track1: '',
            KP: item[0],
            slope: item[1],
            Track2: '',
            KP_correction: '',
            Distance: '',
            Slope_permille: ''
          }))
        } else if (key === 'Stations' && Array.isArray(jsonData[key])) {
          // 使用Stations作为前端工作表名，只接受JSON中的Stations键名
          result['Stations'] = jsonData[key].map(item => ({
            T1: '', // 预留空值，以后可添加计算逻辑
            T2: '', // 预留空值，以后可添加计算逻辑
            Track1: '', // 预留空值，以后可添加计算逻辑
            KP_of_platform_center: item[0],
            Name_of_station: item[1],
            KP_of_SSP: item[2],
            Track2: '', // 预留空值，以后可添加计算逻辑
            KP_correction: '', // 预留空值，以后可添加计算逻辑
            Distance_of_PF_center: '', // 预留空值，以后可添加计算逻辑
            Distance_of_SSP: '' // 预留空值，以后可添加计算逻辑
          }))
        } else if (key === 'PSR' && Array.isArray(jsonData[key])) {
          result[key] = jsonData[key].map(item => ({
            T1: '',
            T2: '',
            Track1: '',
            KP: item[0], // 第一个元素对应KP (m)
            PSR: item[1], // 第二个元素对应PSR (km/h)
            Track2: '',
            KP_correction: '',
            Distance: '',
            PSR_ms: ''
          }))
        } else if (key === 'Tracks' && Array.isArray(jsonData[key])) {
          // 根据新的JSON数据顺序调整映射
          result[key] = jsonData[key].map(item => ({
            Track_ID_before_jump: '', // 将在populateExcelData中计算
            KP_before_jump: item[0], // 第一个元素是KP before jump(m)
            KP_after_jump: item[1], // 第二个元素是KP after jump(m)
            Track_ID_after_jump: item[2], // 第三个元素是Track ID after jump
            Distance_from_track_origin_to_jump_point: '',
            Jump_length: '',
            Correction_applied_to_KP: ''
          }))
        } else if (key === 'Unbridgeable gap' && Array.isArray(jsonData[key])) {
          result[key] = jsonData[key].map(item => ({
            KP_start: item[0],
            KP_end: item[1],
            Track_ID: item[2]
          }))
        } else if (key === 'Block description' && Array.isArray(jsonData[key])) {
          // 处理Block description数据
          result[key] = jsonData[key].map((item, index) => ({
            id: item[0] !== undefined ? item[0] : '',              // 第0位: id
            Start_T1: item[1] !== undefined ? item[1] : '',        // 第1位: Start_T1
            Start_T2: item[2] !== undefined ? item[2] : '',        // 第2位: Start_T2
            Rule: item[3] !== undefined ? item[3] : '',            // 第3位: Rule
            Timer: item[4] !== undefined ? item[4] : '',           // 第4位: Timer
            SubBlock_Start: item[5] !== undefined ? item[5] : '',  // 第5位: SubBlock > Start
            SubBlock_End: item[6] !== undefined ? item[6] : '',    // 第6位: SubBlock > End
            SubBlock_StartDistance: '',                            // 新字段：SubBlock > Start distance
            SubBlock_Track: item[7] !== undefined ? item[7] : '',  // 第7位: SubBlock > Track
            Overlap_Value: item[8] !== undefined ? item[8] : '',   // 第8位: overlap > Value
            Overlap_Track: item[9] !== undefined ? item[9] : '',   // 第9位: overlap > Track
            Overlap_Sens: item[10] !== undefined ? item[10] : ''   // 第10位: overlap > Sens
          }))
        } else if (key === 'Gen. Param.' && Array.isArray(jsonData[key])) {
          result[key] = jsonData[key].map(item => ({
            paramName: item[0],
            value: item[1]
          }))
        } else {
          // 处理其他情况
          result[key] = jsonData[key]
        }
      })

      return result
    },

    confirmCreateExcel() {
      const fullName = `${this.newExcelName}.xls`
      if (this.excelFiles[fullName]) {
        this.$message.error('文件名已存在')
        return
      }

      this.$set(this.excelFiles, fullName, this.createDefaultSheets())
      this.activeExcel = fullName

      // 默认选择第一个工作表
      const sheetNames = Object.keys(this.createDefaultSheets())
      this.activeSheet = sheetNames.length > 0 ? sheetNames[0] : null

      this.showNewExcelDialog = false
      this.newExcelName = ''
    },

    confirmDelete() {
      this.$delete(this.excelFiles, this.deleteTarget)
      if (this.activeExcel === this.deleteTarget) {
        const files = Object.keys(this.excelFiles)
        this.activeExcel = files.length ? files[0] : null
        this.activeSheet = this.activeExcel
          ? Object.keys(this.excelFiles[this.activeExcel])[0] : null
      }
      this.showDeleteConfirm = false
    },

    createDefaultSheets() {
      // 确保track文件夹下的文件总是创建7个固定的工作表
      return {
        'Gen. Param.': {
          headers: [
            { prop: 'paramName', label: '参数名称' },
            { prop: 'value', label: '值' }
          ],
          data: [
            // 默认参数值
            { paramName: 'Direction', value: '1' },
            { paramName: 'Line speed', value: '80' }
          ]
        },
        'Tracks': {
          headers: [
            { prop: 'id', label: 'ID' },
            { prop: 'Track_ID_before_jump', label: 'Track_ID_before_jump' },
            { prop: 'Track_ID_after_jump', label: 'Track_ID_after_jump' },
            { prop: 'KP_before_jump', label: 'KP_before_jump' },
            { prop: 'KP_after_jump', label: 'KP_after_jump' },
            { prop: 'Jump_length', label: 'Jump_length' },
            { prop: 'Correction_applied_to_KP', label: 'Correction_applied_to_KP' },
            { prop: 'Distance_from_track_origin_to_jump_point', label: 'Distance_from_track_origin_to_jump_point' }
          ],
          data: []
        },
        'Gradient': {
          headers: [
            { prop: 'id', label: 'ID' },
            { prop: 'T1', label: 'T1' },
            { prop: 'T2', label: 'T2' },
            { prop: 'Track1', label: 'Track' },
            { prop: 'KP', label: 'KP (m)' },
            { prop: 'slope', label: '坡度 (%)' },
            { prop: 'Track2', label: 'Track' },
            { prop: 'KP_correction', label: 'KP correction' },
            { prop: 'Distance', label: 'Distance' },
            { prop: 'Slope_permille', label: 'Slope (‰)' }
          ],
          data: []
        },
        'Stations': {
          headers: [
            { prop: 'id', label: 'ID' },
            { prop: 'T1', label: 'T1' },
            { prop: 'T2', label: 'T2' },
            { prop: 'Track1', label: 'Track' },
            { prop: 'KP_of_platform_center', label: 'KP of platform center' },
            { prop: 'Name_of_station', label: 'Name of station' },
            { prop: 'Track2', label: 'Track' },
            { prop: 'KP_of_SSP', label: 'KP of SSP' },
            { prop: 'KP_correction', label: 'KP correction' },
            { prop: 'Distance_of_PF_center', label: 'Distance of PF center' },
            { prop: 'Distance_of_SSP', label: 'Distance of SSP' }
          ],
          data: []
        },
        'PSR': {
          headers: [
            { prop: 'id', label: 'ID' },
            { prop: 'T1', label: 'T1' },
            { prop: 'T2', label: 'T2' },
            { prop: 'Track1', label: 'Track' },
            { prop: 'KP', label: 'KP (m)' },
            { prop: 'PSR', label: 'PSR (km/h)' },
            { prop: 'Track2', label: 'Track' },
            { prop: 'KP_correction', label: 'KP correction' },
            { prop: 'Distance', label: 'Distance' },
            { prop: 'PSR_ms', label: 'PSR (m/s)' }
          ],
          data: []
        },
        'Unbridgeable gap': {
          headers: [
            { prop: 'Distance', label: 'Distance (m)' },
            { prop: 'Unbridgable_gap', label: 'Unbridgable_gap' }
          ],
          data: []
        },
        'Block description': {
          headers: [
            { prop: 'id', label: 'id' },
            { prop: 'Start_T1', label: 'Start_T1' },
            { prop: 'Start_T2', label: 'Start_T2' },
            { prop: 'Start_Track', label: 'Start_Track' },
            { prop: 'Rule', label: 'Rule' },
            { prop: 'Timer', label: 'Timer' },
            { prop: 'SubBlock_Start', label: 'Start_KP', headerGroup: 'Sub Block' },
            { prop: 'SubBlock_End', label: 'End', headerGroup: 'Sub Block' },
            { prop: 'Track2', label: 'Track2', headerGroup: 'Sub Block' },
            { prop: 'KP_correction', label: 'KP correction', headerGroup: 'Sub Block' },
            { prop: 'SubBlock_StartDistance', label: 'Start distance', headerGroup: 'Sub Block' },
            { prop: 'SubBlock_Track', label: 'Track', headerGroup: 'Sub Block' },
            { prop: 'Overlap_Value', label: 'Value', headerGroup: 'overlap' },
            { prop: 'Overlap_Track', label: 'Track', headerGroup: 'overlap' },
            { prop: 'Overlap_Sens', label: 'Sens', headerGroup: 'overlap' }
          ],
          data: []
        }
      }
    },

    addNewRow() {
      if (!this.activeSheet || !this.currentSheets[this.activeSheet]) return

      // 创建一个空白行，使用当前工作表的字段结构
      const emptyRow = {}
      this.currentSheets[this.activeSheet].headers.forEach(header => {
        emptyRow[header.prop] = ''
      })

      // 设置自增ID
      if (['Tracks', 'Gradient', 'Stations', 'PSR', 'Block description'].includes(this.activeSheet)) {
        const currentData = this.currentSheets[this.activeSheet].data
        const maxId = currentData.length > 0
          ? Math.max(...currentData.map(row => parseInt(row.id) || 0))
          : 0
        emptyRow.id = maxId + 1
      }

      // 将新行添加到表格数据中
      this.currentSheets[this.activeSheet].data.push(emptyRow)

      // 标记数据已修改
      this.dataModified = true
    },

    // 在指定位置插入新行
    handleInsertRow(index) {
      if (!this.activeSheet || !this.currentSheets[this.activeSheet]) return

      // 初始化新行数据
      this.newRowData = {}

      // 根据不同的工作表，设置要显示的字段
      if (this.activeSheet === 'Tracks') {
        this.currentHeaders = this.currentSheets[this.activeSheet].headers.filter(header => {
          return !this.isFieldDisabled(header.prop, this.activeSheet)
        })
      } else if (this.activeSheet === 'Gradient') {
        this.currentHeaders = this.currentSheets[this.activeSheet].headers.filter(header => {
          return header.prop === 'KP' || header.prop === 'slope'
        })
      } else if (this.activeSheet === 'Stations') {
        this.currentHeaders = this.currentSheets[this.activeSheet].headers.filter(header => {
          return header.prop === 'KP_of_platform_center' || header.prop === 'Name_of_station'
        })
      } else if (this.activeSheet === 'PSR') {
        this.currentHeaders = this.currentSheets[this.activeSheet].headers.filter(header => {
          return header.prop === 'KP' || header.prop === 'PSR'
        })
      } else if (this.activeSheet === 'Block description') {
        // 轨道区段工作表只显示需要手动填写的7个特定字段
        this.currentHeaders = this.currentSheets[this.activeSheet].headers.filter(header => {
          return ['Rule', 'SubBlock_Start', 'SubBlock_End', 'SubBlock_Track',
                  'Overlap_Value', 'Overlap_Track', 'Overlap_Sens'].includes(header.prop)
        })
      } else {
        this.currentHeaders = this.currentSheets[this.activeSheet].headers
      }

      // 设置插入位置
      this.insertPosition = index

      // 显示表单对话框
      this.showRowDialog = true
    },

    // 提交新增行表单
    submitRowForm() {
      const sheet = this.currentSheets[this.activeSheet]

      // 设置ID - 根据插入位置分配合适的ID
      if (['Tracks', 'Gradient', 'Stations', 'PSR', 'Block description'].includes(this.activeSheet)) {
        if (this.insertPosition >= 0) {
          // 在中间插入行时，新行ID应为当前行的ID+1
          const currentId = parseInt(sheet.data[this.insertPosition].id) || 0
          this.newRowData.id = currentId + 1

          // 将插入行后的所有行ID加1，避免ID重复
          for (let i = 0; i < sheet.data.length; i++) {
            if (parseInt(sheet.data[i].id) >= this.newRowData.id) {
              sheet.data[i].id = parseInt(sheet.data[i].id) + 1
            }
          }
        } else {
          // 在末尾添加行时，使用最大ID+1
          const currentData = this.currentSheets[this.activeSheet].data
          const maxId = currentData.length > 0
            ? Math.max(...currentData.map(row => parseInt(row.id) || 0))
            : 0
          this.newRowData.id = maxId + 1
        }
      }

      // 处理特殊工作表的逻辑
      if (this.activeSheet === 'Tracks') {
        // 移除强制设置ID为0的代码行，使用上面已经设置好的ID
        // this.newRowData.id = 0 // 标记为新记录

        // 处理Track_ID_before_jump的计算
        if (this.insertPosition >= 0) {
          // 插入行的情况
          const prevRow = this.insertPosition > 0 ? sheet.data[this.insertPosition] : null
          if (prevRow) {
            const prevValue = prevRow.Track_ID_after_jump
            if (prevValue === '' || (typeof prevValue === 'string' && isNaN(prevValue))) {
              this.newRowData.Track_ID_before_jump = ''
            } else {
              this.newRowData.Track_ID_before_jump = prevValue
            }
          }
        } else {
          // 末尾添加行的情况
          if (sheet.data.length > 0) {
            const lastRow = sheet.data[sheet.data.length - 1]
            const lastValue = lastRow.Track_ID_after_jump
            if (lastValue === '' || (typeof lastValue === 'string' && isNaN(lastValue))) {
              this.newRowData.Track_ID_before_jump = ''
            } else {
              this.newRowData.Track_ID_before_jump = lastValue
            }
          }
        }
      }

      // 根据插入位置决定如何添加行
      if (this.insertPosition >= 0) {
        // 在指定位置插入
        sheet.data.splice(this.insertPosition + 1, 0, this.newRowData)

        // 更新之后行的关联数据
        if (this.activeSheet === 'Tracks') {
          this.updateTrackRowsAfterInsert(this.insertPosition + 1)
        }

        this.$message.success(`已在第 ${this.insertPosition + 1} 行后插入新行`)
      } else {
        // 在末尾添加
        sheet.data.push(this.newRowData)

        // 如果是Tracks工作表，更新计算值
        if (this.activeSheet === 'Tracks') {
          this.updateDistanceFromOrigin(sheet.data.length - 1)
        }

        this.$message.success(`已添加新行`)
      }

      // 关闭对话框并重置数据
      this.showRowDialog = false
      this.newRowData = {}
      this.insertPosition = -1
    },

    handleDeleteRow(index) {
      if (!this.activeSheet || !this.currentSheets[this.activeSheet]) return

      this.$confirm('确认删除此行?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 从数组中删除该行
        this.currentSheets[this.activeSheet].data.splice(index, 1)

        // 标记数据已修改
        this.dataModified = true

        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },

    async handleDownload() {
      this.$confirm('如何保存数据?', '保存选项', {
        confirmButtonText: '下载Excel',
        cancelButtonText: '取消',
        distinguishCancelAndClose: true,
        type: 'info',
        center: true
      }).then(() => {
        // 下载Excel文件
        this.downloadExcel()
      }).catch(action => {
        if (action === 'cancel') {
          this.$message.info('已取消保存')
        }
      })
    },

    // 分离下载Excel的方法
    async downloadExcel() {
      this.downloadLoading = true
      const excel = await import('@/vendor/Export2Excel')
      const sheets = Object.entries(this.currentSheets).map(([name, sheet]) => ({
        name,
        data: [
          sheet.headers.map(h => h.label),
          ...sheet.data.map(row => sheet.headers.map(h => row[h.prop]))
        ]
      }))

      excel.export_json_to_multiple_sheet({
        sheets,
        filename: this.activeExcel.replace('.xls', ''),
        autoWidth: true,
        bookType: 'xlsx'
      })
      this.downloadLoading = false
    },

    handleInputChange(prop, row, index) {
      // 更新数据修改标记
      this.dataModified = true;

      // 处理 Track_ID_after_jump 变化
      if (prop === 'Track_ID_after_jump' && this.activeSheet === 'Tracks') {
        // 如果是第一行，更新其Track_ID_before_jump为当前的Track_ID_after_jump值
        if (index === 0) {
          row.Track_ID_before_jump = row.Track_ID_after_jump

          // 同时更新第二行的Track_ID_before_jump
          if (this.currentSheets[this.activeSheet].data.length > 1) {
            const nextRow = this.currentSheets[this.activeSheet].data[1]
            nextRow.Track_ID_before_jump = row.Track_ID_after_jump
          }
        } else {
          // 不是第一行，更新下一行的Track_ID_before_jump
          this.updateNextRowTrackId(index)
        }
      }

      // 处理 KP_before_jump 或 KP_after_jump 变化 - 计算Jump length
      if (['KP_before_jump', 'KP_after_jump'].includes(prop) && this.activeSheet === 'Tracks') {
        this.updateJumpLength(index)
        this.updateCorrectionValues() // 更新所有的Correction值
        this.updateDistanceFromOrigin(index) // 更新Distance from track origin
        this.updateAllGradientT1() // 当KP值变化时更新Gradient表的T1值
        this.updateAllGradientKPCorrections() // 当KP值变化时更新Gradient表的KP_correction值
      }

      // 处理 KP_after_jump 或 Correction_applied_to_KP 变化
      if (['KP_after_jump', 'Correction_applied_to_KP'].includes(prop) && this.activeSheet === 'Tracks') {
        this.updateDistanceFromOrigin(index)

        // 当Tracks表中这些值变化时，需要更新Gradient表中依赖它们的计算字段
        if (prop === 'KP_after_jump') {
          this.updateAllGradientT1() // 更新Gradient表的T1值
        }
        if (prop === 'Correction_applied_to_KP') {
          this.updateAllGradientKPCorrections() // 更新Gradient表的KP_correction值
        }
      }

      // 处理 Direction 参数变化
      if (this.activeSheet === 'Gen. Param.' && row.paramName === 'Direction') {
        // 更新Tracks表的Distance_from_track_origin_to_jump_point
        this.updateAllDistancesFromOrigin()

        // 更新Gradient表的所有计算字段
        this.updateAllGradientT1() // 更新T1
        this.updateAllGradientT2() // 更新T2
        this.updateAllGradientTrack2() // 更新Track2
        this.updateAllGradientKPCorrections() // 更新KP_correction
        this.updateAllGradientDistances() // 更新Distance

        // 更新Stations表的所有计算字段
        this.updateAllStationsFields()

        // 更新PSR表的T1和T2值
        this.updateAllPSRTValues()

        // 更新PSR表的Track2和PSR_ms值
        this.updateAllPSRTrack2AndPsrMs()

        // 更新PSR表的KP_correction和Distance值
        this.updateAllPSRKPCorrectionsAndDistances()

        // 显示提示
        this.$message.success(`Direction值已更新为${row.value}，所有计算字段已重新计算`)
      }

      // 处理 Max PSR 参数变化
      if (this.activeSheet === 'Gen. Param.' && row.paramName === 'Max PSR') {
        // 更新PSR表的PSR_ms值
        this.updateAllPSRTrack2AndPsrMs()

        // 显示提示
        this.$message.success(`Max PSR值已更新为${row.value}，PSR表中的PSR_ms值已重新计算`)
      }

      // 处理 Gradient 表中相关字段变化
      if (this.activeSheet === 'Gradient') {
        if (prop === 'KP') {
          this.updateGradientT1(index)
          this.updateGradientT2(index)
          this.updateGradientKPCorrection(index)
          this.updateGradientDistance(index) // 更新Distance
        }

        if (['KP', 'Track1', 'T1', 'T2'].includes(prop)) {
          this.updateGradientTrack2(index)
        }

        if ((prop === 'KP' || prop === 'Track2') && this.activeSheet === 'Gradient') {
          this.updateGradientKPCorrection(index)
          this.updateGradientDistance(index) // KP或KP_correction变化时更新Distance
        }

        if (prop === 'slope') {
          this.updateGradientSlopePermille(index) // slope变化时更新Slope_permille
        }
      }

      // 处理 PSR 表中相关字段变化
      if (this.activeSheet === 'PSR') {
        if (prop === 'KP') {
          this.updatePSRT1(index) // KP值变化时更新T1值
          this.updatePSRT2(index) // KP值变化时更新T2值
          this.updatePSRKPCorrection(index) // KP值变化时更新KP_correction值
          this.updatePSRDistance(index) // KP值变化时更新Distance值
          this.updatePSRTrack2(index) // KP值变化可能导致T1和T2变化，需要更新Track2
        }

        if (prop === 'Track2') {
          this.updatePSRKPCorrection(index) // Track2值变化时更新KP_correction值
          this.updatePSRDistance(index) // 由于KP_correction可能变化，需要更新Distance值
        }

        if (prop === 'Track1') {
          this.updatePSRTrack2(index) // Track1变化时需要更新Track2
          this.updatePSRKPCorrection(index) // Track1变化时更新KP_correction值
          this.updatePSRDistance(index) // Track1变化时更新Distance值
        }

        if (prop === 'T1' || prop === 'T2') {
          this.updatePSRTrack2(index) // T1或T2值变化时需要更新Track2
        }

        if (prop === 'PSR') {
          this.updatePSRMs(index) // PSR值变化时更新PSR_ms值
        }
      }

      // 当Track_ID_after_jump变化时也需要更新Gradient表中的T1值，因为T1是基于这个字段计算的
      if (prop === 'Track_ID_after_jump' && this.activeSheet === 'Tracks') {
        this.updateAllGradientT1()
      }

      // 当Tracks表中任何可能影响T1计算的字段变化时，都需要更新Gradient表
      if (['Track_ID_after_jump', 'KP_after_jump', 'Correction_applied_to_KP'].includes(prop) &&
          this.activeSheet === 'Tracks') {
        this.updateAllGradientT1() // 更新T1
        this.updateAllGradientT2() // 更新T2
        this.updateAllGradientTrack2() // 更新Track2
        this.updateAllGradientKPCorrections() // 更新KP_correction
        this.updateAllGradientDistances() // 更新Distance
        this.updateAllPSRTValues() // 更新PSR表的T1和T2值
        this.updateAllPSRTrack2AndPsrMs() // 更新PSR表的Track2和PSR_ms值
        this.updateAllPSRKPCorrectionsAndDistances() // 更新PSR表的KP_correction和Distance值
      }

      // 当Tracks表中Track_ID_before_jump或KP_before_jump变化时，也需要更新PSR表的T1值
      if (['Track_ID_before_jump', 'KP_before_jump'].includes(prop) &&
          this.activeSheet === 'Tracks') {
        this.updateAllPSRTValues() // 更新PSR表的T1和T2值
        this.updateAllPSRTrack2AndPsrMs() // 更新PSR表的Track2和PSR_ms值
        this.updateAllPSRKPCorrectionsAndDistances() // 更新PSR表的KP_correction和Distance值
      }

      // 处理 Stations 表中字段变化
      if (this.activeSheet === 'Stations') {
        // 当KP_of_platform_center或KP_of_SSP变化时，更新T1和T2
        if (['KP_of_platform_center', 'KP_of_SSP'].includes(prop)) {
          this.updateStationsT1(index)
          this.updateStationsT2(index)
        }

        // 当T1、T2或Track1变化时，更新Track2
        if (['T1', 'T2', 'Track1'].includes(prop)) {
          this.updateStationsTrack2(index)
        }

        // 当KP_of_SSP或Track2变化时，更新KP_correction
        if (['KP_of_SSP', 'Track2'].includes(prop)) {
          this.updateStationsKPCorrection(index)
        }

        // 当KP_of_platform_center或KP_correction变化时，更新Distance_of_PF_center
        if (['KP_of_platform_center', 'KP_correction'].includes(prop)) {
          this.updateStationsDistanceOfPFCenter(index)
        }

        // 当KP_of_SSP或KP_correction变化时，更新Distance_of_SSP
        if (['KP_of_SSP', 'KP_correction'].includes(prop)) {
          this.updateStationsDistanceOfSSP(index)
        }
      }
    },

    // 添加用于更新所有Gradient行的T1值的方法
    updateAllGradientT1() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientT1(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的T2值的方法
    updateAllGradientT2() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientT2(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的Track2值的方法
    updateAllGradientTrack2() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientTrack2(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有Gradient行的KP_correction值的方法
    updateAllGradientKPCorrections() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientKPCorrection(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加新方法：计算Jump length
    updateJumpLength(index) {
      if (this.activeSheet === 'Tracks') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]

        // 应用公式: IF(OR(C4="",D4=""),"",C4-D4)
        const kpBeforeJump = currentRow.KP_before_jump
        const kpAfterJump = currentRow.KP_after_jump

        if (kpBeforeJump === '' || kpAfterJump === '' || kpBeforeJump === undefined || kpAfterJump === undefined) {
          currentRow.Jump_length = ''
        } else {
          const kpBeforeValue = Number(kpBeforeJump) || 0
          const kpAfterValue = Number(kpAfterJump) || 0
          currentRow.Jump_length = kpBeforeValue - kpAfterValue
        }
      }
    },

    // 添加新方法：计算所有行的Correction applied to KP
    updateCorrectionValues() {
      if (this.activeSheet === 'Tracks') {
        const tracks = this.currentSheets[this.activeSheet].data

        // 对于每一行，都需要重新计算从第一行到当前行的Jump length之和
        for (let i = 0; i < tracks.length; i++) {
          const row = tracks[i]
          const jumpLength = row.Jump_length

          // 应用公式: IF(F4="","",SUM(F$4:F4))
          if (jumpLength === '' || jumpLength === undefined) {
            row.Correction_applied_to_KP = ''
          } else {
            // 计算从第一行到当前行的所有Jump length的和
            let sum = 0
            for (let j = 0; j <= i; j++) {
              const jRow = tracks[j]
              const jJumpLength = jRow.Jump_length
              if (jJumpLength !== '' && jJumpLength !== undefined) {
                sum += Number(jJumpLength) || 0
              }
            }
            row.Correction_applied_to_KP = sum
          }
        }
      }
    },

    // 更新插入行之后的所有行的关联数据
    updateTrackRowsAfterInsert(startIndex) {
      const sheet = this.currentSheets[this.activeSheet]

      // 从插入位置开始，更新所有后续行
      for (let i = startIndex; i < sheet.data.length; i++) {
        // 更新Jump length
        this.updateJumpLength(i)

        // 更新Distance_from_track_origin_to_jump_point
        this.updateDistanceFromOrigin(i)

        // 更新下一行的Track_ID_before_jump
        if (i < sheet.data.length - 1) {
          const currentRow = sheet.data[i]
          const nextRow = sheet.data[i + 1]

          const currentValue = currentRow.Track_ID_after_jump

          // 应用相同的公式逻辑
          if (currentValue === '') {
            nextRow.Track_ID_before_jump = ''
          } else if (typeof currentValue === 'string' && isNaN(currentValue)) {
            // 如果是文本，保持现有值
          } else {
            nextRow.Track_ID_before_jump = currentValue
          }
        }
      }

      // 更新所有行的Correction applied to KP
      this.updateCorrectionValues()
    },

    handleMenuSelect(index) {
      // 判断是文件夹还是文件
      const isExcelFile = index.endsWith('.xls')

      if (isExcelFile) {
        // 如果是文件，加载该文件
        const folderIndex = Object.keys(this.folderFiles).find(folderId => {
          return this.folderFiles[folderId].some(file => file.name === index)
        })

        if (folderIndex) {
          this.activeFolder = folderIndex
          this.folderExcelFiles = this.folderFiles[folderIndex] || []

          // 如果是 running_profile.xls，加载对应的 JSON 数据
          if (index === 'running_profile.xls') {
            this.loadRunningProfileData()
          } else {
            this.loadExcelFile(index)
          }
        }
      } else {
        // 如果是文件夹，显示文件夹内容并加载第一个文件
        this.activeFolder = index
        this.folderExcelFiles = this.folderFiles[index] || []

        // 确保文件夹下有文件
        if (this.folderExcelFiles.length > 0) {
          // 自动加载第一个Excel文件
          const firstExcelFile = this.folderExcelFiles[0].name

          // 如果是 running_profile.xls，加载对应的 JSON 数据
          if (firstExcelFile === 'running_profile.xls') {
            this.loadRunningProfileData()
          } else {
            this.loadExcelFile(firstExcelFile)
          }

          // 更新活动菜单项为所选文件
          this.activeMenuIndex = firstExcelFile
        } else {
          // 如果文件夹为空，清空当前选择
          this.activeExcel = null
          this.activeSheet = null
        }
      }
    },

    // 如果需要加载特定Excel文件
    handleSelectExcel(rowName) {
      this.loadExcelFile(rowName)
    },

    // 加载特定Excel文件
    async loadExcelFile(excelName) {
      this.loading = true
      this.loadError = null

      try {
        // 转换文件名，从.xls变为.json
        const jsonFileName = excelName.replace('.xls', '.json')

        // 构建文件路径：/data/[文件夹名]/[文件名.json]
        const filePath = `/data/${this.activeFolder}/${jsonFileName}`

        const response = await fetch(filePath)
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`)
        }

        const rawData = await response.json()

        // 检查是否已经存在相同名称的Excel文件
        if (!this.excelFiles[excelName]) {
          this.excelFiles[excelName] = this.createDefaultSheets()
        }

        // 设置当前活动的Excel文件
        this.activeExcel = excelName

        // 默认选择第一个工作表
        const sheetNames = Object.keys(this.excelFiles[excelName])
        this.activeSheet = sheetNames.length > 0 ? sheetNames[0] : null

        // 处理数据，为每个工作表填充数据
        this.populateExcelData(rawData)

        this.trackData = rawData

        // 重置数据修改标记
        this.dataModified = false
      } catch (error) {
        this.loadError = `加载数据失败: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    // 初始化树形数据
    initFolderTreeData() {
      try {
        // 将folderFiles转换为树形结构
        this.folderTreeData = Object.keys(this.folderFiles).map(folder => {
          const files = this.folderFiles[folder] || []

          return {
            id: folder,
            label: folder,
            isFolder: true,
            children: files.map(file => ({
              id: file.name,  // 恢复为原始格式，不使用folder-filename格式
              label: file.displayName || file.name,
              isFolder: false
            }))
          }
        })
      } catch (error) {
        this.folderTreeData = [] // 出错时使用空数组
      }
    },

    filterNode(value, data) {
      if (!value || !data || value.trim() === '') return true

      try {
        // 转换为小写进行不区分大小写的搜索
        const searchText = value.toLowerCase().trim()
        const nodeText = (data.label || '').toLowerCase()

        // 文件夹处理
        if (data.isFolder) {
          // 如果文件夹名称匹配，直接显示
          if (nodeText.includes(searchText)) {
            return true
          }

          // 如果文件夹内的文件匹配，也显示文件夹
          if (data.children && data.children.length) {
            return data.children.some(child => {
              if (!child || !child.label) return false
              return child.label.toLowerCase().includes(searchText)
            })
          }
          return false
        }

        // 文件处理 - 检查文件名
        return nodeText.includes(searchText)
      } catch (error) {
        return true // 出错时默认显示
      }
    },

    handleSearchInput(value) {
      this.applyMenuFilter(value)
    },

    // 添加清空搜索的方法
    clearFilter() {
      this.filterText = ''
      this.applyMenuFilter('')
    },

    handleSheetChange(sheetName) {
      // 处理工作表切换
      if (sheetName === 'Stations') {
        this.updateAllStationsFields()
      } else if (sheetName === 'Block description') {
        this.updateAllBlockDescriptionFields()
      }
    },

    // 返回文件夹列表
    backToFolderList() {
      this.activeExcel = null
      this.activeSheet = null
    },

    // 应用菜单过滤
    applyMenuFilter(value) {
      if (!value || value.trim() === '') {
        // 如果没有搜索值，显示所有菜单项
        this.showAllMenuItems()
        return
      }

      const searchText = value.toLowerCase().trim()

      // 遍历所有菜单项，筛选匹配的
      const menuItems = document.querySelectorAll('.folder-menu .el-submenu')
      menuItems.forEach(submenu => {
        const folderName = submenu.querySelector('.folder-name').textContent.toLowerCase()
        const menuFiles = Array.from(submenu.querySelectorAll('.el-menu-item span')).map(el => el.textContent.toLowerCase())

        // 如果文件夹名称匹配或者任何文件名匹配，则显示此菜单
        const folderMatch = folderName.includes(searchText)
        const fileMatch = menuFiles.some(fileName => fileName.includes(searchText))

        if (folderMatch || fileMatch) {
          submenu.style.display = ''

          // 如果是文件匹配，需要展开父菜单
          if (fileMatch && !folderMatch) {
            const submenuTitle = submenu.querySelector('.el-submenu__title')
            if (submenuTitle) {
              // 模拟鼠标悬停展开菜单
              const event = new MouseEvent('mouseenter', {
                bubbles: true,
                cancelable: true,
                view: window
              })
              submenuTitle.dispatchEvent(event)
            }
          }

          // 只显示匹配的文件
          const menuItemList = submenu.querySelectorAll('.el-menu-item')
          menuItemList.forEach(item => {
            const fileName = item.querySelector('span').textContent.toLowerCase()
            item.style.display = fileName.includes(searchText) ? '' : 'none'
          })
        } else {
          submenu.style.display = 'none'
        }
      })
    },

    // 显示所有菜单项
    showAllMenuItems() {
      const menuItems = document.querySelectorAll('.folder-menu .el-submenu, .folder-menu .el-menu-item')
      menuItems.forEach(item => {
        item.style.display = ''
      })
    },

    // 添加鼠标悬停处理方法
    handleMenuHover(folderId, isHover) {
      // 如果该文件夹已经被固定展开，则忽略鼠标悬停/离开事件
      if (this.permanentlyExpandedFolders.includes(folderId)) {
        return
      }

      if (isHover) {
        // 鼠标悬停时，如果不在永久展开列表中，将其添加到临时展开列表
        if (!this.expandedFolders.includes(folderId)) {
          this.expandedFolders.push(folderId)
        }
      } else {
        // 鼠标离开时，如果不在永久展开列表中，从展开列表中移除
        this.expandedFolders = this.expandedFolders.filter(id =>
          id !== folderId || this.permanentlyExpandedFolders.includes(id)
        )
      }
    },

    // 添加新方法，处理菜单点击事件
    handleMenuClick(folderId, event) {
      event.stopPropagation()

      // 检查文件夹是否已经固定展开
      const isPermanent = this.permanentlyExpandedFolders.includes(folderId)

      if (isPermanent) {
        // 如果已经固定展开，则取消固定并从展开列表中移除
        this.permanentlyExpandedFolders = this.permanentlyExpandedFolders.filter(id => id !== folderId)
        this.expandedFolders = this.expandedFolders.filter(id => id !== folderId)
      } else {
        // 如果未固定展开，则添加到固定展开列表和展开列表
        if (!this.permanentlyExpandedFolders.includes(folderId)) {
          this.permanentlyExpandedFolders.push(folderId)
        }
        if (!this.expandedFolders.includes(folderId)) {
          this.expandedFolders.push(folderId)
        }
      }
    },

    // 添加新方法，判断文件夹是否永久展开
    isPermanentlyExpanded(folderId) {
      return this.permanentlyExpandedFolders.includes(folderId)
    },

    // 添加新方法，处理Excel文件选择
    handleExcelSelect(fileName) {
      if (fileName && this.excelFiles[fileName]) {
        this.activeExcel = fileName

        // 设置活跃的工作表
        const sheetNames = Object.keys(this.excelFiles[fileName])
        this.activeSheet = sheetNames.length > 0 ? sheetNames[0] : null

        // 显示通知
        this.$message.success(`已切换到文件：${fileName}`)
      }
    },

    // 添加新方法，更新所有行的 Distance_from_track_origin_to_jump_point
    updateAllDistancesFromOrigin() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Tracks) {
        const tracks = this.excelFiles[this.activeExcel].Tracks.data
        for (let i = 0; i < tracks.length; i++) {
          this.updateDistanceFromOrigin(i)
        }
      }
    },

    // 计算 Distance_from_track_origin_to_jump_point 的方法
    updateDistanceFromOrigin(index) {
      if (this.activeSheet === 'Tracks') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 应用计算公式: IF(D4="","",dir*(D4+G4))
        const kpAfterJump = currentRow.KP_after_jump
        const correction = currentRow.Correction_applied_to_KP

        if (kpAfterJump === '') {
          currentRow.Distance_from_track_origin_to_jump_point = ''
        } else {
          const kpValue = Number(kpAfterJump) || 0
          const correctionValue = Number(correction) || 0
          currentRow.Distance_from_track_origin_to_jump_point = dir * (kpValue + correctionValue)
        }
      }
    },

    // 添加新方法，当Track_ID_after_jump值变化时，更新下一行的Track_ID_before_jump
    updateNextRowTrackId(index) {
      if (this.activeSheet === 'Tracks' && index < this.currentSheets[this.activeSheet].data.length - 1) {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const nextRow = this.currentSheets[this.activeSheet].data[index + 1]

        const currentValue = currentRow.Track_ID_after_jump

        // 应用相同的公式逻辑
        if (currentValue === '') {
          nextRow.Track_ID_before_jump = ''
        } else if (typeof currentValue === 'string' && isNaN(currentValue)) {
          // 如果是文本，保持下一行的现有值
        } else {
          nextRow.Track_ID_before_jump = currentValue
        }
      }
    },

    // 判断字段是否禁用的方法
    isFieldDisabled(prop, sheetName) {
      // 所有表格的id字段都禁用
      if (prop === 'id') {
        return true
      }

      if (sheetName === 'Gen. Param.' && prop === 'paramName') {
        // Gen. Param.工作表中的参数名称列禁用
        return true
      } else if (sheetName === 'Tracks') {
        // Tracks工作表中的计算列禁用
        const calculatedFields = ['Track_ID_before_jump', 'Distance_from_track_origin_to_jump_point', 'Jump_length', 'Correction_applied_to_KP']
        return calculatedFields.includes(prop)
      } else if (sheetName === 'Gradient') {
        // Gradient工作表中的计算列禁用
        const calculatedFields = ['T1', 'T2', 'Track2', 'KP_correction', 'Distance', 'Slope_permille']
        return calculatedFields.includes(prop)
      } else if (sheetName === 'Stations') {
        // Stations工作表中的计算列禁用
        const calculatedFields = ['T1', 'T2', 'KP_of_SSP', 'KP_correction', 'Track2', 'Distance_of_PF_center', 'Distance_of_SSP']
        return calculatedFields.includes(prop)
      } else if (sheetName === 'PSR') {
        // PSR工作表中的计算列禁用
        const calculatedFields = ['T1', 'T2', 'KP_correction', 'Distance', 'PSR_ms', 'Track2']
        return calculatedFields.includes(prop)
      } else if (sheetName === 'Block description') {
        // Block description工作表中的计算列禁用
        const calculatedFields = ['Start_T1', 'Start_T2', 'Track2', 'KP_correction', 'SubBlock_StartDistance']
        return calculatedFields.includes(prop)
      }
      return false
    },

    // 添加新方法，计算Gradient表的T1值
    updateGradientT1(index) {
      if (this.activeSheet === 'Gradient') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP

        // 如果KP为空，返回空
        if (kpValue === '' || kpValue === undefined) {
          currentRow.T1 = ''
          return
        }

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          return
        }

        // 使用统一的findMatchIndexInTracks方法查找匹配的索引
        const numericKP = Number(kpValue)
        const matchIndex = this.findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)

        // 如果没找到匹配项
        if (matchIndex === -1) {
          currentRow.T1 = ''
          return
        }

        // Excel公式中的IF判断
        const matchedRow = tracksData[matchIndex]
        const matchedKP = Number(matchedRow.KP_before_jump) || 0

        // 检查找到的KP是否与输入的KP完全相等
        if (matchedKP === numericKP) {
          // 完全匹配，使用当前行的Track_ID_before_jump
          currentRow.T1 = matchedRow.Track_ID_before_jump
        } else {
          // 不完全匹配，使用(MATCH返回的索引+1)行的Track_ID_before_jump
          const nextIndex = matchIndex + 1
          if (nextIndex < tracksData.length) {
            currentRow.T1 = tracksData[nextIndex].Track_ID_before_jump
          } else {
            // 如果已经是最后一行，使用当前行
            currentRow.T1 = matchedRow.Track_ID_before_jump
          }
        }
      }
    },

    // 添加计算Gradient表的T2值
    updateGradientT2(index) {
      if (this.activeSheet === 'Gradient') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP

        // 如果KP为空，返回空
        if (kpValue === '' || kpValue === undefined) {
          currentRow.T2 = ''
          return
        }

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          return
        }

        // 使用统一的findMatchIndexInTracks方法查找匹配的索引
        const numericKP = Number(kpValue)
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

        // 如果没找到匹配项
        if (matchIndex === -1) {
          currentRow.T2 = ''
          return
        }

        // 获取对应行的Track_ID_after_jump值
        currentRow.T2 = tracksData[matchIndex].Track_ID_after_jump
      }
    },

    // 添加计算Gradient表的KP correction值的方法
    updateGradientKPCorrection(index) {
      if (this.activeSheet === 'Gradient') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP
        const track2Value = currentRow.Track2

        // 如果KP为空，返回空
        if (kpValue === '' || kpValue === undefined) {
          currentRow.KP_correction = ''
          return
        }

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          return
        }

        // 使用统一的findMatchIndexInTracks方法查找匹配的索引
        const numericKP = Number(kpValue)
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

        // 如果没找到匹配项
        if (matchIndex === -1) {
          currentRow.KP_correction = '#N/A'
          return
        }

        // 实现公式中的多重IF判断
        // 第一种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir))=G4
        if (tracksData[matchIndex].Track_ID_after_jump == track2Value) {
          currentRow.KP_correction = tracksData[matchIndex].Correction_applied_to_KP
        }
        // 第二种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)+1)=G4
        else if (matchIndex + 1 < tracksData.length &&
                tracksData[matchIndex + 1].Track_ID_after_jump == track2Value) {
          currentRow.KP_correction = tracksData[matchIndex + 1].Correction_applied_to_KP
        }
        // 第三种情况: INDEX(Tracks!E:E,MATCH(E4,Tracks!D:D,dir)-1)=G4
        else if (matchIndex - 1 >= 0 &&
                tracksData[matchIndex - 1].Track_ID_after_jump == track2Value) {
          currentRow.KP_correction = tracksData[matchIndex - 1].Correction_applied_to_KP
        }
        // 如果都不匹配，返回N/A
        else {
          currentRow.KP_correction = '#N/A'
        }
      }
    },

    // 添加计算Gradient表的Track2值的方法
    updateGradientTrack2(index) {
      if (this.activeSheet === 'Gradient') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const track1Value = currentRow.Track1
        const t1Value = currentRow.T1
        const t2Value = currentRow.T2

        // 应用公式: IF(AND(D4="",B4=C4),B4,IF(D4="","",D4))
        // 其中D4=Track1, B4=T1, C4=T2
        if (track1Value === '' || track1Value === undefined) {
          if (t1Value === t2Value) {
            currentRow.Track2 = t1Value
          } else {
            currentRow.Track2 = ''
          }
        } else {
          currentRow.Track2 = track1Value
        }
      }
    },

    // 添加计算Gradient表的Distance值的方法
    updateGradientDistance(index) {
      if (this.activeSheet === 'Gradient') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP
        const kpCorrection = currentRow.KP_correction

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 应用修改后的公式: =IF(E4="",MAX(100000,I4+1),(E4+H4)*dir))
        // 不再判断I3是否为文本，直接处理当前行的值

        // 检查KP是否为空
        if (kpValue === '' || kpValue === undefined) {
          // 如果KP为空，使用当前Distance值+1与100000的较大值
          const currentDistanceValue = Number(currentRow.Distance) || 0
          currentRow.Distance = Math.max(100000, currentDistanceValue + 1)
        } else {
          // 如果KP_correction为#N/A，结果也应该是#N/A
          if (kpCorrection === '#N/A') {
            currentRow.Distance = '#N/A'
            return
          }

          // 如果KP不为空，使用当前行的KP和KP_correction计算
          const numericKP = Number(kpValue) || 0

          // 处理KP_correction
          let correctionValue = 0
          if (kpCorrection !== '' && kpCorrection !== undefined) {
            correctionValue = Number(kpCorrection) || 0
          }

          // 计算(KP + KP_correction) * dir
          currentRow.Distance = (numericKP + correctionValue) * dir
        }
      }
    },

    // 添加计算Gradient表的Slope_permille值的方法
    updateGradientSlopePermille(index) {
      if (this.activeSheet === 'Gradient') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const slopeValue = currentRow.slope

        // 应用修改后的公式: =IF(F4="",J4,F4*10))
        // 不再判断J3是否为文本，直接处理当前行的值

        // 检查当前行的slope是否为空
        if (slopeValue === '' || slopeValue === undefined) {
          // 如果slope为空，保持当前Slope_permille的值
          // 如果Slope_permille也为空，设为0
          if (currentRow.Slope_permille === '' || currentRow.Slope_permille === undefined) {
            currentRow.Slope_permille = 0
          }
          // 否则保持当前值不变
        } else {
          // 如果slope不为空，直接计算slope*10
          const numericSlope = Number(slopeValue) || 0
          currentRow.Slope_permille = numericSlope * 10
        }
      }
    },

    // 添加新方法，更新所有行的Gradient Distance
    updateAllGradientDistances() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Gradient) {
        const gradientRows = this.excelFiles[this.activeExcel].Gradient.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Gradient' // 临时设置为Gradient表以便计算

        for (let i = 0; i < gradientRows.length; i++) {
          this.updateGradientDistance(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 新增方法：根据列属性设置最小宽度
    getColumnMinWidth(prop) {
      // 为数值型列设置较大的最小宽度
      const wideColumns = ['Distance', 'Distance_from_track_origin_to_jump_point', 'KP_correction', 'Slope_permille']
      if (wideColumns.includes(prop)) {
        return 150 // 数值列使用较大宽度
      }

      // 为其他列设置默认最小宽度
      return 120
    },

    // 新增方法：判断是否需要显示tooltip
    shouldShowTooltip(value) {
      const strValue = String(value || '')
      return strValue && strValue.length > 10
    },

    // 添加单元格样式类名方法
    cellClassName({ row, column }) {
      const property = column.property

      // 处理Tracks表特定字段的空值警告
      if (this.activeSheet === 'Tracks') {
        // 检查三个关键字段是否为空
        const keyCells = ['Track_ID_after_jump', 'KP_before_jump', 'KP_after_jump']
        if (keyCells.includes(property) && (row[property] === '' || row[property] === undefined || row[property] === null)) {
          return 'warning-cell'
        }
      }

      // 处理单元格警告
      if (row._cellWarnings && row._cellWarnings[property]) {
        return 'warning-cell'
      }

      // 处理单元格提示
      if (row._cellPrompts && row._cellPrompts[property]) {
        return 'prompt-cell'
      }

      // 处理禁用单元格
      if (this.isFieldDisabled(property, this.activeSheet)) {
        return 'disabled-cell'
      }

      // Gradient表中Track列的特殊处理：当T1和T2不相等时添加警告样式
      if (this.activeSheet === 'Gradient' && (property === 'Track1' || property === 'Track2')) {
        // 检查同一行的T1和T2是否相等
        if (row.T1 !== row.T2 && row.T1 !== '' && row.T2 !== '') {
          return 'warning-cell'
        }
      }

      // Stations表中Track1列的特殊处理：当T1和T2不相等时添加警告样式
      if (this.activeSheet === 'Stations' && property === 'Track1') {
        // 检查同一行的T1和T2是否相等
        if (row.T1 !== row.T2 && row.T1 !== '' && row.T2 !== '') {
          return 'warning-cell'
        }
      }

      // PSR表中Track1列的特殊处理：当T1和T2不相等时添加警告样式
      if (this.activeSheet === 'PSR' && property === 'Track1') {
        // 检查同一行的T1和T2是否相等
        if (row.T1 !== row.T2 && row.T1 !== '' && row.T2 !== '') {
          return 'warning-cell'  // PSR使用淡红色警告
        }
      }

      // 为数值型单元格添加特定类名
      const numericColumns = ['Distance', 'Distance_from_track_origin_to_jump_point', 'Slope_permille', 'Jump_length']
      if (numericColumns.includes(property)) {
        return 'numeric-cell'
      }

      return ''
    },

    // 添加获取工作表显示名称的方法
    getSheetDisplayName(sheetName) {
      const displayNames = {
        'Gen. Param.': '总体参数(Gen. Param.)',
        'Tracks': '长短链(Tracks)',
        'Gradient': '坡度(Gradient)',
        'Stations': '车站(Stations)',
        'PSR': '线路限速(PSR)',
        'Unbridgeable gap': '分相区(Unbridgeable gap)',
        'Block description': '轨道区段(Block description)'
      }
      return displayNames[sheetName] || sheetName
    },

    // 添加更新所有Stations行的方法
    updateAllStationsFields() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].Stations) {
        const stationsRows = this.excelFiles[this.activeExcel].Stations.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'Stations' // 临时设置为Stations表以便计算

        for (let i = 0; i < stationsRows.length; i++) {
          this.updateStationsKPOfSSP(i) // 先计算KP_of_SSP
          this.updateStationsT1(i)
          this.updateStationsT2(i)
          this.updateStationsTrack1(i)
          this.updateStationsTrack2(i) // 添加Track2的计算
          this.updateStationsKPCorrection(i) // 添加KP_correction的计算
          this.updateStationsDistanceOfPFCenter(i) // 添加Distance_of_PF_center的计算
          this.updateStationsDistanceOfSSP(i) // 添加Distance_of_SSP的计算
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 计算Stations表的T1值
    updateStationsT1(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpOfPlatform = currentRow.KP_of_platform_center
        const kpOfSSP = currentRow.KP_of_SSP

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          return
        }

        // 应用公式：=@IF($E4="",IF($G4="","",IF(@INDEX(Tracks!C:C,MATCH($G4,Tracks!C:C,dir))=$G4,INDEX(Tracks!B:B,MATCH($G4,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($G4,Tracks!C:C,dir)+1))),IF(@INDEX(Tracks!C:C,MATCH($E4,Tracks!C:C,dir))=$E4,INDEX(Tracks!B:B,MATCH($E4,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($E4,Tracks!C:C,dir)+1)))

        // 外层IF：$E4=""
        if (kpOfPlatform === '' || kpOfPlatform === undefined) {
          // 内层IF：$G4=""
          if (kpOfSSP === '' || kpOfSSP === undefined) {
            currentRow.T1 = ''
            return
          } else {
            // 使用kpOfSSP作为匹配值，与Tracks表中的KP_after_jump列比较
            const numericSSP = Number(kpOfSSP)
            const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericSSP, tracksData, dir)

            if (matchIndex === -1) {
              currentRow.T1 = ''
              return
            }

            // 检查找到的值是否与kpOfSSP完全匹配
            const matchedKP = Number(tracksData[matchIndex].KP_after_jump) || 0
            if (matchedKP === numericSSP) {
              // 完全匹配，返回当前行的Track_ID_before_jump
              currentRow.T1 = tracksData[matchIndex].Track_ID_before_jump
            } else {
              // 不完全匹配，尝试返回下一行的Track_ID_before_jump
              const nextIndex = matchIndex + 1
              if (nextIndex < tracksData.length) {
                currentRow.T1 = tracksData[nextIndex].Track_ID_before_jump
              } else {
                currentRow.T1 = tracksData[matchIndex].Track_ID_before_jump // 如果已经是最后一行，使用当前行
              }
            }
          }
        } else {
          // 使用kpOfPlatform作为匹配值，与Tracks表中的KP_after_jump列比较
          const numericPlatform = Number(kpOfPlatform)
          const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericPlatform, tracksData, dir)

          if (matchIndex === -1) {
            currentRow.T1 = ''
            return
          }

          // 检查找到的值是否与kpOfPlatform完全匹配
          const matchedKP = Number(tracksData[matchIndex].KP_after_jump) || 0
          if (matchedKP === numericPlatform) {
            // 完全匹配，返回当前行的Track_ID_before_jump
            currentRow.T1 = tracksData[matchIndex].Track_ID_before_jump
          } else {
            // 不完全匹配，尝试返回下一行的Track_ID_before_jump
            const nextIndex = matchIndex + 1
            if (nextIndex < tracksData.length) {
              currentRow.T1 = tracksData[nextIndex].Track_ID_before_jump
            } else {
              currentRow.T1 = tracksData[matchIndex].Track_ID_before_jump // 如果已经是最后一行，使用当前行
            }
          }
        }
      }
    },

    // 计算Stations表的T2值
    updateStationsT2(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpOfPlatform = currentRow.KP_of_platform_center
        const kpOfSSP = currentRow.KP_of_SSP

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          return
        }

        // 应用公式: =@IF($E4="",IF($G4="","",INDEX(Tracks!E:E,MATCH($G4,Tracks!D:D,dir))),INDEX(Tracks!E:E,MATCH($E4,Tracks!D:D,dir)))

        // 外层IF：$E4=""
        if (kpOfPlatform === '' || kpOfPlatform === undefined) {
          // 内层IF：$G4=""
          if (kpOfSSP === '' || kpOfSSP === undefined) {
            currentRow.T2 = ''
            return
          } else {
            // 使用kpOfSSP作为匹配值，与Tracks表中的KP_after_jump列比较
            const numericSSP = Number(kpOfSSP)
            // 正确的公式是MATCH($G4,Tracks!D:D,dir) - 对应KP_after_jump列
            const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericSSP, tracksData, dir)

            if (matchIndex === -1) {
              currentRow.T2 = ''
              return
            }

            // 返回对应行的Track_ID_after_jump - 对应INDEX(Tracks!E:E,...)
            currentRow.T2 = tracksData[matchIndex].Track_ID_after_jump
          }
        } else {
          // 使用kpOfPlatform作为匹配值，与Tracks表中的KP_after_jump列比较
          const numericPlatform = Number(kpOfPlatform)
          // 正确的公式是MATCH($E4,Tracks!D:D,dir) - 对应KP_after_jump列
          const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericPlatform, tracksData, dir)

          if (matchIndex === -1) {
            currentRow.T2 = ''
            return
          }

          // 返回对应行的Track_ID_after_jump - 对应INDEX(Tracks!E:E,...)
          currentRow.T2 = tracksData[matchIndex].Track_ID_after_jump
        }

        // 添加调试日志来帮助排查问题

      }
    },

    // 辅助方法，在Tracks表中查找匹配值的索引
    findMatchIndexInTracks(columnName, numericValue, tracksData, dir) {
      let matchIndex = -1

      // 根据dir的值决定查找方式
      if (dir === 1) {
        // dir=1时，假设数据是升序排列，查找小于等于numericValue的最大值
        for (let i = 0; i < tracksData.length; i++) {
          const rawValue = tracksData[i][columnName]

          // 跳过空行或值为空字符串的行
          if (rawValue === '' || rawValue === undefined) {
            continue
          }

          const rowValue = Number(rawValue) || 0
          if (rowValue <= numericValue) {
            matchIndex = i
          } else {
            break // 一旦找到大于numericValue的值就停止
          }
        }
      } else {
        // dir=-1时，假设数据是降序排列，查找大于等于numericValue的最小值
        for (let i = 0; i < tracksData.length; i++) {
          const rawValue = tracksData[i][columnName]

          // 跳过空行或值为空字符串的行
          if (rawValue === '' || rawValue === undefined) {
            continue
          }

          const rowValue = Number(rawValue) || 0
          if (rowValue >= numericValue) {
            matchIndex = i
          } else {
            break // 一旦找到小于numericValue的值就停止
          }
        }
      }

      return matchIndex
    },

    // 更新Stations表的Track1值
    updateStationsTrack1(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]

        // Track1默认为空，需要用户手动输入
        // 该方法主要用于触发T1和T2不一致时的视觉警告
      }
    },

    // 更新Stations表的Track2值
    updateStationsTrack2(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const t1Value = currentRow.T1
        const t2Value = currentRow.T2
        const track1Value = currentRow.Track1

        // 应用公式: =IF(AND(D4="",B4=C4),B4,IF(D4="","",D4))
        // 其中D4=Track1, B4=T1, C4=T2
        if (track1Value === '' || track1Value === undefined) {
          // Track1为空的情况
          if (t1Value === t2Value) {
            // 如果T1等于T2，则Track2等于T1
            currentRow.Track2 = t1Value
          } else {
            // 如果T1不等于T2，则Track2为空
            currentRow.Track2 = ''
          }
        } else {
          // Track1不为空，则Track2等于Track1
          currentRow.Track2 = track1Value
        }
      }
    },

    // 计算Stations表的KP of SSP值
    updateStationsKPOfSSP(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpOfPlatform = currentRow.KP_of_platform_center

        // 如果KP_of_platform_center为空，则KP_of_SSP也为空
        if (kpOfPlatform === '' || kpOfPlatform === undefined) {
          currentRow.KP_of_SSP = ''
          return
        }

        // 获取Direction值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取L_train值(列车长度)
        let trainLength = 0
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const trainLengthParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Train length'
          )
          trainLength = trainLengthParam ? Number(trainLengthParam.value) || 0 : 0
        }

        // 计算 KP_of_SSP = KP_of_platform_center + dir * L_train / 2
        const numericKP = Number(kpOfPlatform) || 0
        currentRow.KP_of_SSP = (numericKP + dir * trainLength / 2).toString()
      }
    },

    // 计算Stations表的KP correction值
    updateStationsKPCorrection(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpOfSSP = currentRow.KP_of_SSP
        const track2Value = currentRow.Track2

        // 应用公式: =@IF(G4="","",IF(@INDEX(Tracks!E:E,MATCH(G4,Tracks!D:D,dir))=H4,INDEX(Tracks!G:G,MATCH(G4,Tracks!D:D,dir)),IF(@INDEX(Tracks!E:E,MATCH(G4,Tracks!D:D,dir)+1)=H4,INDEX(Tracks!G:G,MATCH(G4,Tracks!D:D,dir)+1),IF(@INDEX(Tracks!E:E,MATCH(G4,Tracks!D:D,dir)-1)=H4,INDEX(Tracks!G:G,MATCH(G4,Tracks!D:D,dir)-1),NA()))))

        // 如果KP_of_SSP为空，返回空
        if (kpOfSSP === '' || kpOfSSP === undefined) {
          currentRow.KP_correction = ''
          return
        }

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          return
        }

        // 计算MATCH(G4,Tracks!D:D,dir)
        const numericSSP = Number(kpOfSSP)
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericSSP, tracksData, dir)

        // 如果没找到匹配项
        if (matchIndex === -1) {
          currentRow.KP_correction = '#N/A'
          return
        }

        // 检查matchIndex行的Track_ID_after_jump是否等于Track2
        if (tracksData[matchIndex].Track_ID_after_jump === track2Value) {
          // 返回该行的Correction_applied_to_KP值
          currentRow.KP_correction = tracksData[matchIndex].Correction_applied_to_KP
          return
        }

        // 检查matchIndex+1行的Track_ID_after_jump是否等于Track2
        if (matchIndex + 1 < tracksData.length &&
            tracksData[matchIndex + 1].Track_ID_after_jump === track2Value) {
          // 返回下一行的Correction_applied_to_KP值
          currentRow.KP_correction = tracksData[matchIndex + 1].Correction_applied_to_KP
          return
        }

        // 检查matchIndex-1行的Track_ID_after_jump是否等于Track2
        if (matchIndex - 1 >= 0 &&
            tracksData[matchIndex - 1].Track_ID_after_jump === track2Value) {
          // 返回上一行的Correction_applied_to_KP值
          currentRow.KP_correction = tracksData[matchIndex - 1].Correction_applied_to_KP
          return
        }

        // 如果都不匹配，返回NA()
        currentRow.KP_correction = '#N/A'
      }
    },

    // 计算Stations表的Distance of PF center
    updateStationsDistanceOfPFCenter(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpOfPlatform = currentRow.KP_of_platform_center
        const kpCorrection = currentRow.KP_correction

        // 应用公式: =IF(E4="","",(E4+I4)*dir)
        // 如果KP_of_platform_center为空，返回空
        if (kpOfPlatform === '' || kpOfPlatform === undefined) {
          currentRow.Distance_of_PF_center = ''
          return
        }

        // 如果KP_correction为#N/A，结果也应该是#N/A
        if (kpCorrection === '#N/A') {
          currentRow.Distance_of_PF_center = '#N/A'
          return
        }

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 处理KP_correction
        let correctionValue = 0
        if (kpCorrection !== '' && kpCorrection !== undefined) {
          correctionValue = Number(kpCorrection) || 0
        }

        // 计算(KP_of_platform_center + KP_correction) * dir
        const numericKP = Number(kpOfPlatform) || 0
        currentRow.Distance_of_PF_center = (numericKP + correctionValue) * dir
      }
    },

    // 计算Stations表的Distance of SSP
    updateStationsDistanceOfSSP(index) {
      if (this.activeSheet === 'Stations') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpOfSSP = currentRow.KP_of_SSP
        const kpCorrection = currentRow.KP_correction

        // 应用公式: =IF(G4="","",(G4+I4)*dir)
        // 如果KP_of_SSP为空，返回空
        if (kpOfSSP === '' || kpOfSSP === undefined) {
          currentRow.Distance_of_SSP = ''
          return
        }

        // 如果KP_correction为#N/A，结果也应该是#N/A
        if (kpCorrection === '#N/A') {
          currentRow.Distance_of_SSP = '#N/A'
          return
        }

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 处理KP_correction
        let correctionValue = 0
        if (kpCorrection !== '' && kpCorrection !== undefined) {
          correctionValue = Number(kpCorrection) || 0
        }

        // 计算(KP_of_SSP + KP_correction) * dir
        const numericKP = Number(kpOfSSP) || 0
        currentRow.Distance_of_SSP = (numericKP + correctionValue) * dir
      }
    },

    // 计算PSR表的T1值
    updatePSRT1(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP

        // 应用公式: =@IF($E7="","",IF(@INDEX(Tracks!C:C,MATCH($E7,Tracks!C:C,dir))=$E7,INDEX(Tracks!B:B,MATCH($E7,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($E7,Tracks!C:C,dir)+1)))

        // 如果KP为空，则T1也为空
        if (kpValue === '' || kpValue === undefined) {
          currentRow.T1 = ''
          return
        }

        // 获取Direction值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel].Tracks) {
          return
        }
        const tracksData = this.excelFiles[this.activeExcel].Tracks.data

        // 在Tracks表中查找KP before jump列与当前KP匹配的行
        const numericKP = Number(kpValue)

        // 使用findMatchIndexInTracks查找匹配索引 - 匹配C列(KP before jump)
        const matchIndex = this.findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)
        if (matchIndex === -1) {
          currentRow.T1 = ''
          return
        }

        // 检查找到的KP before jump是否等于当前KP
        const matchedKPBeforeJump = Number(tracksData[matchIndex].KP_before_jump) || 0

        if (matchedKPBeforeJump === numericKP) {
          // 如果相等，返回对应行的Track ID before jump
          currentRow.T1 = tracksData[matchIndex].Track_ID_before_jump
        } else {
          // 如果不等于，返回下一行的Track ID before jump
          const nextIndex = matchIndex + 1
          if (nextIndex < tracksData.length) {
            currentRow.T1 = tracksData[nextIndex].Track_ID_before_jump
          } else {
            currentRow.T1 = ''
          }
        }
      }
    },

    // 计算PSR表的T2值
    updatePSRT2(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP

        // 应用公式: =@IF($E7="","",INDEX(Tracks!E:E,MATCH($E7,Tracks!D:D,dir)))

        // 如果KP为空，则T2也为空
        if (kpValue === '' || kpValue === undefined) {
          currentRow.T2 = ''
          return
        }

        // 获取Direction值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel].Tracks) {
          return
        }
        const tracksData = this.excelFiles[this.activeExcel].Tracks.data

        // 在Tracks表中查找KP after jump列与当前KP匹配的行
        const numericKP = Number(kpValue)

        // 使用findMatchIndexInTracks查找匹配索引 - 匹配D列(KP after jump)
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)
        if (matchIndex === -1) {
          currentRow.T2 = ''
          return
        }

        // 返回匹配行的Track ID after jump
        currentRow.T2 = tracksData[matchIndex].Track_ID_after_jump
      }
    },

    // 计算PSR表的KP correction值
    updatePSRKPCorrection(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP
        const track2Value = currentRow.Track2

        // 应用公式: =@IF(E7="","",IF(@INDEX(Tracks!E:E,MATCH(E7,Tracks!D:D,dir))=G7,INDEX(Tracks!G:G,MATCH(E7,Tracks!D:D,dir)),IF(@INDEX(Tracks!E:E,MATCH(E7,Tracks!D:D,dir)+1)=G7,INDEX(Tracks!G:G,MATCH(E7,Tracks!D:D,dir)+1),IF(@INDEX(Tracks!E:E,MATCH(E7,Tracks!D:D,dir)-1)=G7,INDEX(Tracks!G:G,MATCH(E7,Tracks!D:D,dir)-1),NA()))))

        // 如果KP为空，返回空
        if (kpValue === '' || kpValue === undefined) {
          currentRow.KP_correction = ''
          return
        }

        // 获取Direction值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel].Tracks) {
          return
        }
        const tracksData = this.excelFiles[this.activeExcel].Tracks.data

        // 在Tracks表中查找KP after jump列与当前KP匹配的行
        const numericKP = Number(kpValue)

        // 使用findMatchIndexInTracks查找匹配索引 - 匹配D列(KP after jump)
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)
        if (matchIndex === -1) {
          currentRow.KP_correction = '#N/A'
          return
        }

        // 将Track2值和Track_ID_after_jump都转换为字符串进行比较
        const track2String = String(track2Value)
        const trackIDString = String(tracksData[matchIndex].Track_ID_after_jump)

        // 检查matchIndex行的Track_ID_after_jump是否等于Track2
        if (trackIDString === track2String) {
          // 返回该行的Correction_applied_to_KP值
          currentRow.KP_correction = tracksData[matchIndex].Correction_applied_to_KP
          return
        }

        // 检查matchIndex+1行的Track_ID_after_jump是否等于Track2
        if (matchIndex + 1 < tracksData.length) {
          const nextTrackIDString = String(tracksData[matchIndex + 1].Track_ID_after_jump)
          if (nextTrackIDString === track2String) {
            // 返回下一行的Correction_applied_to_KP值
            currentRow.KP_correction = tracksData[matchIndex + 1].Correction_applied_to_KP
            return
          }
        }

        // 检查matchIndex-1行的Track_ID_after_jump是否等于Track2
        if (matchIndex - 1 >= 0) {
          const prevTrackIDString = String(tracksData[matchIndex - 1].Track_ID_after_jump)
          if (prevTrackIDString === track2String) {
            // 返回上一行的Correction_applied_to_KP值
            currentRow.KP_correction = tracksData[matchIndex - 1].Correction_applied_to_KP
            return
          }
        }

        // 如果都不匹配，返回NA()
        currentRow.KP_correction = '#N/A'
      }
    },

    // 计算PSR表的Distance值
    updatePSRDistance(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const kpValue = currentRow.KP
        const kpCorrection = currentRow.KP_correction

        // 应用公式: =IF(ISTEXT(E6),-100000,IF(E6="",MAX(100000,I6+1),(E6+H6)*dir))

        // 获取Direction值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 如果KP是文本类型（在JavaScript中，这通常指的是非数值字符串）
        if (kpValue !== '' && kpValue !== undefined && isNaN(Number(kpValue))) {
          currentRow.Distance = -100000
          return
        }

        // 如果KP为空
        if (kpValue === '' || kpValue === undefined) {
          // 获取前一行的Distance值
          let prevDistance = 100000
          if (index > 0) {
            const prevRow = this.currentSheets[this.activeSheet].data[index - 1]
            if (prevRow.Distance !== '' && prevRow.Distance !== undefined && !isNaN(Number(prevRow.Distance))) {
              prevDistance = Number(prevRow.Distance)
            }
          }

          // 取MAX(100000, 前一行的Distance+1)
          currentRow.Distance = Math.max(100000, prevDistance + 1)
        } else {
          // 如果KP_correction为#N/A，则Distance也为#N/A
          if (kpCorrection === '#N/A') {
            currentRow.Distance = '#N/A'
            return
          }

          // 计算(KP + KP_correction) * dir
          const numericKP = Number(kpValue) || 0
          const numericCorrection = Number(kpCorrection) || 0
          currentRow.Distance = (numericKP + numericCorrection) * dir
        }
      }
    },

    // 计算PSR表的Track2值
    updatePSRTrack2(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const track1Value = currentRow.Track1
        const t1Value = currentRow.T1
        const t2Value = currentRow.T2

        // 应用公式: =IF(AND(D7="",B7=C7),B7,IF(D7="","",D7))
        // 其中D7=Track1, B7=T1, C7=T2

        if (track1Value === '' || track1Value === undefined) {
          // 如果Track1为空
          if (t1Value === t2Value) {
            // 如果T1等于T2，则Track2为T1的值
            currentRow.Track2 = t1Value
          } else {
            // 如果T1不等于T2，则Track2为空
            currentRow.Track2 = ''
          }
        } else {
          // 如果Track1不为空，则Track2等于Track1
          currentRow.Track2 = track1Value
        }
      }
    },

    // 计算PSR表的PSR_ms值
    updatePSRMs(index) {
      if (this.activeSheet === 'PSR') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const psrValue = currentRow.PSR

        // 应用公式: =IF(ISTEXT(F6),max_PSR/3.6,IF(F6="",J6,F6/3.6))
        // 其中F6=PSR, J6=前一行的PSR_ms, max_PSR是Gen. Param.表中的Max PSR值

        // 获取Gen. Param.表中的Max PSR值
        let maxPSR = 0
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const maxPSRParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Max PSR'
          )
          maxPSR = maxPSRParam ? Number(maxPSRParam.value) || 0 : 0
        }

        // 如果PSR是文本
        if (psrValue !== '' && psrValue !== undefined && isNaN(Number(psrValue))) {
          currentRow.PSR_ms = (maxPSR / 3.6).toFixed(2)
          return
        }

        // 如果PSR为空
        if (psrValue === '' || psrValue === undefined) {
          // 获取前一行的PSR_ms值
          if (index > 0) {
            const prevRow = this.currentSheets[this.activeSheet].data[index - 1]
            currentRow.PSR_ms = prevRow.PSR_ms
          } else {
            currentRow.PSR_ms = ''
          }
          return
        }

        // 其他情况：PSR/3.6
        const numericPSR = Number(psrValue) || 0
        currentRow.PSR_ms = (numericPSR / 3.6).toFixed(2)
      }
    },

    // 添加用于更新所有PSR行的Track2和PSR_ms值的方法
    updateAllPSRTrack2AndPsrMs() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].PSR) {
        const psrRows = this.excelFiles[this.activeExcel].PSR.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'PSR' // 临时设置为PSR表以便计算

        for (let i = 0; i < psrRows.length; i++) {
          this.updatePSRTrack2(i)
          this.updatePSRMs(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有PSR行的KP correction和Distance值的方法
    updateAllPSRKPCorrectionsAndDistances() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].PSR) {
        const psrRows = this.excelFiles[this.activeExcel].PSR.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'PSR' // 临时设置为PSR表以便计算

        for (let i = 0; i < psrRows.length; i++) {
          this.updatePSRKPCorrection(i)
          this.updatePSRDistance(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加用于更新所有PSR行的T1和T2值的方法
    updateAllPSRTValues() {
      if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel].PSR) {
        const psrRows = this.excelFiles[this.activeExcel].PSR.data
        const originalActiveSheet = this.activeSheet // 保存原始选中的工作表
        this.activeSheet = 'PSR' // 临时设置为PSR表以便计算

        for (let i = 0; i < psrRows.length; i++) {
          this.updatePSRT1(i)
          this.updatePSRT2(i)
        }

        this.activeSheet = originalActiveSheet // 恢复原始选中的工作表
      }
    },

    // 添加新方法处理 running_profile.json 数据
    async loadRunningProfileData() {
      try {
        const response = await fetch('/data/Running_profile/running_profile.json')
        const data = await response.json()

        // 创建 Running list 工作表
        const runningListSheet = {
          headers: [
            { prop: 'departureStation', label: 'Departure Station name' },
            { prop: 'departureDistance', label: 'Departure Station Distance' },
            { prop: 'arrivalStation', label: 'Arrival Station name' },
            { prop: 'arrivalDistance', label: 'Arrival Station Distance' },
            { prop: 'track', label: 'Track' },
            { prop: 'train', label: 'Train' },
            { prop: 'trainLoad', label: 'train load [0 1]' },
            { prop: 'stationStopTime', label: 'Station Stop Time' }
          ],
          data: data.map(item => ({
            departureStation: item[0],
            departureDistance: item[1],
            arrivalStation: item[2],
            arrivalDistance: item[3],
            track: item[4],
            train: item[5],
            trainLoad: item[6],
            stationStopTime: item[7] || ''
          }))
        }

        // 更新 excelFiles
        this.excelFiles = {
          'running_profile.xls': {
            'Running list': runningListSheet
          }
        }

        this.activeExcel = 'running_profile.xls'
        this.activeSheet = 'Running list'

        // 重置数据修改标记
        this.dataModified = false
      } catch (error) {
        this.loadError = '加载运行配置文件失败'
      }
    },

    // 判断是否为运行配置文件
    isRunningProfileFile() {
      return this.activeExcel === 'running_profile.xls' || this.activeExcel === 'api_running_profile.xls'
    },

    // 处理计算按钮点击事件
    handleCalculate() {
      this.showCalculation = !this.showCalculation
    },

    // 计算通行时间
    calculateTravelTime() {
      // 设置状态为计算中
      this.calculationState.travelTime.status = 'warning'
      this.calculationState.travelTime.percentage = 70

      // 模拟计算过程
      setTimeout(() => {
        // 模拟计算成功
        this.calculationState.travelTime.status = 'success'
        this.calculationState.travelTime.percentage = 100

        // 启用计算最小间隔时间按钮
        this.calculationState.minHeadway.enabled = true

        // 设置计算结果
        this.calculationResults.travelTime = {
          time: '3.5分钟',
          details: '通行时间计算完成，详细数据已生成'
        }

        this.$message({
          type: 'success',
          message: '通行时间计算成功！'
        })
      }, 2000) // 模拟2秒的计算时间
    },

    // 计算最小间隔时间
    calculateMinHeadway() {
      if (!this.calculationState.minHeadway.enabled) {
        this.$message({
          type: 'warning',
          message: '请先计算通行时间！'
        })
        return
      }

      // 设置状态为计算中
      this.calculationState.minHeadway.status = 'warning'
      this.calculationState.minHeadway.percentage = 70

      // 模拟计算过程
      setTimeout(() => {
        // 模拟计算成功
        this.calculationState.minHeadway.status = 'success'
        this.calculationState.minHeadway.percentage = 100

        // 设置计算结果
        this.calculationResults.minHeadway = {
          time: '2分钟',
          details: '最小间隔时间计算完成，详细数据已生成'
        }

        this.$message({
          type: 'success',
          message: '最小间隔时间计算成功！'
        })
      }, 3000) // 模拟3秒的计算时间
    },

    // 导出计算结果为Excel文件
    exportResultToExcel(calculationType) {
      const type = calculationType === 'travelTime' ? 'transit-time' : 'min-headway'
      const params = {
        projectId: this.selectedFile?.projectId || 1,
        result: this.calculationResults[calculationType]
      }

      // 未来集成API时替换此处代码
      // runningProfileApi.exportResultToExcel(type, params).then(response => {
      //   // 处理二进制文件下载
      //   const blob = new Blob([response.data])
      //   const link = document.createElement('a')
      //   link.href = URL.createObjectURL(blob)
      //   link.download = `${type}-result.xlsx`
      //   link.click()
      //   URL.revokeObjectURL(link.href)
      //   this.$message.success('导出成功')
      // }).catch(error => {
      //   this.$message.error('导出失败：' + error.message)
      // })

      this.$message({
        type: 'success',
        message: `已导出${calculationType === 'travelTime' ? '通行时间' : '最小间隔时间'}计算结果到Excel文件`
      })
    },

    // 导出计算结果为图片文件
    exportResultToImage(calculationType) {
      const type = calculationType === 'travelTime' ? 'transit-time' : 'min-headway'
      const params = {
        projectId: this.selectedFile?.projectId || 1,
        result: this.calculationResults[calculationType]
      }

      // 未来集成API时替换此处代码
      // runningProfileApi.exportResultToImage(type, params).then(response => {
      //   // 处理二进制文件下载
      //   const blob = new Blob([response.data])
      //   const link = document.createElement('a')
      //   link.href = URL.createObjectURL(blob)
      //   link.download = `${type}-result.png`
      //   link.click()
      //   URL.revokeObjectURL(link.href)
      //   this.$message.success('导出成功')
      // }).catch(error => {
      //   this.$message.error('导出失败：' + error.message)
      // })

      this.$message({
        type: 'success',
        message: `已导出${calculationType === 'travelTime' ? '通行时间' : '最小间隔时间'}计算结果到图片文件`
      })
    },

    // 使用摄氏度、华氏度和最初环境格式展示温度
    formatTemperature(value) {
      if (value === null || value === undefined) return ''
      const temp = parseFloat(value)
      if (isNaN(temp)) return value
      return `${temp}°C (${(temp * 9/5 + 32).toFixed(1)}°F)`
    },

    // 计算T2值
    calculateT2(data) {
      if (!data || !Array.isArray(data)) return

      data.forEach((currentRow, index) => {
        if (currentRow) {
          const kpOfPlatform = parseFloat(currentRow.KP_of_platform_center)
          const kpOfSSP = parseFloat(currentRow.KP_of_SSP)

          if (!isNaN(kpOfPlatform) && !isNaN(kpOfSSP)) {
            // 计算T2值
            currentRow.T2 = Math.abs(kpOfSSP - kpOfPlatform).toFixed(3)
          }
        }
      })
      return data
    },

    // 处理单行数据的计算
    handleSingleRowCalculate(row, index) {
      // 如果是查看结果状态，直接打开对话框显示结果
      if (this.hasCalculationResults(row, index)) {
        this.selectedCalculationRow = {
          data: row,
          index: index
        };
        this.calculationDialogVisible = true;
        return;
      }

      // 如果正在计算，不做任何操作
      if (this.isCalculating(row)) {
        return;
      }

      // 设置当前选中行
      this.selectedCalculationRow = {
        data: row,
        index: index
      };

      // 重置计算状态
      this.resetCalculationState();

      // 显示计算对话框
      this.calculationDialogVisible = true;
    },

    // 重置计算状态
    resetCalculationState() {
      // 只重置状态，不清除结果
      this.calculationState.travelTime.status = '';
      this.calculationState.travelTime.percentage = 0;
      this.calculationState.minHeadway.status = '';
      this.calculationState.minHeadway.percentage = 0;
      this.calculationState.minHeadway.enabled = !!this.calculationResults.travelTime;
    },

    // 获取计算按钮文本
    getCalculationButtonText(row) {
      if (!row || !row.id) return "计算";

      // 获取行ID以标识行
      const rowId = this.getRowId(row);

      // 检查是否正在计算
      if (this.calculatedRows[rowId] && this.calculatedRows[rowId].calculating) {
        return "计算中";
      }

      // 检查是否已计算
      if (this.hasCalculationResults(row)) {
        return "查看结果";
      }

      return "计算";
    },

    // 获取按钮类型
    getCalculationButtonType(row) {
      if (this.hasCalculationResults(row)) {
        return "success"; // 已计算完成显示绿色
      }
      return "warning"; // 默认显示黄色
    },

    // 检查是否正在计算
    isCalculating(row) {
      if (!row) return false;
      const rowId = this.getRowId(row);
      return this.calculatedRows[rowId] && this.calculatedRows[rowId].calculating;
    },

    // 检查行是否有计算结果
    hasCalculationResults(row) {
      if (!row) return false;
      const rowId = this.getRowId(row);
      return this.calculatedRows[rowId] && this.calculatedRows[rowId].calculated;
    },

    // 获取行ID
    getRowId(row) {
      // 使用一个唯一标识符，如果有id使用id，否则使用组合字符串
      return row.id || `${row.departureStation}-${row.arrivalStation}-${row.track}-${row.train}`;
    },

    // 对单行数据计算通行时间
    calculateTravelTimeForRow() {
      if (!this.selectedCalculationRow) return;

      const row = this.selectedCalculationRow.data;
      const rowId = this.getRowId(row);

      // 设置状态为计算中
      this.calculationState.travelTime.status = 'warning';
      this.calculationState.travelTime.percentage = 70;

      // 更新行计算状态
      this.$set(this.calculatedRows, rowId, {
        calculating: true,
        calculated: false
      });

      // 这里可以使用行数据进行特定计算
      setTimeout(() => {
        // 模拟计算成功
        this.calculationState.travelTime.status = 'success';
        this.calculationState.travelTime.percentage = 100;

        // 启用计算最小间隔时间按钮
        this.calculationState.minHeadway.enabled = true;

        // 设置计算结果，可以使用行特定数据
        this.calculationResults.travelTime = {
          time: '3.2分钟',
          details: `从 ${row.departureStation || row.Departure_Station_name} 到 ${row.arrivalStation || row.Arrival_Station_name} 的通行时间计算完成`
        };

        // 更新行计算状态
        this.$set(this.calculatedRows, rowId, {
          calculating: false,
          calculated: true
        });

        this.$message({
          type: 'success',
          message: '通行时间计算成功！'
        });
      }, 2000); // 模拟2秒的计算时间
    },

    // 对单行数据计算最小间隔时间
    calculateMinHeadwayForRow() {
      if (!this.selectedCalculationRow || !this.calculationState.minHeadway.enabled) {
        this.$message({
          type: 'warning',
          message: '请先计算通行时间！'
        });
        return;
      }

      const row = this.selectedCalculationRow.data;

      // 设置状态为计算中
      this.calculationState.minHeadway.status = 'warning';
      this.calculationState.minHeadway.percentage = 70;

      // 这里可以使用行数据进行特定计算
      setTimeout(() => {
        // 模拟计算成功
        this.calculationState.minHeadway.status = 'success';
        this.calculationState.minHeadway.percentage = 100;

        // 设置计算结果，可以使用行特定数据
        this.calculationResults.minHeadway = {
          time: '1.8分钟',
          details: `从 ${row.departureStation || row.Departure_Station_name} 到 ${row.arrivalStation || row.Arrival_Station_name} 的最小间隔时间计算完成`
        };

        this.$message({
          type: 'success',
          message: '最小间隔时间计算成功！'
        });
      }, 3000); // 模拟3秒的计算时间
    },

    // 在updateAllStationsFields方法之后添加
    // 添加更新所有Block description行的方法
    updateAllBlockDescriptionFields() {
      if (this.activeSheet === 'Block description' && this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Block description']) {
        const rows = this.excelFiles[this.activeExcel]['Block description'].data

        // 更新每一行的字段
        for (let i = 0; i < rows.length; i++) {
          this.updateStartT1(i)
          this.updateStartT2(i)
          this.updateStartTrack(i) // 这里已经包含了对updateTrack2的调用
          this.updateKPCorrection(i)
          this.updateStartDistance(i)
        }
      }
    },

    // 计算Block description表中的Start_T1值
    updateStartT1(index) {
      if (this.activeSheet === 'Block description') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const startKp = currentRow.SubBlock_Start  // Start_KP字段

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0 || startKp === '' || startKp === undefined) {
          currentRow.Start_T1 = ''
          return
        }

        // 应用公式：=@IF($Start_KP字段="","",IF(@INDEX(Tracks!C:C,MATCH($Start_KP字段,Tracks!C:C,dir))=$Start_KP字段,INDEX(Tracks!B:B,MATCH($Start_KP字段,Tracks!C:C,dir)),INDEX(Tracks!B:B,MATCH($Start_KP字段,Tracks!C:C,dir)+1)))
        // C列是KP before jump (m)，B列是Track ID before jump

        const numericKP = Number(startKp)
        // 在Tracks表中查找匹配的KP before jump
        const matchIndex = this.findMatchIndexInTracks('KP_before_jump', numericKP, tracksData, dir)

        if (matchIndex === -1) {
          currentRow.Start_T1 = ''
          return
        }

        // 检查找到的值是否与startKP完全匹配
        const matchedKP = Number(tracksData[matchIndex].KP_before_jump) || 0
        if (matchedKP === numericKP) {
          // 完全匹配，返回当前行的Track_ID_before_jump
          currentRow.Start_T1 = tracksData[matchIndex].Track_ID_before_jump
        } else {
          // 不完全匹配的情况下，根据dir和KP值关系决定使用哪一行
          if (dir === 1) {
            // dir=1(升序)模式下，如果找到的KP值小于目标KP值，应该使用当前行的值
            if (matchedKP < numericKP) {
              currentRow.Start_T1 = tracksData[matchIndex].Track_ID_before_jump
            } else {
              // 如果找到的KP值大于目标KP值(不应该出现这种情况，但为了健壮性也处理)
              // 尝试使用上一行的值
              const prevIndex = matchIndex > 0 ? matchIndex - 1 : matchIndex
              currentRow.Start_T1 = tracksData[prevIndex].Track_ID_before_jump
            }
          } else {
            // dir=-1(降序)模式下，如果找到的KP值大于目标KP值，应该使用当前行的值
            if (matchedKP > numericKP) {
              currentRow.Start_T1 = tracksData[matchIndex].Track_ID_before_jump
            } else {
              // 如果找到的KP值小于目标KP值(不应该出现这种情况)
              // 尝试使用上一行的值
              const prevIndex = matchIndex > 0 ? matchIndex - 1 : matchIndex
              currentRow.Start_T1 = tracksData[prevIndex].Track_ID_before_jump
            }
          }
        }
      }
    },

    // 计算Block description表中的Start_T2值
    updateStartT2(index) {
      if (this.activeSheet === 'Block description') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const startKp = currentRow.SubBlock_Start  // Start_KP字段

        // 获取 Direction 值
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0 || startKp === '' || startKp === undefined) {
          currentRow.Start_T2 = ''
          return
        }

        // 应用公式：=@IF($Start_KP字段="","",INDEX(Tracks!E:E,MATCH($Start_KP字段,Tracks!D:D,dir)))
        // D列是KP after jump (m)，E列是Track ID after jump

        const numericKP = Number(startKp)
        // 在Tracks表中查找匹配的KP after jump
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

        if (matchIndex === -1) {
          currentRow.Start_T2 = ''
          return
        }

        // 返回对应行的Track_ID_after_jump
        currentRow.Start_T2 = tracksData[matchIndex].Track_ID_after_jump
      }
    },

    // 更新Start_Track字段，如果Track1和Track2不匹配显示提示框
    updateStartTrack(index) {
      if (this.activeSheet === 'Block description') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const t1 = currentRow.Start_T1
        const t2 = currentRow.Start_T2

        // 如果T1和T2都存在但不相等，设置蓝色提示框
        if (t1 && t2 && t1 !== t2) {
          // 设置提示标记
          this.$set(currentRow, '_cellPrompts', {
            ...currentRow._cellPrompts,
            Start_Track: true
          })
        } else {
          // 删除提示标记（如果存在）
          if (currentRow._cellPrompts && currentRow._cellPrompts.Start_Track) {
            this.$delete(currentRow._cellPrompts, 'Start_Track')
          }
        }

        // 计算完Start_Track后，更新Track2
        this.updateTrack2(index)
      }
    },

    // 计算Block description表中的Track2值
    updateTrack2(index) {
      if (this.activeSheet === 'Block description') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const startT1 = currentRow.Start_T1
        const startT2 = currentRow.Start_T2
        const startTrack = currentRow.Start_Track

        // 应用公式: =IF(AND(D3="",B3=C3),B3,IF(D3="","",D3))
        // D3=Start_Track, B3=Start_T1, C3=Start_T2

        // 第一层判断：如果Start_Track为空且Start_T1等于Start_T2
        if ((!startTrack || startTrack === '') && startT1 === startT2) {
          // 返回Start_T1的值
          currentRow.Track2 = startT1
        }
        // 第二层判断：如果Start_Track为空
        else if (!startTrack || startTrack === '') {
          // 返回空值
          currentRow.Track2 = ''
        }
        // 否则返回Start_Track的值
        else {
          currentRow.Track2 = startTrack
        }
      }
    },

    handleSheetChange(sheetName) {
      // 处理工作表切换
      if (sheetName === 'Stations') {
        this.updateAllStationsFields()
      } else if (sheetName === 'Block description') {
        this.updateAllBlockDescriptionFields()
      }
    },

    // 计算Block description表中的KP_correction值
    updateKPCorrection(index) {
      if (this.activeSheet === 'Block description') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const startKP = currentRow.SubBlock_Start  // G列: Start-KP
        const trackValue = currentRow.SubBlock_Track  // I列: Track

        // 最外层判断：如果Start-KP为空，返回空值
        if (!startKP || startKP === '') {
          currentRow.KP_correction = ''
          return
        }

        // 获取Direction参数
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 获取Tracks表数据
        if (!this.excelFiles[this.activeExcel] || !this.excelFiles[this.activeExcel]['Tracks'] ||
            !this.excelFiles[this.activeExcel]['Tracks'].data) {
          currentRow.KP_correction = '#N/A'
          return
        }

        const tracksData = this.excelFiles[this.activeExcel]['Tracks'].data
        if (tracksData.length === 0) {
          currentRow.KP_correction = '#N/A'
          return
        }

        // 核心匹配逻辑：在Tracks表的KP_after_jump列中查找匹配Start-KP的位置
        const numericKP = Number(startKP)
        const matchIndex = this.findMatchIndexInTracks('KP_after_jump', numericKP, tracksData, dir)

        if (matchIndex === -1) {
          currentRow.KP_correction = '#N/A'
          return
        }

        // 三层判断逻辑：
        // 1. 检查匹配行的Track_ID_after_jump是否等于SubBlock_Track
        if (tracksData[matchIndex].Track_ID_after_jump === trackValue) {
          currentRow.KP_correction = tracksData[matchIndex].Correction_applied_to_KP
          return
        }

        // 2. 检查匹配行的下一行
        if (matchIndex + 1 < tracksData.length &&
            tracksData[matchIndex + 1].Track_ID_after_jump === trackValue) {
          currentRow.KP_correction = tracksData[matchIndex + 1].Correction_applied_to_KP
          return
        }

        // 3. 检查匹配行的上一行
        if (matchIndex > 0 &&
            tracksData[matchIndex - 1].Track_ID_after_jump === trackValue) {
          currentRow.KP_correction = tracksData[matchIndex - 1].Correction_applied_to_KP
          return
        }

        // 如果所有条件都不满足，返回#N/A
        currentRow.KP_correction = '#N/A'
      }
    },

    // 计算Block description表中的Start distance值
    updateStartDistance(index) {
      if (this.activeSheet === 'Block description') {
        const currentRow = this.currentSheets[this.activeSheet].data[index]
        const startKP = currentRow.SubBlock_Start  // G列: Start-KP
        const kpCorrection = currentRow.KP_correction  // J列: KP correction

        // 获取Direction参数
        let dir = 1
        if (this.excelFiles[this.activeExcel] && this.excelFiles[this.activeExcel]['Gen. Param.']) {
          const directionParam = this.excelFiles[this.activeExcel]['Gen. Param.'].data.find(
            item => item.paramName === 'Direction'
          )
          dir = directionParam ? Number(directionParam.value) || 1 : 1
        }

        // 应用公式: =IF(ISTEXT(G3),-100000,IF(G3="",MAX(100000,K3+1),(G3+J3)*dir))

        // 第一层判断：检查Start-KP是否为文本
        if (typeof startKP === 'string' && isNaN(Number(startKP)) && startKP !== '') {
          // 如果是文本且不是空字符串，返回-100000
          currentRow.SubBlock_StartDistance = -100000
          return
        }

        // 第二层判断：检查Start-KP是否为空
        if (!startKP || startKP === '') {
          // 获取上一行的Start distance + 1（如果存在）
          let maxValue = 100000
          if (index > 0) {
            const prevRow = this.currentSheets[this.activeSheet].data[index - 1]
            const prevStartDistance = Number(prevRow.SubBlock_StartDistance)
            if (!isNaN(prevStartDistance)) {
              maxValue = Math.max(100000, prevStartDistance + 1)
            }
          }
          currentRow.SubBlock_StartDistance = maxValue
          return
        }

        // 最终计算：(Start-KP + KP correction) * dir
        // KP correction可能是#N/A或空值，需要处理
        let kpCorrectionValue = 0
        if (kpCorrection !== '#N/A' && kpCorrection !== '' && !isNaN(Number(kpCorrection))) {
          kpCorrectionValue = Number(kpCorrection)
        }

        // 计算结果
        const result = (Number(startKP) + kpCorrectionValue) * dir
        currentRow.SubBlock_StartDistance = !isNaN(result) ? result : 0
      }
    },
  }
}
</script>

<style scoped>
/* 样式 */
.loading-status {
  padding: 15px;
  color: #409EFF;
  text-align: center;
  font-size: 14px;
}

.error-alert, .sync-status {
  margin-bottom: 20px;
}

.app-container {
  padding: 20px;
}

.excel-control {
  margin-bottom: 20px;
}

/* 文本居中的输入框 */
.text-center /deep/ .el-input__inner {
  text-align: center;
}

.sheet-control {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-top: 20px;
  background-color: #f6f8fa;
  border-radius: 8px;
  padding: 12px 15px;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.sheet-title-container {
  display: flex;
  align-items: center;
}

.sheet-title {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
  white-space: nowrap;
  margin: 0;
}

.sheet-select {
  width: 160px;
}

.sheet-select /deep/ .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.sheet-select /deep/ .el-select-dropdown__item.selected {
  color: #409EFF;
  font-weight: bold;
}

.export-control {
  margin-top: 20px;
  text-align: center;
}

/* 隐藏滚动条 */
.sheet-buttons-container::-webkit-scrollbar {
  display: none;
}

.current-path {
  margin-bottom: 15px;
  font-size: 14px;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-sidebar {
  margin-bottom: 20px;
}

.folder-menu {
  border-right: none;
  background-color: transparent;
}

.folder-menu .el-submenu__title {
  height: 40px;
  line-height: 40px;
  padding: 0 20px 0 10px;
  font-size: 14px;
}

.folder-menu .el-submenu__title:hover {
  background-color: #ecf5ff;
}

.folder-menu .el-menu-item {
  height: 36px;
  line-height: 36px;
  padding: 0 20px 0 40px;
  font-size: 13px;
}

.folder-menu .el-menu-item.is-active {
  color: #409EFF;
  background-color: #ecf5ff;
}

.folder-menu .el-submenu .el-menu-item:hover {
  background-color: #f5f7fa;
}

.folder-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-submenu [class^=el-icon-] {
  vertical-align: middle;
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
}

.el-menu-item [class^=el-icon-] {
  margin-right: 5px;
  width: 24px;
  text-align: center;
  font-size: 18px;
  color: #909399;
}

.el-icon-folder {
  color: #E6A23C;
}

.el-icon-document {
  color: #409EFF;
}

.el-card__header {
  padding: 12px 20px;
  font-weight: bold;
  background-color: #f5f7fa;
}

.excel-header {
  margin-bottom: 15px;
}

.excel-title {
  font-size: 18px;
  font-weight: normal;
  color: #606266;
  margin: 0;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.right-container {
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 添加新样式 */
.sheet-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-top: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.toolbar-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-right .el-button {
  padding: 7px 15px;
}

.toolbar-label {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
  white-space: nowrap;
}

.content-card {
  margin-bottom: 20px;
}

.folder-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.folder-header span {
  margin-bottom: 8px;
}

.search-wrapper {
  width: 100%;
  margin: 8px 0;
}

.search-input {
  margin-top: 5px;
  margin-bottom: 5px;
  width: 100%;
  z-index: 10;
}

.search-input /deep/ .el-input__inner {
  color: #303133 !important;
  font-weight: normal !important;
  background-color: #fff !important;
  border: 1px solid #DCDFE6;
}

.folder-title {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.folder-title:hover .el-icon-lock {
  opacity: 1;
}

.folder-title .el-icon-lock {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.insert-btn {
  margin-right: 5px;
}

.el-table .cell {
  white-space: normal !important;
  word-break: break-all;
  line-height: 1.5;
}

.operation-buttons {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  white-space: nowrap;
}

.operation-buttons .el-button {
  padding: 7px 10px;
  margin-right: 5px;
}

.operation-buttons .el-button:last-child {
  margin-right: 0;
}

.row-form .el-form-item {
  margin-bottom: 15px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 15px;
}

.row-form .el-form-item__label {
  font-weight: normal;
  color: #606266;
}

.row-form .el-input {
  width: 100%;
}

.el-table .el-input {
  width: 100%;
}

.el-table .el-input__inner {
  padding-right: 5px;
  padding-left: 5px;
  font-size: 12px;
}

/* 表格单元格自适应内容宽度 */
.el-table /deep/ .el-table__body td {
  min-width: 0;
  box-sizing: border-box;
}

/* 提高数字类单元格的可读性 */
.el-table /deep/ .el-input-number .el-input__inner {
  text-align: right;
}

/* 调整表格布局，使列宽能够适应内容 */
.el-table {
  table-layout: auto !important;
}

/* 优化数字显示 */
.cell-input {
  width: 100%;
}

.el-table /deep/ .numeric-cell .cell {
  overflow: visible;
}

.el-table /deep/ .numeric-cell .el-input__inner {
  text-align: right;
  font-family: 'Courier New', monospace;
  padding-right: 8px;
  font-size: 13px;
}

.el-table /deep/ .disabled-cell .el-input__inner {
  background-color: #f5f7fa;
  color: #606266;
}

/* 确保表格能够展示完整内容 */
.el-table /deep/ .el-table__body-wrapper {
  overflow-x: auto;
}

.el-table /deep/ .el-table__body {
  width: 100%;
  table-layout: fixed;
}

.el-table /deep/ .cell {
  overflow: visible;
  white-space: normal !important;
  word-break: break-all;
  line-height: 1.5;
  padding: 4px 8px;
}

.el-table /deep/ .el-input__inner {
  padding: 0 8px;
  min-height: 32px;
}

/* 添加表格横向滚动能力 */
.right-container {
  overflow-x: auto;
}

/* 添加Track警告样式 */
.el-table /deep/ .warning-cell .el-input__inner {
  background-color: #fef0f0 !important; /* 淡红色背景 */
  border-color: #fbc4c4 !important; /* 红色边框 */
  color: #f56c6c !important;
}

.el-table /deep/ .warning-cell.cell {
  position: relative;
}

.el-table /deep/ .warning-cell.cell::after {
  content: '!';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  line-height: 14px;
  text-align: center;
  background-color: #f56c6c !important; /* 红色背景 */
  color: white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
}

.calculation-panel {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.calculation-header {
  margin-bottom: 15px;
}

.calculation-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.calculation-buttons {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.calculation-item {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.calculation-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.progress-wrapper {
  margin: 20px 0;
}

.result-actions {
  width: 100%;
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #e0e0e0;
}

.result-actions .el-button {
  margin: 0 5px;
}

/* 添加新样式 */
.calculation-panel-dialog {
  padding: 10px;
}

.result-info {
  margin-top: 15px;
  text-align: center;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  width: 100%;
}

.result-info p {
  margin: 5px 0;
  line-height: 1.4;
}

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

/* 提醒样式（黄色背景） */
.warning-cell {
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
  border: 1px solid #fbc4c4 !important;
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

/* 添加警告单元格的样式 */
.warning-cell {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 添加提示单元格的样式（淡蓝色边框） */
.prompt-cell {
  border: 1px solid #8cc5ff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 禁用单元格样式 */
.disabled-cell {
  background-color: #f5f7fa;
  color: #909399;
}

/* 数值型单元格样式 */
.numeric-cell {
  text-align: right;
}

/* 提醒样式（淡红色背景） */
.warning-cell {
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
  border: 1px solid #fbc4c4 !important;
}
</style>
