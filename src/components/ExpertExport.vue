<template>
  <div class="expert-export-container">
    <!-- 顶部按钮区域 -->
    <div class="header">
      <el-button class="custom-button" @click="goBack">返回</el-button>
      <el-button class="custom-button" @click="printTable">打印</el-button>
    </div>

    <!-- 打印区域 -->
    <div class="print-area">
      <!-- 标题 -->
      <h2>专家 {{ expertName }} 的企业信息汇总</h2>

      <!-- 企业信息表格 -->
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column label="评审企业">
          <template #default="{ row }">
            {{ row.col1 }}
          </template>
        </el-table-column>
        <el-table-column label="评审企业">
          <template #default="{ row }">
            {{ row.col2 }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 签字区（表格下方） -->
      <div class="signature-area">
        <p>专家签字：____________________</p>
        <p>日期：{{ currentDate }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 获取路由参数
const route = useRoute();
const router = useRouter();
const expertId = ref(route.params.expert_id);
const expertName = ref(route.query.expertName || '未知专家');

// 数据存储
const enterprises = ref([]);

// 当前日期
const currentDate = ref(new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}));

// 计算表格数据
const tableData = computed(() => {
  const data = [];
  const len = enterprises.value.length;
  const mid = Math.ceil(len / 2); // 将企业列表分为两部分

  for (let i = 0; i < mid; i++) {
    const col1 = enterprises.value[i] ? `${enterprises.value[i].province} - ${enterprises.value[i].name}` : '';
    const col2 = enterprises.value[i + mid] ? `${enterprises.value[i + mid].province} - ${enterprises.value[i + mid].name}` : '';
    data.push({ col1, col2 });
  }
  return data;
});

// 获取专家分配的企业信息
const fetchEnterprises = async () => {
  console.log(expertId.value);
  try {
    const response = await axios.get(`http://localhost:8080/api/admin/expert-enterprises/${expertId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (response.data.success) {
      enterprises.value = response.data.data;
    } else {
      ElMessage.error(response.data.message || '获取企业信息失败');
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态');
    console.error(error);
  }
};

// 返回上一页
const goBack = () => {
  router.push('/admin/review-progress');
};

// 打印表格
const printTable = () => {
  const printContent = document.querySelector('.print-area').innerHTML;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  // 修改打印时的iframe样式部分
iframeDoc.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* 仅修改标题和签字区，表格样式完全保留！ */
        h2 {
          text-align: center !important; /* 强制居中（覆盖原左对齐） */
          margin: 20px 0 !important; /* 保持原有间距 */
        }

        .signature-area {
          float: none !important; /* 取消浮动 */
          position: absolute !important; /* 绝对定位 */
          right: 1cm !important; /* 右页边距1cm（与@page一致） */
          bottom: 1cm !important; /* 底页边距1cm */
          width: auto !important; /* 自适应宽度 */
          text-align: right !important; /* 保持文字右对齐 */
          /* 以下保留原样式 */
          margin-top: 20px !important;
          font-size: 14px !important;
        }

        /* 关键：表格相关样式完全保留原始值！ */
        
        th, td { border: 1px solid #ccc !important; padding: 8px !important; }
        
        /* 保持原有打印页边距 */
        @page { margin: 1cm !important; }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
  </html>
`);
  iframeDoc.close();

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
};


// 组件挂载时获取数据
onMounted(() => {
  fetchEnterprises();
});
</script>

<style scoped>
.expert-export-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.print-area {
  position: relative;
}

.signature-area {
  margin-top: 20px;
  text-align: right;
  width: 300px;
  float: right;
}

.signature-area p {
  margin: 5px 0;
  font-size: 14px;
}

/* 自定义按钮样式 */
.custom-button {
  background-color: white;
  
}

.custom-button:hover {
  background-color: #f0f0f0;
}

</style>
