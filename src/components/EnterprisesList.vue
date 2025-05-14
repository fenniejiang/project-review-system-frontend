<template>
  <div class="enterprise-list">
    <div class="container">
      <el-button @click="openFileInput">刷新企业材料文件</el-button>
      <div class="marquee-container">
        <span class="marquee-text">请管理员将企业文件材料确保上传至 D:\upload。格式为省份-企业名称。</span>
      </div>
      <div class="total-count">
        总企业数量：{{ totalCount }}
      </div>
    </div>
    <h2>企业材料列表</h2>
    <el-table
      :data="paginatedData"
      style="width: 100%"
      border
      max-height="835px"
    >
      <!-- <el-table-column prop="ID" label="ID" width="100" align="center"></el-table-column> -->
      <el-table-column prop="Province" label="省份" width="120" align="center"></el-table-column>
      <el-table-column prop="Name" label="企业名称" width="280" align="center"></el-table-column>
      <el-table-column prop="Path" label="文件夹路径" align="center"></el-table-column>
      <el-table-column prop="CreatedAt" label="创建时间" width="180" align="center">
        <template #default="scope">
          {{ formatDate(scope.row.CreatedAt) }}
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="totalCount"
      layout="prev, pager, next, jumper"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center;"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
// import { useRouter } from 'vue-router';
import { debounce } from 'lodash';

export default {
  name: 'EnterprisesList',
  setup() {
    const enterpriseList = ref([]);
    // const router = useRouter();
    const currentPage = ref(1);
    const pageSize = ref(20);

    const fetchEnterprises = debounce(async () => {
      try {
        const response1 = await axios.post('http://localhost:8080/scan-enterprises');
        console.log(response1.data)
        const response = await axios.get('http://localhost:8080/api/enterprises');
        if (response.data.success) {
          enterpriseList.value = response.data.data;
        } else {
          ElMessage.error('获取企业列表失败: ' + response.data.message);
        }
      } catch (error) {
        ElMessage.error('请求失败: ' + error.message);
      }
    }, 300);

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? dateString
        : date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
    };

    const totalCount = computed(() => enterpriseList.value.length);

    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return enterpriseList.value.slice(start, end);
    });


    const openFileInput = () => {
      fetchEnterprises();
    };

    const handlePageChange = (newPage) => {
      currentPage.value = newPage;
    };

    onMounted(() => {
      fetchEnterprises();
    });

    return {
      enterpriseList,
      formatDate,
      totalCount,
      openFileInput,
      currentPage,
      pageSize,
      paginatedData,
      handlePageChange,
    };
  },
};
</script>

<style scoped>
.enterprise-list {
  padding: 20px;
  min-height: 80vh;
}
h2 {
  margin-bottom: 20px;
}
.container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.total-count {
  margin-left: auto;
  font-size: 16px;
  color: #333;
}
/* 修正后的滚动文字样式 */
.marquee-container {
  position: relative;
  height: 36px;
  overflow: hidden;
  margin-left: 20px;
  flex-shrink: 0;
  width: 500px; /* 添加固定宽度 */
}

.marquee-text {
  position: absolute;
  white-space: nowrap;
  animation: marquee 10s linear infinite;
  color: #ff0000;
  font-size: 16px;
  padding: 8px 16px;
  cursor: pointer;
}

.marquee-text:hover {
  color: #7367f0;
  animation-play-state: paused; 
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
::v-deep .el-pager li.is-active, .el-pager li:hover {
    color: #7367f0;;
}
</style>