<template>
  <div id="wrapper">
    <div id="bg" />
    <div id="overlay" />
    <div id="main" class="login-container">
      <el-form ref="loginForm" :rules="rules" :model="loginForm" class="login-form" label-position="left">
        <div class="logo-container">
          <img class="logo" src="@/assets/logo/logo.png">
        </div>
        <div class="login-title">上海市域运营仿真系统</div>
        <el-form-item prop="user_name">
          <span class="icon-container">
            <i class="el-icon-user" />
          </span>
          <el-input v-model="loginForm.user_name" type="text" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item prop="user_password">
          <span class="icon-container">
            <i class="el-icon-lock" />
          </span>
          <el-input v-model="loginForm.user_password" :type="pwdType" placeholder="请输入密码" />
          <span class="show-pwd" @click="showPwd">
            <i :class="pwdType === 'user_password' ? 'el-icon-view' : 'el-icon-view'" />
          </span>
        </el-form-item>

        <el-form-item prop="captcha">
          <span class="icon-container">
            <i class="el-icon-key" />
          </span>
          <el-input v-model="loginForm.captcha" placeholder="请输入验证码" class="captcha-input" prefix-icon="el-icon-key" />
          <div class="code-container" @click="refreshCode">
            <s-identify :identify-code="identifyCode" class="captcha-code" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button :loading="loading" type="primary" class="login-button" @click.native.prevent="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="bottom-info">
        <div class="copyright-container">
          <img class="bottom-logo" src="@/assets/logo/train-logo.png">
          <div class="copyright-text">上海市域运营仿真系统 © 2025</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sIdentify from './components/sIdentify.vue'
import { validUsername } from '@/utils/validate'

export default {
  name: 'Login',
  components: { sIdentify },
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 5) {
        callback(new Error('密码不能少于5个字符'))
      } else {
        callback()
      }
    }
    return {
      identifyCode: '',
      identifyCodes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'], // 验证码字符集
      loginForm: {
        user_name: 'admin',
        user_password: 'admin',
        captcha: '' // 用户输入的验证码
      },
      rules: {
        user_name: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { validator: validateUsername, trigger: 'blur' }
        ],
        user_password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { validator: validatePassword, trigger: 'blur' }
        ],
        captcha: [
          // { required: true, message: '请输入验证码', trigger: 'blur' }
        ]
      },
      loading: false,
      pwdType: 'user_password',
      redirect: undefined,
      pwdClassType: 'fa fa-eye-slash fa-x'
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  mounted() {
    this.refreshCode()
    window.addEventListener('keyup', this.onSubmit, false)
    if (this.loginForm.user_name === '') {
      this.$refs.user_name && this.$refs.user_name.focus()
    } else if (this.loginForm.user_password === '') {
      this.$refs.user_password && this.$refs.user_password.focus()
    }
  },
  destroyed() {
    window.removeEventListener('keyup', this.onSubmit)
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
      this.loginForm.captcha = '' // 清空用户输入
      console.log('当前验证码:', this.identifyCode)
    },
    // 随机生成验证码字符串
    makeCode(data, len) {
      for (let i = 0; i < len; i++) {
        this.identifyCode += data[this.randomNum(0, data.length - 1)]
      }
    },
    onSubmit(e) {
      if (e.keyCode == 13) {
        this.handleLogin()
      }
    },
    showPwd() {
      this.pwdType = this.pwdType === 'user_password' ? '' : 'user_password'
      this.pwdClassType = this.pwdType === 'user_password' ? 'fa fa-eye-slash fa-x' : 'fa fa-eye fa-x'
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          // 暂时跳过验证码验证
          // if (this.loginForm.captcha.toLowerCase() !== this.identifyCode.toLowerCase()) {
          //   this.$message.error('验证码错误')
          //   this.refreshCode()
          //   return false
          // }

          this.loading = true
          this.$store
            .dispatch('user/login', this.loginForm)
            .then(() => {
              this.$router.push({ path: this.redirect || '/' })
              this.loading = false
              this.$message.success('登录成功！')
            })
            .catch(error => {
              // 确保错误是字符串
              let errorMsg = typeof error === 'string' ? error : 
                           (error && error.message ? error.message : '登录失败，请重试')
              this.$message.error(errorMsg)
              this.refreshCode() // 刷新验证码
              this.loading = false
            })
        } else {
          this.$message.error('请检查登录信息！')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
/* 重置element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 5px; /* 将左内边距减小到5px */
      color: #000;
      height: 47px;
      caret-color: #000;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
        -webkit-text-fill-color: #000 !important;
      }
    }
  }

  /* 隐藏验证码输入框的prefix-icon，因为我们使用自定义图标 */
  .captcha-input .el-input__prefix {
    display: none;
  }

  .el-form-item {
    margin-bottom: 20px;
    border: 1px solid #E4E7ED;
    background: rgba(255, 255, 255, 0.9) !important;
    border-radius: 4px;
    position: relative;
  }

  /* 验证码特殊处理 */
  .captcha-input {
    width: 85% !important;
  }
}

/* Wrapper */
@-moz-keyframes wrapper {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@-webkit-keyframes wrapper {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@-o-keyframes wrapper {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@-ms-keyframes wrapper {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes wrapper {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

#wrapper {
  -moz-animation: wrapper 3s forwards;
  -webkit-animation: wrapper 3s forwards;
  -o-animation: wrapper 3s forwards;
  -ms-animation: wrapper 3s forwards;
  animation: wrapper 3s forwards;
  height: 100%;
  left: 0;
  opacity: 0;
  position: fixed;
  top: 0;
  width: 100%;
}

/* BG */
#bg {
  -moz-animation: bg 60s linear infinite;
  -webkit-animation: bg 60s linear infinite;
  -o-animation: bg 60s linear infinite;
  -ms-animation: bg 60s linear infinite;
  animation: bg 60s linear infinite;
  -moz-backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -o-backface-visibility: hidden;
  -ms-backface-visibility: hidden;
  backface-visibility: hidden;
  -moz-transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  -o-transform: translate3d(0, 0, 0);
  -ms-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  background-color: #348cb2;
  background-image: url('~@/assets/logo/bg.png');
  background-position: center;
  background-repeat: repeat-x;
  background-size: 100% 100%;
  height: 100%;
  left: 0;
  opacity: 1;
  position: fixed;
  top: 0;
  width: 6750px;
  background-size: 1700px auto;
}

@keyframes bg {
  0% {
    -moz-transform: translate3d(0, 0, 0);
    -webkit-transform: translate3d(0, 0, 0);
    -o-transform: translate3d(0, 0, 0);
    -ms-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }

  100% {
    -moz-transform: translate3d(-2250px, 0, 0);
    -webkit-transform: translate3d(-2250px, 0, 0);
    -o-transform: translate3d(-2250px, 0, 0);
    -ms-transform: translate3d(-2250px, 0, 0);
    transform: translate3d(-2250px, 0, 0);
  }
}

/* Overlay */
@-moz-keyframes overlay {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@-webkit-keyframes overlay {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@-o-keyframes overlay {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@-ms-keyframes overlay {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes overlay {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

#overlay {
  -moz-animation: overlay 1.5s 1.5s forwards;
  -webkit-animation: overlay 1.5s 1.5s forwards;
  -o-animation: overlay 1.5s 1.5s forwards;
  -ms-animation: overlay 1.5s 1.5s forwards;
  animation: overlay 1.5s 1.5s forwards;
  background-attachment: fixed, fixed;
  background-image: url('~@/assets/logo/overlay-pattern.png'), url('~@/assets/logo/overlay.svg');
  background-position: top left, center center;
  background-repeat: repeat, no-repeat;
  background-size: auto, cover;
  height: 100%;
  left: 0;
  opacity: 0;
  position: fixed;
  top: 0;
  width: 100%;
}

/* Main */
#main {
  height: 100%;
  left: 0;
  position: fixed;
  text-align: center;
  top: 0;
  width: 100%;
}

#main:before {
  display: inline-block;
  height: 100%;
  margin-right: 0;
  vertical-align: middle;
  width: 1px;
}

/* 登录表单相关样式 */
.login-form {
  position: absolute;
  left: 50%;
  width: 50%;
  top: 45%;
  transform: translate(-50%, -50%);
  min-width: 400px;
  max-width: 600px;
  height: auto !important;
  min-height: 400px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 50px 20px 10px 20px;
  font-size: 24px;
  border-radius: 10px;
  align-items: center;
}

.logo {
  width: 120px;
  height: auto;
  margin: 0 auto 15px auto;
  display: block;
  z-index: 6;
  position: relative;
}

.bottom-logo {
  width: 44px;
  height: 44px;
  margin-right: 10px;
}

.login-button {
  background-color: #409EFF !important;
  border-color: #409EFF !important;
  width: 100%;
  font-size: 16px !important;
  font-weight: normal !important;
  height: 40px !important;
  border-radius: 4px !important;
  margin-top: 10px;
}

.bottom-info {
  position: fixed;
  bottom: 15px;
  width: 100%;
}

.captcha-container {
  display: flex;
  align-items: center;
  width: 100%;
  margin-left: 0;
}

.captcha-code {
  height: 38px;
  width: 113px;
  background: #fff;
  border-radius: 4px;
}

.code-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 40px;
  justify-content: center;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

/* 标题样式 */
.login-title {
  font-size: 28px;
  padding: 0;
  margin-bottom: 30px;
}

.logo-container {
  text-align: center;
  margin-bottom: 10px;
}

.icon-container {
  display: inline-block;
  width: 25px;
  text-align: center;
  color: #606266;
  margin-right: 0px; /* 移除右边距 */
  position: absolute;
  left: 5px; /* 将图标位置靠左调整为5px */
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.icon-container i {
  font-size: 20px;
  line-height: 40px;
}

.copyright-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.copyright-text {
  color: #fff;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
}

.show-pwd {
  position: absolute;
  right: 10px;
  top: 0;
  font-size: 16px;
  color: #889aa4;
  cursor: pointer;
  user-select: none;
  height: 47px;
  display: flex;
  align-items: center;
}
</style>
