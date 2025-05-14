<template>
  <div >
    <div class="container">
      <el-button @click="fetchData">刷新</el-button>
      <div class="statistics">
        总已分配企业数量：{{ totalAssignedCount }} &nbsp;
        当前已完成评审数量：{{ completedReviewCount }} &nbsp;
        剩余待评审数量：{{ remainingReviewCount }}
      </div>

    </div>

    <h2>评审进度</h2>
    <el-table :data="progressData" style="width: 100%" @row-click="handleRowClick" >
      <!-- <el-table-column prop="expert_id" label="专家ID"></el-table-column> -->
      <el-table-column prop="expert_name" label="专家名"></el-table-column>
      <el-table-column prop="assigned_count" label="已分配企业数量"></el-table-column>
      <el-table-column prop="completed_count" label="已完成评审数量"></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getReviewProgress, getTotalEnterprises } from '@/api/reviewProgress.js';


const router = useRouter();
const progressData = ref([]);
const totalEnterpriseCount = ref(0);

const completedReviewCount = computed(() =>
  progressData.value.reduce((total, item) => total + Number(item.completed_count || 0), 0)
);
const totalAssignedCount = computed(() =>
  progressData.value.reduce((total, item) => total + Number(item.assigned_count || 0), 0)
);
const remainingReviewCount = computed(() => (totalEnterpriseCount.value * 7) - completedReviewCount.value);

const handleRowClick = (row) => {
  router.push({
    path: `/admin/expert-export/${row.expert_id}`,
    query: { expertName: row.expert_name }
  });
};

const fetchData = async () => {
  progressData.value = await getReviewProgress();
  totalEnterpriseCount.value = await getTotalEnterprises();
};

onMounted(fetchData);
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.statistics {
  margin-left: auto;
  font-size: 16px;
  color: #333;
}
.wrap{
  display: flex;
  align-items: center;
}
</style>
