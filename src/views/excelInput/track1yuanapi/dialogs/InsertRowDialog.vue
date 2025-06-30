<template>
  <el-dialog
    :title="insertPosition >= 0 ? `在第${insertPosition+1}行后插入数据` : '添加新行数据'"
    :visible.sync="visible"
    width="50%"
    @close="handleClose"
  >
    <el-form
      ref="rowForm"
      :model="formData"
      label-width="180px"
      size="small"
      class="row-form"
    >
      <el-form-item
        v-for="(header, index) in headers"
        :key="index"
        :label="header.label"
        :prop="header.prop"
      >
        <el-input
          v-model="formData[header.prop]"
          :placeholder="'请输入' + header.label"
        />
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'InsertRowDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    headers: {
      type: Array,
      default: () => []
    },
    insertPosition: {
      type: Number,
      default: -1 // -1表示在末尾添加，否则表示在指定位置后添加
    }
  },
  data() {
    return {
      formData: {}
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initFormData() // 打开对话框时初始化表单数据
      }
    },
    headers() {
      this.initFormData() // 当headers变化时初始化表单数据
    }
  },
  methods: {
    initFormData() {
      // 初始化表单数据
      const formData = {}
      if (this.headers && this.headers.length > 0) {
        this.headers.forEach(header => {
          formData[header.prop] = ''
        })
      }
      this.formData = formData
    },
    
    handleConfirm() {
      // 发送事件通知父组件
      this.$emit('confirm', { ...this.formData }, this.insertPosition)
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
      this.initFormData()
    }
  }
}
</script>

<style scoped>
.row-form {
  max-height: 60vh;
  overflow-y: auto;
}
</style> 