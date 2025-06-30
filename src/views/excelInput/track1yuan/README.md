# Track1 模块重构说明

## 项目概述
本项目对原始的`Track1.vue`文件进行了重构，采用组件化和模块化的方式拆分代码，提高了可维护性和复用性。

## 文件结构

```
vue-element-admin20250418/src/views/excelInput/track1yuan/
├── index.vue                 # 主入口文件
├── sidebar.vue               # 侧边栏组件
├── components/               # 工作表组件目录
│   ├── GenParamSheet.vue     # 参数工作表组件
│   ├── TracksSheet.vue       # 轨道工作表组件
│   ├── GradientSheet.vue     # 坡度工作表组件
│   ├── StationsSheet.vue     # 车站工作表组件
│   ├── PSRSheet.vue          # PSR工作表组件
│   └── BlockDescriptionSheet.vue  # 区块描述工作表组件
├── calculations/             # 计算逻辑模块目录
│   ├── tracksCalculations.js # 轨道计算函数
│   ├── gradientCalculations.js # 坡度计算函数
│   ├── stationsCalculations.js # 车站计算函数
│   ├── psrCalculations.js    # PSR计算函数
│   └── blockDescriptionCalculations.js # 区块描述计算函数
├── dialogs/                  # 对话框组件目录
│   ├── NewExcelDialog.vue    # 新建Excel对话框
│   ├── DeleteConfirmDialog.vue # 删除确认对话框
│   ├── InsertRowDialog.vue   # 插入行对话框
│   ├── CalculationDetailDialog.vue # 计算详情对话框
│   └── ImagePreviewDialog.vue # 图片预览对话框
└── utils/                    # 工具函数目录
    ├── fileHandlers.js       # 文件处理工具
    └── apiHandlers.js        # API交互工具
```

## 模块说明

### 1. 工作表组件
- **GenParamSheet**: 参数配置表，包含方向、最大速度等基础参数
- **TracksSheet**: 轨道表，处理轨道数据及相关计算
- **GradientSheet**: 坡度表，处理坡度数据及相关计算
- **StationsSheet**: 车站表，处理车站数据及相关计算
- **PSRSheet**: PSR表，处理速度限制数据及相关计算
- **BlockDescriptionSheet**: 区块描述表，带多级表头的复杂表格

### 2. 计算模块
- **tracksCalculations**: 包含轨道距离、跳跃长度等计算函数
- **gradientCalculations**: 包含坡度相关的T1/T2、距离等计算函数
- **stationsCalculations**: 包含车站位置、距离等计算函数
- **psrCalculations**: 包含PSR速度转换、距离等计算函数
- **blockDescriptionCalculations**: 包含区块T值、距离等计算函数

### 3. 对话框组件
- **NewExcelDialog**: 新建Excel文件对话框
- **DeleteConfirmDialog**: 删除确认对话框
- **InsertRowDialog**: 插入行表单对话框
- **CalculationDetailDialog**: 计算详情查看/编辑对话框
- **ImagePreviewDialog**: 图片预览对话框

### 4. 工具函数
- **fileHandlers**: 文件处理相关功能，如创建默认工作表、数据转换等
- **apiHandlers**: API交互功能，如获取/保存轨道数据、运行配置数据等

## 主要改进

1. **模块化**: 将大型文件拆分为多个功能独立的模块
2. **分离计算逻辑**: 将复杂计算逻辑从视图代码中分离出来
3. **组件化**: 为每种工作表类型创建专用组件
4. **统一API处理**: 集中管理API交互代码
5. **对话框抽象**: 将对话框UI和逻辑提取为可复用组件

## 使用方法

1. **显示工作表**:
   ```javascript
   <GradientSheet 
     :sheet-data="sheetData"
     :tracks-data="tracksData"
     :direction-value="directionValue"
     @data-modified="handleDataModified"
     @insert-row="handleInsertRow"
     @delete-row="handleDeleteRow"
   />
   ```

2. **计算函数使用**:
   ```javascript
   import { calculateJumpLength } from '../calculations/tracksCalculations'
   
   const jumpLength = calculateJumpLength(rowData)
   ```

3. **对话框使用**:
   ```javascript
   <NewExcelDialog 
     :visible.sync="showDialog"
     @confirm="handleConfirm"
     @cancel="handleCancel"
   />
   ```

## 后续优化方向

1. 添加更多工作表专用组件
2. 增强计算逻辑的复用性
3. 优化API交互性能
4. 添加更多单元测试
5. 优化响应式布局适配不同屏幕大小

# Track1yuan 模块

这个模块用于处理轨道和运行配置数据的展示和编辑。

## 文件夹管理

该模块使用模块化的文件夹管理系统，可以轻松添加新的文件夹。

### 如何添加新文件夹

要添加新的文件夹，只需修改 `config/folders.js` 文件中的 `folderConfig` 对象：

```javascript
// 新增文件夹示例
'New_Folder': {
  id: 'New_Folder',         // 文件夹ID，用于内部标识
  label: '新文件夹',        // 显示名称
  icon: 'el-icon-folder',   // 图标
  color: '#e6a23c',         // 图标颜色
  availableSheets: [        // 可用工作表列表
    'Sheet1', 
    'Sheet2'
  ],
  defaultSheet: 'Sheet1'    // 默认工作表
}
```

添加新文件夹后，不需要修改任何其他代码，系统会自动处理新增的文件夹。

### 文件夹文件管理

要添加文件夹中的文件示例，可以在 `index.vue` 的 `data()` 中修改 `folderExamples` 对象：

```javascript
folderExamples: {
  'New_Folder': [
    { name: 'example1.xls', displayName: '示例文件1' },
    { name: 'example2.xls', displayName: '示例文件2' }
  ]
}
```

## 工作表管理

每个文件夹可以包含多个工作表，工作表由 `availableSheets` 配置定义。对于每个工作表，系统会动态加载对应的组件：

- `Gen. Param.` -> GenParamSheet
- `Tracks` -> TracksSheet
- `Gradient` -> GradientSheet
- 等等

如果添加新的工作表类型，需要创建对应的组件并在 `index.vue` 中进行引用和配置。 