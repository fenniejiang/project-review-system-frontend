<template>
  <div>
    <div class="button-container">
      <el-button type="primary" class="print-button" @click="printTable">打印</el-button>
      <el-button type="success" @click="exportToExcel">导出Excel</el-button>
    </div>

    <div class="print-area">
      <el-table 
        :data="paginatedData" 
        stripe 
        style="width: 100%"
        ref="enterpriseTable"
        border
        max-height="835px"
      >
        <el-table-column 
          prop="province" 
          label="所属省份" 
          sortable 
          :sort-method="sortByPinyinAndNumberProvince"
        ></el-table-column>
        <el-table-column 
          prop="enterpriseName" 
          label="企业名称" 
          sortable 
          :sort-method="sortByPinyinAndNumberEnterprise"
        ></el-table-column>
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
      <el-pagination
        @current-change="handlePageChange"
        :current-page="currentPage"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="enterpriseData.length"
        style="margin-top: 20px; text-align: center;"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';

// const router = useRouter();
const enterpriseData = ref([]);
const enterpriseTable = ref(null);
const currentPage = ref(1); // 当前页码
const pageSize = ref(20);  // 每页20行

// 计算当前页的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return enterpriseData.value.slice(start, end);
});

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page;
};


// 提取字符串中的数字部分
const extractNumber = (str) => {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

// 按拼音和数字排序 - 所属省份
const sortByPinyinAndNumberProvince = (a, b) => {
  const provinceA = a.province || '';
  const provinceB = b.province || '';
  
  // 先按拼音比较中文部分
  const pinyinCompare = provinceA.localeCompare(provinceB, 'zh-CN');
  if (pinyinCompare !== 0) {
    return pinyinCompare;
  }
  
  // 如果拼音相同，按数字排序
  const numA = extractNumber(provinceA);
  const numB = extractNumber(provinceB);
  return numA - numB;
};

// 按拼音和数字排序 - 企业名称
const sortByPinyinAndNumberEnterprise = (a, b) => {
  const nameA = a.enterpriseName || '';
  const nameB = b.enterpriseName || '';
  
  // 先按拼音比较中文部分
  const pinyinCompare = nameA.localeCompare(nameB, 'zh-CN');
  if (pinyinCompare !== 0) {
    return pinyinCompare;
  }
  
  // 如果拼音相同，按数字排序
  const numA = extractNumber(nameA);
  const numB = extractNumber(nameB);
  return numA - numB;
};

// 打印表格（按每页16行分页打印）
const printTable = () => {
  const rowsPerPage = 16;
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

// 导出为 Excel 文件
const exportToExcel = () => {
  const exportData = enterpriseData.value.map(row => {
    const expertReviews = {};
    for (let i = 1; i <= 7; i++) {
      expertReviews[`专家${row[`expert${i}`]?.expertId || i}`] = formatExpertReview(row[`expert${i}`]);
    }
    return {
      '所属省份': row.province,
      '企业名称': row.enterpriseName,
      ...expertReviews,
      '最终结果': calculateFinalResult(row),
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '企业评审汇总');
  XLSX.writeFile(wb, `企业评审汇总_${new Date().toLocaleDateString()}.xlsx`);
};

// 获取所有企业评审汇总数据
const fetchEnterpriseReviewSummary = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/admin/all-enterprises-review-summary', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.data.success) {
      const rawData = response.data.data;
      enterpriseData.value = rawData.map(item => ({
        province: item.province || '未知',
        enterpriseName: item.enterpriseName || '未知',
        expert1: item.expertReviews[0] || null,
        expert2: item.expertReviews[1] || null,
        expert3: item.expertReviews[2] || null,
        expert4: item.expertReviews[3] || null,
        expert5: item.expertReviews[4] || null,
        expert6: item.expertReviews[5] || null,
        expert7: item.expertReviews[6] || null,
      }));
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取企业评审汇总失败');
    console.error(error);
  }
};

// 获取专家列标题（显示 ExpertID）
const getExpertColumnLabel = (index) => {
  if (enterpriseData.value.length === 0) return `专家${index}`;
  const expertData = enterpriseData.value[0][`expert${index}`];
  return expertData && expertData.expertId ? `专家 ${expertData.expertId}` : `专家${index}`;
};

// 格式化专家评审显示
const formatExpertReview = (expertData) => {
  if (!expertData || expertData.expertId === 0) return '未分配';
  if (expertData.status !== 'completed') return '评审中';
  return expertData.suggestSupport ? '建议支持' : '建议不支持';
};

// 计算最终结果
const calculateFinalResult = (row) => {
  const expertReviews = [];
  let allCompleted = true;
  let assignedCount = 0;

  for (let i = 1; i <= 7; i++) {
    const expert = row[`expert${i}`];
    if (expert && expert.expertId !== 0) {
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
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
}

.print-area {
  width: 100%;
}

@media print {
  .button-container {
    display: none; /* 隐藏按钮容器 */
  }
  .sidebar {
    display: none; /* 隐藏侧边栏 */
  }
  body > *:not(.print-area) {
    display: none;
  }
  .print-area {
    display: block;
  }
}
.print-button {
  background-color: #7367f0;
}
::v-deep .el-button:hover {
  background-color: #7367f0;
}
::v-deep .el-pager li.is-active, .el-pager li:hover {
    color: #7367f0;;
}
</style>
