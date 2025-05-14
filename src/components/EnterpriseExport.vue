<template>
  <div>
    <div class="button-container">
      <el-button @click="goBack">返回</el-button>
      <el-button @click="printTable">打印</el-button>
    </div>

    <div class="print-area">
      <el-table 
        :data="enterpriseData" 
        stripe 
        style="width: 100%"
        ref="enterpriseTable"
      >
        <el-table-column prop="province" label="所属省份"></el-table-column>
        <el-table-column prop="enterpriseName" label="企业名称"></el-table-column>
        <el-table-column 
          v-for="index in 7" 
          :key="index"
          :label="getExpertColumnLabel(index)"
          :prop="`expert${index}`"
        >
          <template #default="scope">
            {{ formatExpertReview(scope.row[`expert${index}`]) }}
          </template>
        </el-table-column>
        <el-table-column label="最终结果">
          <template #default="scope">
            {{ calculateFinalResult(scope.row) }}
          </template>
        </el-table-column>
      </el-table>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const enterpriseData = ref([]);
const enterpriseTable = ref(null);



const goBack = () => {
  router.back();
};

const printTable = () => {
  const rowsPerPage = 24;
  const numPages = Math.ceil(enterpriseData.value.length / rowsPerPage);
  let printHtml = '';

  for (let i = 0; i < numPages; i++) {
    const start = i * rowsPerPage;
    const end = start + rowsPerPage;
    const dataSlice = enterpriseData.value.slice(start, end);

    let tableHtml = `
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>所属省份</th>
            <th>企业名称</th>
            ${Array.from({ length: 7 }, (_, idx) => `<th>专家 ${enterpriseData.value[0]?.[`expert${idx + 1}`]?.expertId || idx + 1}</th>`).join('')}
            <th>最终结果</th>
          </tr>
        </thead>
        <tbody>
    `;
    dataSlice.forEach(row => {
      tableHtml += `
        <tr>
          <td>${row.province || ''}</td>
          <td>${row.enterpriseName || ''}</td>
          ${Array.from({ length: 7 }, (_, idx) => `<td>${formatExpertReview(row[`expert${idx + 1}`])}</td>`).join('')}
          <td>${calculateFinalResult(row)}</td>
        </tr>
      `;
    });
    tableHtml += '</tbody></table>';

    if (i < numPages - 1) {
      printHtml += `<div style="page-break-after: always;">${tableHtml}</div>`;
    } else {
      printHtml += `<div>${tableHtml}</div>`;
    }
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          @page {
            margin: 1cm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          thead {
            display: table-header-group !important;
          }
          tbody {
            display: table-row-group;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            page-break-inside: avoid !important;
            word-break: break-word;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        ${printHtml}
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

const fetchEnterpriseReviewSummary = async () => {
  try {
    const enterpriseId = route.params.enterprise_id;
    const response = await axios.get(`http://localhost:8080/api/admin/enterprise-review-summary/${enterpriseId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.data.success) {
      const rawData = response.data.data;
      const formattedData = {
        province: rawData.province || '未知',
        enterpriseName: rawData.enterpriseName || '未知',
        ...Object.fromEntries(
          rawData.expertReviews.map((review, index) => [
            `expert${index + 1}`,
            {
              expertId: review.expertId,
              suggestSupport: review.suggestSupport,
              status: review.status
            }
          ])
        )
      };
      enterpriseData.value = [formattedData];
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取企业评审信息失败');
    console.error(error);
  }
};

const getExpertColumnLabel = (index) => {
  const expertData = enterpriseData.value[0]?.[`expert${index}`];
  return expertData ? `专家 ${expertData.expertId}` : `所分配到的专家ID${index}`;
};

const formatExpertReview = (expertData) => {
  if (!expertData) return '未分配';
  if (expertData.status !== 'completed') return '评审中';
  return expertData.suggestSupport ? '建议支持' : '建议不支持';
};

const calculateFinalResult = (row) => {
  const expertReviews = [];
  let allCompleted = true;
  let assignedCount = 0;

  for (let i = 1; i <= 7; i++) {
    const expert = row[`expert${i}`];
    if (expert) {
      assignedCount++;
      if (expert.status !== 'completed') {
        allCompleted = false;
        break;
      }
      expertReviews.push(expert.suggestSupport);
    }
  }

  if (assignedCount < 7 || !allCompleted) return '';
  const unsupportCount = expertReviews.filter(support => !support).length;
  return unsupportCount >= 3 ? '不立项' : '立项';
};

onMounted(() => {
  fetchEnterpriseReviewSummary();
});
</script>

<style scoped>
.button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
}

.print-area {
  width: 100%;
}

@media print {
  .button-container {
    display: none;
  }
  .sidebar {
    display: none;
  }
  body > *:not(.print-area) {
    display: none;
  }
  .print-area {
    display: block;
  }
}
</style>
