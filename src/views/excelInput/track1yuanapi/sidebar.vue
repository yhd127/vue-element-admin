<template>
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
          :trigger="'click'"
        >
          <template slot="title">
            <div class="folder-title" @click.stop="handleMenuClick(folder.id, $event)">
              <i :class="folder.icon" :style="{ color: folder.color }" />
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
            <i class="el-icon-document" style="color: #909399;" />
            <span>{{ file.label }}</span>
          </el-menu-item>
        </el-submenu>
      </template>
    </el-menu>
  </el-card>
</template>

<script>
import { getFolderTreeData } from './services/folderManager'

export default {
  name: 'Sidebar',
  
  props: {
    // 当前选中的菜单项
    activeMenuIndex: {
      type: String,
      default: ''
    },
    // 当前选中的文件ID
    fileId: {
      type: String,
      default: ''
    },
    // 可用文件夹列表
    availableFolders: {
      type: Array,
      default: () => []
    },
    // 文件夹与文件的映射
    folderFiles: {
      type: Object,
      default: () => ({})
    },
    // 文件夹树形数据
    folderTreeData: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      filterText: '',
      expandedFolders: [],
      permanentlyExpandedFolders: []
    }
  },
  
  watch: {
    filterText(val) {
      this.$nextTick(() => {
        this.applyMenuFilter(val)
      })
    },
    
    // 监听folderTreeData的变化
    folderTreeData: {
      handler(newVal) {
        console.log('侧边栏接收到新的folderTreeData:', newVal);
      },
      deep: true
    }
  },
  
  created() {
    // 初始树形数据从props获取，不再从服务调用
    console.log('侧边栏组件创建，初始folderTreeData:', this.folderTreeData);
  },
  
  methods: {
    /**
     * 更新文件夹树形结构数据
     */
    updateFolderTreeData() {
      try {
        console.log('侧边栏更新树形数据，当前props传递的folderTreeData:', this.folderTreeData);
        // 触发组件刷新
        this.$forceUpdate();
      } catch (error) {
        console.error('侧边栏获取文件夹数据失败:', error);
      }
    },
    
    /**
     * 清空搜索过滤器
     */
    clearFilter() {
      this.filterText = ''
      this.applyMenuFilter('')
    },
    
    /**
     * 应用菜单过滤器
     */
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
    
    /**
     * 显示所有菜单项
     */
    showAllMenuItems() {
      const menuItems = document.querySelectorAll('.folder-menu .el-submenu, .folder-menu .el-menu-item')
      menuItems.forEach(item => {
        item.style.display = ''
      })
    },
    
    /**
     * 处理菜单选择事件
     */
    handleMenuSelect(index) {
      this.$emit('menu-select', index)
    },
    
    /**
     * 处理菜单点击事件
     */
    handleMenuClick(folderId, event) {
      event.stopPropagation()

      // 检查文件夹是否已经固定展开
      const isPermanent = this.permanentlyExpandedFolders.includes(folderId)

      if (isPermanent) {
        // 如果已经固定展开，则取消固定并从展开列表中移除
        this.permanentlyExpandedFolders = this.permanentlyExpandedFolders.filter(id => id !== folderId)
        this.expandedFolders = this.expandedFolders.filter(id => id !== folderId)
      } else {
        // 如果未固定展开，则添加到固定展开列表
        if (!this.permanentlyExpandedFolders.includes(folderId)) {
          this.permanentlyExpandedFolders.push(folderId)
        }
        if (!this.expandedFolders.includes(folderId)) {
          this.expandedFolders.push(folderId)
        }
      }
      
      // 触发点击事件
      this.$emit('folder-click', folderId)
    },
    
    /**
     * 判断文件夹是否永久展开
     */
    isPermanentlyExpanded(folderId) {
      return this.permanentlyExpandedFolders.includes(folderId)
    }
  }
}
</script>

<style scoped>
.folder-sidebar {
  margin-bottom: 20px;
  background-color: #ffffff;
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

.folder-menu {
  border-right: none;
  background-color: #ffffff;
}

.folder-title {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.folder-name {
  margin-left: 5px;
  flex: 1;
}
</style> 