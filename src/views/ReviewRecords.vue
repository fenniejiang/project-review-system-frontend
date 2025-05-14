<template>
  <div class="review-records">
    <h2>评审记录列表</h2>
    <el-table :data="records" style="width: 100%">
      <el-table-column prop="enterpriseName" label="企业名称" />
      <el-table-column prop="reviewDate" label="评审日期" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button @click="viewDetail(row.id)">查看详情</el-button>
        </template>
      </el-table-column>
      <el-table-column label="" width="120">
        <template #default="{ row }">
          <el-button
            type="primary"
            @click="editReview(row.id)"
          >评审修改</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="button-group" style="margin-top: 20px">
      <el-button type="primary" @click="printAll">打印全部</el-button>
      <el-button @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const records = ref([]);

// 取专家 ID：优先 sessionStorage，其次 URL query（首次跳转用）
const getExpertId = () => {
  let id = sessionStorage.getItem('currentExpertId');
  if (!id && route.query.expertId) {
    id = route.query.expertId;
    sessionStorage.setItem('currentExpertId', id);
  }
  return id;
};

// axios 实例，列表页不需要在此设置拦截器，可直接在请求中写 headers/params
const instance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000
});
const fetchRecords = async () => {
  const expertId = getExpertId();
  if (!expertId) {
    ElMessage.error('未登录或登录已过期，请重新登录');
    router.push('/login');
    return;
  }
  const token = localStorage.getItem(`token_${expertId}`);
  if (!token) {
    ElMessage.error('未找到登录信息，请重新登录');
    router.push('/login');
    return;
  }

  try {
    const { data } = await instance.get('/expert/review-records', {
      headers: { Authorization: `Bearer ${token}` },
      params: { expert_id: expertId }
    });
    
    // 处理记录为空的情况
    if (!data || data.length === 0) {
      records.value = []; // 确保 records 为空数组
      ElMessage.info('评审记录为空');
      return;
    }
    
    // 转换记录格式
    records.value = data.map(r => ({
      id: r.AssignmentID,
      enterpriseName: r.EnterpriseName,
      reviewDate: r.ReviewDate
    }));
  } catch (err) {
    console.error(err);
    ElMessage.error('获取评审记录失败');
  }
};    

const viewDetail = (id) => {
  router.push({ path: `/review-records/${id}`, query: { expertId: getExpertId() } });
};

const editReview = (id) => {
  router.push({ path: `/review-records/${id}/edit`, query: { expertId: getExpertId() } });
};

const goBack = () => {
  router.push({
    path:'/expert-review',
    query:{
      expertId:getExpertId()
    }
  });
};
// 生成打印内容
const generatePrintContent = (details) => {
  let printContent = '';
  details.forEach(detail => {
    const tableHtml = `
      <div class="print-container">
        <div class="header-info">
          <span>省份：${detail.Province}</span>
          <span>企业：${detail.EnterpriseName}</span>
        </div>
        <table class="table-container">
          <thead>
            <tr>
              <th colspan="2">审核指标</th>
              <th>判断结果（请选择）</th>
            </tr>
            <tr>
              <th style="width: 50px;"></th>
              <th style="width: 200px;"></th>
              <th style="width: 150px;"></th>
            </tr>
          </thead>
          <tbody>
            ${detail.ReviewResults.map((item, index) => `
              <tr>
                ${index === 0 ? `<td rowspan="6" class="vertical-text">符合性审核</td>` : ''}
                <td class="indicator-content">${item.Indicator}</td>
                <td>
                  <span class="radio-disabled">
                    <input type="radio" ${item.Selected === 'match' ? 'checked' : ''} disabled />
                    符合
                  </span>
                  <span class="radio-disabled">
                    <input type="radio" ${item.Selected === 'notMatch' ? 'checked' : ''} disabled />
                    不符合
                  </span>
                </td>
              </tr>
            `).join('')}
            <tr class="jielun">
              <td>审核结论</td>
              <td colspan="2">
                ${detail.SuggestSupport ? '建议支持' : ''}
                ${!detail.SuggestSupport ? `
                  <div class="rejection-reason">
                    <label>不建议理由：</label>
                    <p>${detail.RejectionReason}</p>
                  </div>
                ` : ''}
              </td>
            </tr>
          </tbody>
        </table>
        <table class="table-container" style="margin-top: -1px;">
          <tbody>
            <tr class="signature-row">
              <td colspan="3">
                <span class="signature-label">专家签字：</span>
                <span class="date-label">${getCurrentDate()}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    printContent += tableHtml;
  });
  return printContent;
};

// 打印全部
const printAll = async () => {
  // 确认是否打印所有评审记录
  await ElMessageBox.confirm('确定要打印所有评审记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    ElMessage.info('正在准备打印内容，请稍候...');
    // 获取所有评审详情
    const details = await fetchAllReviewDetails();
    // 检查评审记录是否为空
    if (details.length === 0) {
      ElMessage.info('没有评审记录可打印');
      return;
    }
    // 生成打印内容
    const printContent = generatePrintContent(details);
    // 创建 iframe 元素
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
          <title>打印全部评审记录</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
           .print-container { width: 600px; height: auto; box-sizing: border-box; margin-bottom: 20px; page-break-after: always; }
           .table-container { width: 100%; border-collapse: collapse; border: 1px solid #999999; }
           .table-container th, .table-container td { padding: 8px; border: 1px solid #999999; text-align: center; background-color: white; }
           .indicator-content { text-align: left !important; white-space: pre-wrap; word-break: break-word; }
           .rejection-reason { margin-top: 10px; }
           .rejection-reason label { display: block; text-align: left !important; }
           .rejection-reason p { width: 100%; min-height: 100px; padding: 5px; box-sizing: border-box; text-align: left !important; white-space: pre-wrap; border: 1px solid #dcdfe6; font-family: Arial, sans-serif; font-size: 14px; }
           .vertical-text { writing-mode: vertical-lr; text-orientation: upright; white-space: nowrap; }
           .signature-row td { text-align: left; padding: 8px; height: 200px; vertical-align: top; position: relative; }
           .signature-label { position: absolute; top: 8px; left: 8px; }
           .date-label { position: absolute; bottom: 8px; right: 8px; }
           .header-info { display: flex; justify-content: flex-start; margin-bottom: 10px; padding-left: 10px; }
           .header-info span { margin-right: 20px; }
           .jielun { height: 200px; }
           .radio-disabled { margin-right: 10px; }
           .radio-disabled input[type="radio"] { margin-right: 5px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    iframeDoc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }).catch(() => {
    ElMessage.info('已取消打印');
  });
};
// 安全获取存储值
const safeGetItem = (storage, key, defaultValue = '') => {
  if (typeof storage !== 'undefined' && storage !== null) {
    return storage.getItem(key) || defaultValue;
  }
  console.error(`${storage === sessionStorage ? 'sessionStorage' : 'localStorage'} 不可用`);
  return defaultValue;
};


// 获取所有评审详情
const fetchAllReviewDetails = async () => {
  const expertId = safeGetItem(sessionStorage, 'currentExpertId', '');
  const token = safeGetItem(localStorage, `token_${expertId}`, '');
  try {
    const recordsResponse = await instance.get('/expert/review-records', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { expert_id: expertId },
    });
    const recordIds = recordsResponse.data.map(record => record.AssignmentID);
    const details = await Promise.all(
      recordIds.map(id =>
        instance.get(`/expert/review-records/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { expert_id: expertId },
        }).then(res => res.data)
      )
    );
    return details;
  } catch (error) {
    console.error('获取所有评审详情失败:', error);
    ElMessage.error('获取所有评审详情失败');
    throw error;
  }
};


// 获取当前日期
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${year} 年 ${month} 月 ${day} 日`;
};
onMounted(fetchRecords);
</script>

<style scoped>
.review-records {
  padding: 20px;
}
.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
