<template>
  <div class="s-canvas">
    <canvas id="s-canvas" :width="contentWidth" :height="contentHeight" />
  </div>
</template>
<script>
export default {
  name: 'SIdentify',
  props: {
    identifyCode: {
      type: String,
      default: '1234'
    },
    fontSizeMin: {
      type: Number,
      default: 18
    },
    fontSizeMax: {
      type: Number,
      default: 40
    },
    backgroundColorMin: {
      type: Number,
      default: 180
    },
    backgroundColorMax: {
      type: Number,
      default: 240
    },
    colorMin: {
      type: Number,
      default: 50
    },
    colorMax: {
      type: Number,
      default: 160
    },
    lineColorMin: {
      type: Number,
      default: 40
    },
    lineColorMax: {
      type: Number,
      default: 180
    },
    dotColorMin: {
      type: Number,
      default: 0
    },
    dotColorMax: {
      type: Number,
      default: 255
    },
    contentWidth: {
      type: Number,
      default: 113
    },
    contentHeight: {
      type: Number,
      default: 38
    }
  },
  watch: {
    identifyCode() {
      this.drawPic()
    }
  },
  mounted() {
    this.drawPic()
  },
  methods: {
    // 生成一个随机数
    randomNum(min, max) {
      return Math.floor(Math.random() * (max - min) + min)
    },
    // 生成一个随机的颜色
    randomColor(min, max) {
      const r = this.randomNum(min, max)
      const g = this.randomNum(min, max)
      const b = this.randomNum(min, max)
      return 'rgb(' + r + ',' + g + ',' + b + ')'
    },
    drawPic() {
      const canvas = document.getElementById('s-canvas')
      const ctx = canvas.getContext('2d')
      ctx.textBaseline = 'bottom'
      // 绘制背景
      ctx.fillStyle = this.randomColor(this.backgroundColorMin, this.backgroundColorMax)
      ctx.fillRect(0, 0, this.contentWidth, this.contentHeight)
      // 绘制文字
      for (let i = 0; i < this.identifyCode.length; i++) {
        this.drawText(ctx, this.identifyCode[i], i)
      }
      // this.drawLine(ctx) // 绘制干扰线
      // this.drawDot(ctx) // 绘制干扰点
    },
    // 绘制文本
    drawText(ctx, txt, i) {
      ctx.fillStyle = this.randomColor(this.colorMin, this.colorMax)
      ctx.font = this.randomNum(this.fontSizeMin, this.fontSizeMax) + 'px SimHei'
      const x = (i + 1) * (this.contentWidth / (this.identifyCode.length + 1))
      const y = this.randomNum(this.fontSizeMax, this.contentHeight - 5)
      var deg = this.randomNum(-30, 30) // 字符旋转角度(不超过45度比较好)
      // 修改坐标原点和旋转角度
      ctx.translate(x, y)
      ctx.rotate(deg * Math.PI / 180)
      ctx.fillText(txt, 0, 0)
      // 恢复坐标原点和旋转角度
      ctx.rotate(-deg * Math.PI / 180)
      ctx.translate(-x, -y)
    },
    drawLine(ctx) {
      // 绘制干扰线
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = this.randomColor(this.lineColorMin, this.lineColorMax)
        ctx.beginPath()
        ctx.moveTo(this.randomNum(0, this.contentWidth), this.randomNum(0, this.contentHeight))
        ctx.lineTo(this.randomNum(0, this.contentWidth), this.randomNum(0, this.contentHeight))
        ctx.stroke()
      }
    },
    drawDot(ctx) {
      // 绘制干扰点
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = this.randomColor(0, 255)
        ctx.beginPath()
        ctx.arc(this.randomNum(0, this.contentWidth), this.randomNum(0, this.contentHeight), 1, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }
}
</script>
