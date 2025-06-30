<template>
  <el-dialog
    title="新增版本"
    :visible.sync="visible"
    width="30%"
    @close="handleClose"
  >
    <el-form>
      <el-form-item label="文件名" required>
        <el-input
          v-model="excelName"
          placeholder="请输入文件名（无需后缀）"
          clearable
        />
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        :disabled="!excelName"
        @click="handleConfirm"
      >确认</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'NewExcelDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      excelName: ''
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.excelName = '' // 打开对话框时清空输入框
      }
    }
  },
  methods: {
    handleConfirm() {
      if (!this.excelName) return
      
      // 添加.xls扩展名
      const fullName = `${this.excelName}.xls`
      
      // 发送事件通知父组件
      this.$emit('confirm', fullName)
      this.resetForm()
    },
    
    handleCancel() {
      this.$emit('cancel')
      this.resetForm()
    },
    
    handleClose() {
      this.$emit('update:visible', false)
      this.resetForm()
    },
    
    resetForm() {
      this.excelName = ''
    }
  }
}
</script>

<style scoped>
/* 组件特定样式 */
</style> 