<template>
  <div class="help-guide">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>轨道参数管理帮助</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="toggleCollapse">
          {{ collapsed ? '展开' : '收起' }}
        </el-button>
      </div>
      
      <div v-show="!collapsed">
        <el-collapse v-model="activeNames">
          <el-collapse-item title="基本使用说明" name="1">
            <p>轨道参数管理模块用于编辑和管理轨道相关的数据，包括轨道基础数据、坡度数据、曲线数据和站台数据。</p>
            <p>您可以通过导入JSON或Excel文件来快速加载数据，也可以手动添加和编辑数据。所有计算字段将根据您的输入自动更新。</p>
            <p>所有数据会自动保存到浏览器的本地存储中，您也可以随时将数据导出为JSON或Excel文件进行备份。</p>
          </el-collapse-item>
          
          <el-collapse-item title="轨道数据说明" name="2">
            <div class="help-section">
              <h4>轨道数据字段说明</h4>
              <ul>
                <li><strong>轨道ID(起):</strong> 跳跃前的轨道ID</li>
                <li><strong>轨道ID(终):</strong> 跳跃后的轨道ID</li>
                <li><strong>KP值(起):</strong> 跳跃前的KP值</li>
                <li><strong>KP值(终):</strong> 跳跃后的KP值</li>
                <li><strong>跳跃长度:</strong> KP值(终) - KP值(起)的计算结果</li>
                <li><strong>KP修正值:</strong> 从第一行开始的所有跳跃长度之和</li>
                <li><strong>距离:</strong> KP值(起) * 方向的计算结果</li>
              </ul>
            </div>
          </el-collapse-item>
          
          <el-collapse-item title="坡度数据说明" name="3">
            <div class="help-section">
              <h4>坡度数据字段说明</h4>
              <ul>
                <li><strong>KP值:</strong> 坡度的位置</li>
                <li><strong>T1:</strong> 根据KP值在轨道数据中查找的对应轨道ID(起)</li>
                <li><strong>T2:</strong> 根据KP值在轨道数据中查找的对应轨道ID(终)</li>
                <li><strong>轨道1:</strong> 用户指定的轨道ID，如果为空，则使用T1</li>
                <li><strong>轨道2:</strong> 计算得到的轨道ID，根据轨道1、T1和T2确定</li>
                <li><strong>KP修正:</strong> 根据轨道2在轨道数据中查找的对应KP修正值</li>
                <li><strong>距离:</strong> (KP值 + KP修正) * 方向的计算结果</li>
                <li><strong>坡度值:</strong> 用户输入的坡度值</li>
                <li><strong>坡度(‰):</strong> 坡度值 * 10的计算结果</li>
              </ul>
            </div>
          </el-collapse-item>
          
          <el-collapse-item title="曲线数据说明" name="4">
            <div class="help-section">
              <h4>曲线数据字段说明</h4>
              <ul>
                <li><strong>KP值:</strong> 曲线的位置</li>
                <li><strong>T1, T2, 轨道1, 轨道2, KP修正, 距离:</strong> 与坡度数据相同计算方式</li>
                <li><strong>曲线半径:</strong> 用户输入的曲线半径</li>
                <li><strong>半径值:</strong> 计算得到的曲线半径</li>
                <li><strong>超高值:</strong> 用户输入的超高值</li>
                <li><strong>实际超高:</strong> 计算得到的实际超高</li>
                <li><strong>超高不足:</strong> 根据高速值计算的超高不足量 (11.8 * v² / R - 实际超高)</li>
                <li><strong>超高过剩:</strong> 根据低速值计算的超高过剩量 (实际超高 - 11.8 * v² / R)</li>
              </ul>
            </div>
          </el-collapse-item>
          
          <el-collapse-item title="站台数据说明" name="5">
            <div class="help-section">
              <h4>站台数据字段说明</h4>
              <ul>
                <li><strong>KP值:</strong> 站台的位置</li>
                <li><strong>T1, T2, 轨道1, 轨道2, KP修正, 距离:</strong> 与坡度数据相同计算方式</li>
                <li><strong>站名:</strong> 站台名称</li>
                <li><strong>站点类型:</strong> A、B或C类型</li>
                <li><strong>站点等级:</strong> Major(主要)、Minor(次要)或Halt(临时)</li>
                <li><strong>停车精度:</strong> 根据站点类型计算的停车精度 (A=0.5, B=1.0, C=1.5)</li>
                <li><strong>延误时间:</strong> 根据站点等级和基础延误时间计算的延误时间</li>
              </ul>
            </div>
          </el-collapse-item>
          
          <el-collapse-item title="导入/导出说明" name="6">
            <div class="help-section">
              <h4>数据导入</h4>
              <p>您可以导入JSON或Excel格式的数据文件。导入的文件应包含与系统匹配的数据结构。</p>
              
              <h4>JSON格式示例</h4>
              <pre>
{
  "tracks": [
    {
      "Track_ID_before_jump": "T1",
      "Track_ID_after_jump": "T2",
      "KP_before_jump": "10.5",
      "KP_after_jump": "11.0"
    }
  ],
  "gradients": [...],
  "curves": [...],
  "stations": [...],
  "settings": {
    "direction": 1,
    "highSpeed": 80,
    "lowSpeed": 30,
    "baseDelay": 180
  }
}
              </pre>
              
              <h4>数据导出</h4>
              <p>您可以将当前编辑的数据导出为JSON或Excel格式的文件进行备份或分享。</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'HelpGuide',
  data() {
    return {
      collapsed: false,
      activeNames: ['1'] // 默认展开第一项
    }
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed
    }
  }
}
</script>

<style scoped>
.help-guide {
  margin-bottom: 20px;
}
.help-section {
  padding: 0 20px;
}
.help-section h4 {
  margin-top: 10px;
  margin-bottom: 10px;
  font-weight: bold;
  color: #409EFF;
}
.help-section ul {
  padding-left: 20px;
}
.help-section li {
  margin-bottom: 5px;
}
pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style> 