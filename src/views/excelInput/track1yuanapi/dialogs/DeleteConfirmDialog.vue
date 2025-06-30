<template>
  <el-dialog
    title="删除确认"
    :visible.sync="visible"
    width="30%"
    @close="handleClose"
  >
    <span>确定要删除文件 <strong>{{ deleteTarget }}</strong> 吗？</span>
    <span slot="footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="danger"
        @click="handleConfirm"
      >确认删除</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'DeleteConfirmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    deleteTarget: {
      type: String,
      default: ''
    }
  },
  methods: {
    handleConfirm() {
      // 发送事件通知父组件
      this.$emit('confirm', this.deleteTarget)
    },

    handleCancel() {
      this.$emit('cancel')
    },

    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
/* 组件特定样式 */
</style>
