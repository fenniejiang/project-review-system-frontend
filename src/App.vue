<template>
 
    <!-- 添加横幅大标题 -->
    <!-- <div class="header">
      <h2>专家评审系统</h2>
    </div> -->
    <div id="app" >
      <router-view></router-view>
  </div>
  
</template>

<script setup>
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.header {
  background-color: white; /* 浅黑色背景 */
  color: #333; /* 白色文字 */

  font-size: 22px;
  padding-left: 10px;
  position: fixed; /* 固定在顶部 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  z-index: 1000; /* 确保在最上层 */
  text-align: left; /* 文字左对齐 */
  overflow: hidden;
  
}

.header h1 {
  margin: 0; /* 去除标题默认的外边距 */
}
.router-view-container {
  padding-top: 40px; /* 让所有页面的内容自动避开 header */
  /* background: #f5f5f5; */
}
</style>