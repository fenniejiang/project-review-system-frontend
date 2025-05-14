<template>
        <div class="preloader" >
        <div class="spinner"></div>
        <div class="test-style">
            <h1 >登录成功</h1>
        <h2 v-if="!isReviewStarted">请您等待管理员开启评审，开启后您将自动进入评审页面。</h2>
        <h2 v-if="isReviewStarted">评审已开启，即将进入评审页面...</h2>
        </div>
        
    </div>
</template>
<script setup>
import { ref, onMounted} from 'vue';
import axios from 'axios';


const isReviewStarted = ref(false);
const expertId = sessionStorage.getItem('currentExpertId');

const checkReviewStatus = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/api/check-review-status`);
    if (response.data.reviewStarted) {
      isReviewStarted.value = true;
      setTimeout(() => {
        window.location.href = `/expert-review?expertId=${expertId}`;
      }, 2000);
    }
  } catch (error) {
    console.error('检查评审状态出错:', error);
  }
};

onMounted(() => {
  const intervalId = setInterval(() => {
    checkReviewStatus();
  }, 5000); // 每5秒检查一次

  return () => {
    clearInterval(intervalId);
  };
});
</script>

<style>
.test-style {
    color: #333;
    margin-top: 60px;
}
.preloader .spinner {
    width: 150px;
    height: 150px;
    margin: 0 auto;
    animation: sk-rotateplane 4s infinite linear;
    position: absolute;
    right: 0;
    left: 0;
    background-size: cover;
    background-image: url('@/assets/图标.jpg');
    top: 50%;
    margin-top: -75px;
}
.preloader {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 9999999;
    /* 移除硬编码背景色，由 bg-eef6fd 类控制 */
}
@keyframes sk-rotateplane {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

</style>