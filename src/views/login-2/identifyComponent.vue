<template>
  <el-form ref="form" :model="form" label-width="80px">
    <el-form-item label="验证码">
      <div class="code" style="cursor: pointer;" title="点击切换验证码" @click="refreshCode">
        <s-identify :identify-code="identifyCode" />
      </div>
      <el-input v-model="userInput" placeholder="请输入验证码" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="checkCode">验证</el-button>
    </el-form-item>
    <el-form-item v-if="isCodeCorrect">
      <el-alert type="success" title="验证码正确" />
    </el-form-item>
    <el-form-item v-else>
      <el-alert type="error" title="验证码错误" />
    </el-form-item>
  </el-form>
</template>

<script>
import sIdentify from './sIdentify.vue'

export default {
  name: 'WatermarkTest',
  components: { sIdentify },
  data() {
    return {
      identifyCode: '',
      identifyCodes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd'], // 根据实际需求加入自己想要的字符
      userInput: '', // 用户输入的验证码
      isCodeCorrect: false // 验证码是否正确
    }
  },
  mounted() {
    this.refreshCode()
  },
  methods: {
    // 生成随机数
    randomNum(min, max) {
      max = max + 1
      return Math.floor(Math.random() * (max - min) + min)
    },
    // 更新验证码
    refreshCode() {
      this.identifyCode = ''
      this.makeCode(this.identifyCodes, 4)
      this.userInput = '' // 清空用户输入
      this.isCodeCorrect = false // 重置验证码状态
      console.log('当前验证码:', this.identifyCode)
    },
    // 随机生成验证码字符串
    makeCode(data, len) {
      for (let i = 0; i < len; i++) {
        this.identifyCode += data[this.randomNum(0, data.length - 1)]
      }
    },
    // 验证验证码
    checkCode() {
      this.isCodeCorrect = this.userInput.toLowerCase() === this.identifyCode.toLowerCase()
      if (this.isCodeCorrect) {
        console.log('验证码正确')
        // 这里可以添加验证码正确后的逻辑，例如跳转到下一个页面或显示成功消息
      } else {
        console.log('验证码错误')
        // 这里可以添加验证码错误后的逻辑，例如提示用户重新输入或刷新验证码
        this.refreshCode() // 刷新验证码
      }
    }
  }
}
</script>
