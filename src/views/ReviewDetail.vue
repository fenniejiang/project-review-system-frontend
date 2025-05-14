<template>
  <div class="review-detail">
    <h2 class="title">评审记录详情</h2>
    <div class="print-container">
      <div class="header-info">
        <span>省份：{{ province }}</span>
        <span>企业：{{ company }}</span>
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
          <tr v-for="(item, index) in reviewResults" :key="index">
            <td v-if="index === 0" rowspan="6" class="vertical-text">符合性审核</td>
            <td class="indicator-content">{{ item.Indicator }}</td>
            <td>
              <span class="radio-disabled">
                <input type="radio" :checked="item.Selected === 'match'" disabled />
                符合
              </span>
              <span class="radio-disabled">
                <input type="radio" :checked="item.Selected === 'notMatch'" disabled />
                不符合
              </span>
            </td>
          </tr>
          <tr class="jielun">
            <td>审核结论</td>
            <td colspan="2">
              {{ suggestSupport ? '建议支持' : '' }}
              <div v-if="!suggestSupport" class="rejection-reason">
                <label>不建议理由：</label>
                <p>{{ rejectionReason }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="table-container" style="margin-top: -1px;">
        <tbody>
          <tr class="signature-row">
            <td colspan="3">
              <span class="signature-label">专家签字：</span>
              <span class="date-label">{{ signatureData.dateLabel }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="button-group">
      <el-button type="primary" @click="printTable">打印</el-button>
      <el-button @click="$router.push('/review-records')">返回列表</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import instance from '../api/review';

// 获取当前日期并格式化为“YYYY 年 MM 月 DD 日”
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${year} 年 ${month} 月 ${day} 日`;
};

// 初始化数据
const route = useRoute();
const province = ref('');
const company = ref('');
const reviewResults = ref([]);
const suggestSupport = ref(false);
const rejectionReason = ref('');
const signatureData = ref({ dateLabel: getCurrentDate() });

const fetchDetail = async (recordId) => {
  const expertId = sessionStorage.getItem('currentExpertId');
  if (!expertId) {
    ElMessage.error('未找到专家 ID，请重新登录');
    throw new Error('未找到 currentExpertId');
  }
  const token = localStorage.getItem(`token_${expertId}`);
  if (!token) {
    ElMessage.error('未找到 Token，请重新登录');
    throw new Error('未找到专家的 Token: ' + expertId);
  }
  try {
    const response = await instance.get(`/expert/review-records/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: { expert_id: expertId },
    });
    const data = response.data;
    // 更新 ref 变量
    province.value = data.Province;
    company.value = data.EnterpriseName;
    reviewResults.value = data.ReviewResults;
    suggestSupport.value = data.SuggestSupport;
    rejectionReason.value = data.RejectionReason;
  } catch (error) {
    console.error('获取评审详情失败', error);
    ElMessage.error('获取评审详情失败，请检查登录状态');
    throw error;
  }
};

// 打印表格
const printTable = () => {
  const printContent = document.querySelector('.print-container').outerHTML;
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
        <title>打印表格</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
          }
          .print-container {
            width: 600px;
            height: auto;
            box-sizing: border-box;
          }
          .table-container {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #999999;
          }
          .table-container th,
          .table-container td {
            padding: 8px;
            border: 1px solid #999999;
            text-align: center;
            background-color: white;
          }
          .indicator-content {
            text-align: left !important;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .rejection-reason {
            display: block;
            text-align: left !important;
            margin-left: 10px;
          }
          .vertical-text {
            writing-mode: vertical-lr;
            text-orientation: upright;
            white-space: nowrap;
          }
          .jielun {
            height: 200px;
          }
          .signature-row td {
            text-align: left;
            padding: 8px;
            height: 200px;
            vertical-align: top;
            position: relative;
          }
          .signature-label {
            position: absolute;
            top: 8px;
            left: 8px;
          }
          .date-label {
            position: absolute;
            bottom: 8px;
            right: 8px;
          }
          .header-info {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 10px;
            padding-left: 10px;
          }
          .header-info span {
            margin-right: 20px;
          }
          .radio-disabled {
            margin-right: 10px;
          }
          .radio-disabled input[type="radio"] {
            margin-right: 5px;
          }
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

// 在组件挂载时获取数据
onMounted(() => {
  const recordId = route.params.id; // 从路由参数中获取 recordId
  if (recordId) {
    fetchDetail(recordId);
  } else {
    ElMessage.error('未找到记录 ID');
  }
});
</script>

<style scoped>
.review-detail {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  margin-bottom: 20px;
}

.print-container {
  width: 600px;
  height: auto;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.table-container {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #999999;
}

.table-container th,
.table-container td {
  padding: 8px;
  border: 1px solid #999999;
  text-align: center;
  background-color: white;
}

.vertical-text {
  writing-mode: vertical-lr;
  text-orientation: upright;
  white-space: nowrap;
}

.indicator-content {
  text-align: left !important;
  white-space: pre-wrap;
  word-break: break-word;
}

.jielun {
  height: 200px;
}

.header-info {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
  padding-left: 10px;
}

.header-info span {
  margin-right: 20px;
}

.rejection-reason {
  display: block;
  text-align: left !important;
  margin-left: 10px;
}

.signature-row td {
  text-align: left;
  padding: 8px;
  height: 200px;
  vertical-align: top;
  position: relative;
}

.signature-label {
  position: absolute;
  top: 8px;
  left: 8px;
}

.date-label {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.radio-disabled {
  margin-right: 10px;
}

.radio-disabled input[type="radio"] {
  margin-right: 5px;
}
</style>
