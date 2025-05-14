<template>
  <div>
      <div class="container">
          <!-- 返回按钮 -->
 
          <!-- 刷新按钮 -->
          <el-button @click="fetchReviewProgress">
              刷新
          </el-button>
          <!-- 显示统计信息 -->
          <div class="statistics">
              总已分配企业数量：{{ totalAssignedCount }} &nbsp;
              当前已完成评审数量：{{ completedReviewCount }} &nbsp;
              剩余待评审数量：{{ remainingReviewCount }} 
          </div>
      </div>

      <h2>评审进度</h2>
      <el-table :data="progressData" style="width: 100%" @row-click="handleRowClick">
          <el-table-column prop="expert_id" label="专家ID"></el-table-column>
          <el-table-column prop="expert_name" label="专家名"></el-table-column>
          <el-table-column prop="assigned_count" label="已分配企业数量"></el-table-column>
          <el-table-column prop="completed_count" label="已完成评审数量"></el-table-column>
      </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

// 初始化数据
const progressData = ref([]);
const router = useRouter();
const totalEnterpriseCount = ref(0); // 存储企业总数

// 计算当前已完成评审数量
const completedReviewCount = computed(() => {
  return progressData.value.reduce((total, item) => total + Number(item.completed_count || 0), 0);
});

// 计算总已分配企业数量
const totalAssignedCount = computed(() => {
  return progressData.value.reduce((total, item) => total + Number(item.assigned_count || 0), 0);
});

// 计算剩余待评审数量
const remainingReviewCount = computed(() => {
  return (totalEnterpriseCount.value * 7) - completedReviewCount.value;
});

// 返回管理员页面

// 处理表格行点击事件
const handleRowClick = (row) => {
  router.push({
      path: `/admin/expert-summary/${row.expert_id}`,
      query: {
          expertName: row.expert_name
      }
  });
};

// 获取评审进度和企业总数
const fetchReviewProgress = async () => {
  try {
      // 获取评审进度
      const progressResponse = await axios.get('http://localhost:8080/api/admin/review-progress', {
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      });
      if (progressResponse.data.success) {
          progressData.value = progressResponse.data.data;
      } else {
          ElMessage.error(progressResponse.data.message);
      }

      // 获取企业总数
      const enterpriseResponse = await axios.get('http://localhost:8080/api/enterprises');
      if (enterpriseResponse.data.success) {
          totalEnterpriseCount.value = enterpriseResponse.data.data.length;
      } else {
          ElMessage.error('获取企业总数失败: ' + enterpriseResponse.data.message);
      }
  } catch (error) {
      ElMessage.error('获取数据失败: ' + error.message);
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchReviewProgress();
});
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
}

.statistics {
  margin-left: auto;
  font-size: 16px;
  color: #333;
}
</style>
