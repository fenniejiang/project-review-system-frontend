<template>
  <div class="expert-detail-container">
    <div class="header">
      <el-button @click="goBack">返回</el-button>
      <el-button @click="printTable">打印</el-button>
    </div>

    <div class="print-area">
      <h2>专家打分汇总表</h2>

      <el-table :data="tableData" border style="width: 100%" ref="table">
        <el-table-column label="评审企业" prop="enterprise" width="150" />

        <!-- 动态生成指标列 -->
        <el-table-column
          v-for="(value, key) in indicators"
          :key="key"
          :label="key"
          :prop="key" 
          width="120"
        />
        <template #empty>
    <el-empty description="暂无数据" />
  </template>
        <el-table-column label="是否通过" prop="suggestSupport" width="100" />
        <el-table-column label="原因" prop="rejectionReason" width="200" />
      </el-table>

      <!-- 签字区 -->
      <div class="signature-area">
        <p>专家签字：____________________</p>
        <p>日期：{{ currentDate }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const expertId = ref(route.params.expert_id);
// const expertName = ref(route.query.expertName || '未知专家');
const currentDate = ref(new Date().toLocaleDateString());

const rawData = ref([]);

// 动态从返回的 indicators 字段生成表头
const indicators = computed(() => {
  // Add null check before accessing rawData.value[0]
  if (!rawData.value || !Array.isArray(rawData.value) || rawData.value.length === 0) {
    return {};
  }
  return rawData.value[0]?.indicators
    ? Object.keys(rawData.value[0].indicators).reduce((acc, key) => {
        if (key !== '其他') {
          acc[key] = key;
        }
        return acc;
      }, {})
    : {};
});

const tableData = computed(() => {
   // 添加空值检查
   if (!rawData.value || !Array.isArray(rawData.value)) {
    return [];
  }
  return rawData.value.map(item => {
    const resultMap = Object.keys(item.indicators).reduce((acc, key) => {
      acc[key] =
        item.indicators[key] === 'match'
          ? '符合'
          : item.indicators[key] === 'notMatch'
          ? '不符合'
          : '';
      return acc;
    }, {});

    return {
      enterprise: item.enterprise_name || '',
      ...resultMap,
      suggestSupport: item.suggest_support ? '建议支持' : '不建议支持',
      rejectionReason: item.rejection_reason?.trim() ? item.rejection_reason : '无',
    };
  });
});

const fetchData = async () => {
  try {
    const res = await axios.get(
      `http://localhost:8080/api/admin/expert-enterprise-reviews/${expertId.value}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );
    if (res.data.success) {
      rawData.value = res.data.data;
      nextTick(() => {
        // 在数据加载后，进行后续处理，避免触发 ResizeObserver 错误
      });
    } else {
      ElMessage.error(res.data.message || '获取数据失败');
    }
  } catch (err) {
    console.error(err);
    ElMessage.error('请求失败，请检查网络或服务器状态');
  }
};

const goBack = () => {
  router.push('/admin/review-expert');
};

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
  iframeDoc.write(`
    <html>
      <head>
        <style>
          h2 {
            text-align: center;
            margin: 20px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            word-break: break-word;
          }
          .signature-area {
        
            text-align: right;
            position: absolute;
            bottom: 0.5cm;
            right: 1cm;
            font-size: 14px;
            width: 100%;
          }
          @page { margin: 1cm; }
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
  setTimeout(() => document.body.removeChild(iframe), 1000);
};

onMounted(fetchData);
</script>

<style scoped>
.expert-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.print-area {
  position: relative;
  padding-bottom: 100px;
}

/* .signature-area {
  text-align: right;
  font-size: 14px;
  margin-top: 20px;
  position: absolute;
  bottom: 1cm;
  right: 1cm;
  width: 100%;
} */
.signature-area {
  text-align: right;
  font-size: 14px;
  margin-top: 50px;
  width: 100%;
  page-break-inside: avoid;
}

.el-table {
  display: block;
  overflow: hidden;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
  }
  .el-button {
    display: none;
  }
  .expert-detail-container {
    padding: 0;
    margin: 0;
  }
}
</style>
