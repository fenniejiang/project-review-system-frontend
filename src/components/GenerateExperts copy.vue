<template>
  <div class="generate-experts">
    <h2>生成专家账号</h2>
    <el-form label-width="100px" class="form-container">
      <el-form-item label="专家数量">
        <el-input v-model="expertCount" type="number" :min="1" class="input-box"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="generateExperts" class="submit-button">生成账号</el-button>
      </el-form-item>
    </el-form>

    <div class="table-header">
      <h3>已生成的专家账号</h3>
      <el-button  @click="printTable" class="print-button">打印</el-button>
    </div>

    <div class="print-area" style="width: 100%; overflow: auto;">
      <div class="table-container">
        <el-table :data="paginatedData" border style="width: 100%;" table-layout="fixed">
          <el-table-column label="专家名称" width="200">
            <template #default="{ row }">
              {{ row.expert1?.username }}
            </template>
          </el-table-column>
          <el-table-column label="密码" width="200">
            <template #default="{ row }">
              {{ row.expert1?.password }}
            </template>
          </el-table-column>
          <el-table-column label="专家名称" width="200">
            <template #default="{ row }">
              {{ row.expert2?.username }}
            </template>
          </el-table-column>
          <el-table-column label="密码" width="200">
            <template #default="{ row }">
              {{ row.expert2?.password }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="experts.length"
        layout="prev, pager, next"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const expertCount = ref(1);
const experts = ref([]);

// 分页相关变量
const currentPage = ref(1);
const pageSize = ref(50); // 每页48个专家，即24行（每行2个专家）

// 计算分页后的表格数据（用于前端展示）
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  const slicedExperts = experts.value.slice(start, end);
  const data = [];
  const mid = Math.ceil(slicedExperts.length / 2);
  for (let i = 0; i < mid; i++) {
    const expert1 = slicedExperts[i];
    const expert2 = slicedExperts[i + mid];
    data.push({ expert1, expert2 });
  }
  return data;
});

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page;
};

// 生成专家账号
const generateExperts = async () => {
  const count = Number(expertCount.value);
  if (isNaN(count) || count < 1) {
    ElMessage.error('专家数量必须是大于 0 的整数');
    return;
  }
  try {
    const response = await axios.post('http://localhost:8080/api/admin/create_experts', { count });
    if (response.data.success) {
      ElMessage.success(response.data.message);
      fetchExperts();
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('请求失败');
  }
};

// 获取数据库中的专家账号
const fetchExperts = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/admin/experts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (response.data.success) {
      experts.value = response.data.data;
    } else {
      ElMessage.error(response.data.message || '获取专家账号失败');
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态');
    console.error(error);
  }
};

// 打印表格（按分页打印，每页24行）
const printTable = () => {
  const expertsPerPage = 54; // 每页48个专家，即24行
  const numPages = Math.ceil(experts.value.length / expertsPerPage);
  let printHtml = '';

  for (let i = 0; i < numPages; i++) {
    const start = i * expertsPerPage;
    const end = start + expertsPerPage;
    const expertsSlice = experts.value.slice(start, end);
    const mid = Math.ceil(expertsSlice.length / 2);
    const tableDataSlice = [];
    for (let j = 0; j < mid; j++) {
      const expert1 = expertsSlice[j];
      const expert2 = expertsSlice[j + mid];
      tableDataSlice.push({ expert1, expert2 });
    }

    // 生成每个页面的表格HTML
    let tableHtml = `
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="width: 200px;">专家名称</th>
            <th style="width: 200px;">密码</th>
            <th style="width: 200px;">专家名称</th>
            <th style="width: 200px;">密码</th>
          </tr>
        </thead>
        <tbody>
    `;
    tableDataSlice.forEach(row => {
      tableHtml += `
        <tr>
          <td>${row.expert1?.username || ''}</td>
          <td>${row.expert1?.password || ''}</td>
          <td>${row.expert2?.username || ''}</td>
          <td>${row.expert2?.password || ''}</td>
        </tr>
      `;
    });
    tableHtml += '</tbody></table>';

    // 为每个表格添加分页符（最后一页除外）
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
          .print-area {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
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
            padding: 16px;
            text-align: left;
            page-break-inside: avoid !important;
            word-break: break-word;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="print-area">
          ${printHtml}
        </div>
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

// 组件挂载时获取专家账号
onMounted(() => {
  fetchExperts();
});
</script>
<style scoped>
.table-container {
  max-width: 800px;
  width: 100%;
  overflow-x: auto;
}

.generate-experts {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-container {
  width: 400px;
  text-align: center;
  margin-bottom: 20px;
}

.input-box {
  width: 100%;
}

.submit-button {
  width: 100%;
  background-color: #7367f0;
}
::v-deep .el-button:hover {
  background-color: #7367f0;
}
.table-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  margin-bottom: 10px;
}

.print-button {
  margin-left: auto;
}

.print-area {
  width: 100%;
  max-width: 800px;
}

.el-table th,
.el-table td {
  text-align: left !important;
  padding: 8px !important;
}

.pagination {
  margin-top: 10px;
  text-align: center;
}

@media print {
  thead {
    display: table-header-group !important;
  }
  tbody {
    display: table-row-group;
  }
  table {
    page-break-inside: auto;
  }
  tr, td, th {
    page-break-inside: avoid;
  }
}
::v-deep .el-pager li.is-active, .el-pager li:hover {
    color: #7367f0;;
}
</style>
