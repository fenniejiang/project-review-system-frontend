<template>
  <div>
    <div class="button-container">
      <el-button @click="fetchReviewProgress">刷新</el-button>
      <div class="statistics">
        已分配企业总数：{{ totalEnterpriseCount }}
      </div>
    </div>

    <el-table :data="reviewProgressList" stripe style="width: 100%;" @row-click="handleRowClick">
      <el-table-column prop="province" label="省份" sortable ></el-table-column>
      <el-table-column prop="enterprise_name" label="企业名称" sortable></el-table-column>
      <el-table-column prop="experts" label="专家名单" :width="320">
        <template #default="scope"> 
          <div class="expert-list">
            <el-tag v-for="(expert, index) in scope.row.experts" :key="index" type="info" class="expert-tag">
              {{ expert }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="finished_count" label="评审状态" sortable></el-table-column>
      <el-table-column prop="assign_time" label="分配时间" sortable></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const router = useRouter();

const reviewProgressList = ref([]);

// 获取总企业数量
const totalEnterpriseCount = computed(() => reviewProgressList.value?.length || 0);

// 点击行跳转详情页面
const handleRowClick = (row) => {
  router.push({
    path: `/admin/enterprise-export/${row.enterprise_id}`,
  });
};

// 获取评审进度
const fetchReviewProgress = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/admin/review-assignments', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (response.data.success) {
      reviewProgressList.value = response.data.data;
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取评审进度失败');
  }
};
// 检查每个企业的分配专家是否有重复
// const checkDuplicates = () => {
//   reviewProgressList.value.forEach(item => {
//     const expertIDsStr = item.expert_count;
//     // 如果专家ID字符串存在且不为 "待分配"
//     if (expertIDsStr && expertIDsStr !== '待分配') {
//       const expertsArr = expertIDsStr.split(',').map(s => s.trim());
//       const uniqueExperts = new Set(expertsArr);
//       if (uniqueExperts.size < expertsArr.length) {
//         console.log(`企业ID ${item.enterprise_id} 的分配专家中有重复: ${expertIDsStr}`);
//       } else {
//         console.log(`企业ID ${item.enterprise_id} 所分配的专家没有重复`);
//       }
//     } else {
//       console.log(`企业ID ${item.enterprise_id} 暂未分配专家`);
//     }
//   });
// };
// 页面加载时自动查询数据
// 页面加载时获取数据
fetchReviewProgress();
</script>

<style scoped>
.button-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.statistics {
  margin-left: auto;
  font-size: 16px;
  color: #333;
}

.expert-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.expert-tag {
  margin: 2px 0;
}
</style>
