<template>
  <div class="info-container">
    <div class="left">
      <p style="font-size: large;color:#e6a23c;" >欢迎专家: {{ expertName }}</p>
      <el-button @click="goToReviewRecords">查看评审记录</el-button>
      <el-button
        v-if="!currentAssignmentId || isSubmitted"
        @click="startReview"
      >
        {{ !currentAssignmentId ? '开始评审获取企业材料' : '获取下一份企业材料' }}
      </el-button>
      <span v-if="!!currentAssignmentId && !isSubmitted" style="margin-left: 10px; color: #e6a23c;">
        当前任务进行中，请先完成并提交
      </span>
    </div>
    <div class="right">
      <el-button @click="showConfirmDialog">退出评审系统</el-button>
    </div>
  </div>

  <div v-if="files.length" style="padding: 0 20px;">
    <h3>企业文件材料</h3>
    <el-table :data="files" style="width: 100%">
      <el-table-column :label="`分配省份：${province || ''} 的企业：${company || ''} 的材料文件夹内容如下`">
        <template #default="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button @click="reviewFile(scope.row)" size="small" :disabled="isLoading">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
  <p v-else-if="currentAssignmentId && !files.length" style="padding: 0 20px; color: #909399;">此任务暂无关联文件。</p>

  <div class="combined-container">
    <div class="pdf-viewer">
      <div v-if="pdfUrl || isLoading" class="pdf-area"
           v-loading="isLoading"
           element-loading-text="正在加载 PDF..."
           element-loading-background="rgba(255, 255, 255, 0.8)">
        <embed 
          v-if="pdfUrl && !isLoading" 
          :src="pdfUrl" 
          type="application/pdf" 
          width="100%" 
          height="900px"
          style="transform-origin: center center;"
        >
      </div>
      <el-empty v-else description="请点击“开始评审”获取企业材料及对应PDF"></el-empty>
    </div>

    <div v-if="currentAssignmentId" class="table-review">
      <div class="button-container">
        <el-button @click="printTable" :disabled="!currentAssignmentId">打印表格</el-button>
        <el-button @click="submitTableHandler" :disabled="isSubmitted || !currentAssignmentId" type="success">提交</el-button>
        <el-button @click="fetchNextMaterial" :disabled="!isSubmitted">获取下一份企业材料</el-button>
      </div>
      <div class="print-container">
        <div class="print-area">
          <div class="header-info">
            <span>省份：{{ province || '' }}</span>
            <span>企业：{{ company || '' }}</span>
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
              <template v-if="tableData.length > 0">
                <tr v-for="(item, index) in tableData" :key="item.indicator + '-' + index">
                  <td v-if="index === 0" :rowspan="tableData.length" class="vertical-text">{{ item.indicatorTitle || '符合性审核' }}</td>
                  <td class="indicator-content">{{ item.indicator }}</td>
                  <td>
                    <el-radio v-model="item.selected" label="match" :disabled="isSubmitted">符合</el-radio>
                    <el-radio v-model="item.selected" label="notMatch" :disabled="isSubmitted">不符合</el-radio>
                  </td>
                </tr>
                <tr class="jielun">
                  <td>审核结论</td>
                  <td colspan="2">
                    <!-- 增加 hasNotMatch 判断，当有不符合项时禁用“建议支持”选项 -->
                    <el-radio v-model="footerData.suggestion" label="support" :disabled="isSubmitted || hasNotMatch">建议支持</el-radio>
                    <el-radio v-model="footerData.suggestion" label="notSupport" :disabled="isSubmitted">建议不支持</el-radio>
                    <br>
                    <span>（有一项不符合，即为建议不支持）</span>
                    <div v-if="footerData.suggestion === 'notSupport'" class="rejection-reason">
                      <label for="rejection-reason">
                        <span class="required-star">*</span>不建议理由：（至少20个字）
                      </label>
                      <el-input
                        type="textarea"
                        id="rejection-reason"
                        v-model="footerData.rejectionReason"
                        :rows="3"
                        placeholder="请输入不建议理由"
                        resize="none"
                        :disabled="isSubmitted"
                      ></el-input>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="3" style="text-align: center; padding: 20px; color: #909399;">
                  正在加载审核指标...
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
      </div>
    </div> 
    <div v-else class="table-review" style="display: flex; justify-content: center; align-items: center; ">
      <el-empty description="当前无评审任务，请点击“开始评审”按钮获取"></el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestReview, submitTable } from '../api/review'; 
import axios from 'axios';
import { useRouter } from 'vue-router';
import { getCurrentDate } from '@/utils/dateUtils';

if (typeof window === 'undefined') {
  console.error('此代码只能在浏览器环境中运行');
}

const router = useRouter();

const safeGetItem = (storage, key, defaultValue = null) => {
  try {
    if (typeof storage !== 'undefined' && storage !== null) {
      const item = storage.getItem(key);
      return item === null ? defaultValue : item;
    }
    console.error(`${storage === sessionStorage ? 'sessionStorage' : 'localStorage'} 不可用`);
  } catch (e) {
    console.error(`访问 ${storage === sessionStorage ? 'sessionStorage' : 'localStorage'} 出错: `, e);
  }
  return defaultValue;
};

const showConfirmDialog = () => {
  ElMessageBox.confirm(
    '确认要退出评审吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    router.push('/');
    ElMessage.success('已退出评审');
  }).catch(() => {
    ElMessage.info('取消退出');
  });
};

const signatureData = ref({ dateLabel: getCurrentDate() });
const pdfUrl = ref(''); 
const isLoading = ref(false); 
const message = ref(''); 
const files = ref([]);
const expertId = ref('');
const currentEnterpriseId = ref('');
const currentAssignmentId = ref(''); 
const currentExpertId = ref('');
const province = ref('');
const company = ref('');
const tableData = ref([]); 
const footerData = ref({ suggestion: null, rejectionReason: '' });
const isSubmitted = ref(false); 
const expertName = ref('');
// 新增响应式变量，用于判断是否有审核指标为“不符合”
const hasNotMatch = ref(false);

let currentObjectUrl = null;

const fetchIndicators = async () => {
  if (!currentAssignmentId.value) {
    tableData.value = []; 
    return;
  }
  try {
    const response = await axios.get('http://localhost:8080/indicators'); 
    if (response.data?.success && Array.isArray(response.data.data)) {
      tableData.value = response.data.data.map((item, index) => ({
        indicatorTitle: index === 0 ? '符合性审核' : '', 
        indicator: item.indicator || `指标 ${index + 1}`,
        selected: null 
      }));
    } else {
      ElMessage.error('获取评审指标数据格式不正确');
      tableData.value = []; 
    }
  } catch (error) {
    console.error('获取指标失败:', error);
    ElMessage.error('获取评审指标失败');
    tableData.value = []; 
  }
};

const goToReviewRecords = () => {
  if (!expertId.value) {
    ElMessage.error('专家 ID 丢失，请重新登录');
    router.push('/login');
    return;
  }

  const reviewState = {
    currentAssignmentId: currentAssignmentId.value || '',
    currentEnterpriseId: currentEnterpriseId.value || '',
    currentExpertId: currentExpertId.value || expertId.value,
    files: files.value || [],
    province: province.value || '',
    company: company.value || '',
    message: message.value || '', 
    tableData: tableData.value || [],
    footerData: footerData.value || { suggestion: null, rejectionReason: '' },
    isSubmitted: isSubmitted.value || false,
    expertName: expertName.value || '',
  };
  sessionStorage.setItem('reviewState', JSON.stringify(reviewState));
  console.log('导航前保存状态到 sessionStorage:', reviewState);
  router.push('/review-records');
};

const startReview = async () => {
  if (!expertId.value) {
    ElMessage.error('专家 ID 丢失，请重新登录');
    router.push('/login');
    return;
  }

  isLoading.value = true; 
  pdfUrl.value = '';     
  files.value = [];      
  province.value = '';   
  company.value = '';
  tableData.value = [];  
  footerData.value = { suggestion: null, rejectionReason: '' }; 
  isSubmitted.value = false; 
  currentAssignmentId.value = ''; 
  currentEnterpriseId.value = '';
  currentExpertId.value = ''; 

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
    console.log('Revoked previous Object URL before starting new review');
  }

  try {
    const response = await requestReview(expertId.value); 
    console.log('获取新任务响应:', response.data);

    if (response.data?.success && response.data.data?.Assignment?.AssignmentID && response.data.data?.Assignment?.EnterpriseID) {
      const assignmentData = response.data.data.Assignment;
      const filesData = response.data.data.Files;

      currentAssignmentId.value = assignmentData.AssignmentID;
      currentEnterpriseId.value = assignmentData.EnterpriseID;
      currentExpertId.value = assignmentData.ExpertID; 

      if (Array.isArray(filesData)) {
        files.value = filesData.map(file => ({ name: file })); 
      } else {
        console.warn('任务分配成功，但文件列表为空或格式不正确。');
        files.value = [];
      }

      try {
        const enterpriseRes = await axios.get(`http://localhost:8080/enterprise/${currentEnterpriseId.value}`); 
        province.value = enterpriseRes.data.Province;
        company.value = enterpriseRes.data.Name;
      } catch (enterpriseError) {
        console.error('获取企业信息失败:', enterpriseError);
        ElMessage.error('获取企业详细信息失败');
        province.value = '获取失败'; 
        company.value = '获取失败';
      }

      await fetchIndicators();
    } else {
      ElMessage.warning(response.data?.message || '当前无可用评审任务'); 
      currentAssignmentId.value = ''; 
    }

    const reviewState = {
      currentAssignmentId: currentAssignmentId.value,
      currentEnterpriseId: currentEnterpriseId.value,
      currentExpertId: currentExpertId.value,
      files: files.value,
      province: province.value,
      company: company.value,
      tableData: tableData.value,
      footerData: footerData.value,
      isSubmitted: isSubmitted.value,
    };
    sessionStorage.setItem('reviewState', JSON.stringify(reviewState));
    console.log('开始/获取下一份评审后保存状态:', reviewState);
  } catch (error) {
    console.error('分配任务失败:', error);
    ElMessage.error(error.response?.data?.error || error.response?.data?.message || '分配任务时出错');
    currentAssignmentId.value = ''; 
    sessionStorage.removeItem('reviewState'); 
  } finally {
    isLoading.value = false; 
  }
};

const reviewFile = async (file) => {
  if (!file || !file.name) {
    ElMessage.error('无效的文件信息');
    return;
  }
  if (!currentAssignmentId.value) {
    ElMessage.error('缺少任务ID (Assignment ID)，无法获取文件');
    return;
  }

  isLoading.value = true; 
  pdfUrl.value = '';      

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
    console.log('Revoked previous Object URL');
  }

  try {
    const token = safeGetItem(localStorage, `token_${expertId.value}`); 
    if (!token) {
      ElMessage.error('认证令牌丢失，请重新登录');
      isLoading.value = false;
      router.push('/login'); 
      return;
    }

    console.log(`Requesting file: ${file.name} for assignment: ${currentAssignmentId.value}`);
    const response = await axios.get(`http://localhost:8080/expert/secure-files/review-material`, {
      params: {
        assignmentId: currentAssignmentId.value,
        filename: file.name 
      },
      headers: { 'Authorization': `Bearer ${token}` }, 
      responseType: 'blob' 
    });

    console.log('File request response headers:', response.headers);
    const contentType = response.headers['content-type'] || 'application/pdf'; 

    if (response.status !== 200 || (!contentType.includes('pdf') && !contentType.includes('octet-stream'))) {
      let errorMsg = '无法预览文件：服务器返回了非 PDF 内容';
      try {
        const errorText = await response.data.text(); 
        const errorJson = JSON.parse(errorText); 
        errorMsg = errorJson.message || errorJson.error || errorMsg;
      } catch (parseErr) {
        console.warn("无法将错误响应解析为JSON:", parseErr);
      }
      console.error('服务器返回了非 PDF 内容:', contentType, '状态:', response.status);
      ElMessage.error(errorMsg);
      throw new Error('无效的内容类型或错误响应'); 
    }

    const blob = new Blob([response.data], { type: contentType });
    currentObjectUrl = URL.createObjectURL(blob); 
    pdfUrl.value = currentObjectUrl; 
    console.log('Created new Object URL:', currentObjectUrl);
  } catch (error) {
    console.error('获取安全 PDF 文件失败:', error);
    pdfUrl.value = ''; 
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data; 
      let errorMsg = `加载文件失败 (状态码: ${status})`;
      if (errorData instanceof Blob && errorData.type.includes('json')) {
        try {
          const errorJson = JSON.parse(await errorData.text());
          errorMsg = errorJson.message || errorJson.error || errorMsg;
        } catch (parseError) { console.error('解析错误响应 Blob 失败:', parseError); }
      } else if (typeof errorData === 'object' && errorData !== null && !(errorData instanceof Blob)) {
        errorMsg = errorData.message || errorData.error || errorMsg;
      } else if (typeof errorData === 'string') { errorMsg = errorData; }
      if (status === 401) { errorMsg = '认证失败或Token已过期，请重新登录'; router.push('/login'); }
      else if (status === 403) { errorMsg = '无权访问此文件'; }
      else if (status === 404) { errorMsg = '文件未找到或任务不存在'; }
      ElMessage.error(errorMsg);
    } else if (error.request) { ElMessage.error('无法连接到服务器，请检查网络连接'); }
    else { ElMessage.error(error.message || '请求失败，请检查控制台信息'); }
  } finally {
    isLoading.value = false; 
  }
};

const validateForm = () => {
  if (!currentAssignmentId.value || tableData.value.length === 0) {
    ElMessage.error('无有效评审任务或指标数据，无法提交');
    return false;
  }
  const allIndicatorsSelected = tableData.value.every(item => item.selected === 'match' || item.selected === 'notMatch');
  if (!allIndicatorsSelected) {
    ElMessage.error('请完成所有审核项的选择');
    return false;
  }
  if (!footerData.value.suggestion) {
    ElMessage.error('请选择审核结论：“建议支持”或“建议不支持”');
    return false;
  }
  if (footerData.value.suggestion === 'notSupport') {
    if (!footerData.value.rejectionReason || footerData.value.rejectionReason.trim().length < 20) {
      ElMessage.error('选择“建议不支持”时，不建议理由至少需要填写20个字');
      return false;
    }
  }
  return true; 
};

const submitTableHandler = async () => {
  if (isSubmitted.value) {
    ElMessage.warning('该评审结果已经提交，请勿重复提交');
    return;
  }
  if (!validateForm()) return;

  const submissionData = {
    AssignmentID: currentAssignmentId.value,
    ReviewResults: tableData.value.map(item => ({
      Indicator: item.indicator, 
      Selected: item.selected    
    })),
    SuggestSupport: footerData.value.suggestion === 'support', 
    RejectionReason: footerData.value.suggestion === 'notSupport' ? footerData.value.rejectionReason.trim() : '' 
  };

  console.log('准备提交评审数据:', submissionData);

  try {
    await submitTable(expertId.value, submissionData);
    ElMessage.success('评审结果提交成功！');
    isSubmitted.value = true; 

    try {
      const currentState = JSON.parse(safeGetItem(sessionStorage, 'reviewState', '{}') || '{}');
      currentState.isSubmitted = true;
      currentState.tableData = JSON.parse(JSON.stringify(tableData.value));
      currentState.footerData = JSON.parse(JSON.stringify(footerData.value));
      sessionStorage.setItem('reviewState', JSON.stringify(currentState));
      console.log('提交后更新并保存状态:', currentState);
    } catch (e) {
      console.error('更新 sessionStorage 状态失败:', e);
    }
  } catch (error) {
    console.error('提交失败:', error);
    let errorMsg = '提交失败';
    if (error.response) {
      const responseData = error.response.data;
      const status = error.response.status;
      if (status === 409 || (responseData?.error && responseData.error.includes("已提交"))) {
        errorMsg = '该评审结果已被提交，无法重复提交';
        isSubmitted.value = true; 
        try {
          const currentState = JSON.parse(safeGetItem(sessionStorage, 'reviewState', '{}') || '{}');
          if (!currentState.isSubmitted) { 
            currentState.isSubmitted = true;
            sessionStorage.setItem('reviewState', JSON.stringify(currentState));
            console.log('同步提交状态到sessionStorage:', currentState);
          }
        } catch (e) { console.error('更新sessionStorage提交状态失败:', e); }
      } else {
        errorMsg = responseData?.message || responseData?.error || `提交失败 (HTTP ${status})`;
      }
    } else if (error.request) { errorMsg = '网络错误，无法提交'; } 
    else { errorMsg = '提交过程中发生未知错误'; } 
    ElMessage.error(errorMsg);
  }
};

const fetchNextMaterial = async () => {
  if (!isSubmitted.value) {
    ElMessage.error('请先提交当前评审结果');
    return;
  }
  pdfUrl.value = '';
  await startReview(); 
};

const printTable = () => {
  let printContent = document.querySelector(".print-container").outerHTML;
  const rejectionReasonValue = footerData.value.rejectionReason || '';
  const textareaRegex = /<textarea[^>]*id="rejection-reason"[^>]*>([\s\S]*?)<\/textarea>/i;
  printContent = printContent.replace(
    textareaRegex,
    `<div class="rejection-reason-text">${rejectionReasonValue.replace(/\n/g, '<br>')}</div>`
  );

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
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .print-container { width: 600px; height: auto; box-sizing: border-box; }
          .table-container { width: 100%; border-collapse: collapse; border: 1px solid #999999; }
          .table-container th, .table-container td { padding: 8px; border: 1px solid #999999; text-align: center; background-color: white; }
          .indicator-content { text-align: left !important; white-space: pre-wrap; word-break: break-word; }
          .rejection-reason { margin-top: 10px; }
          .rejection-reason label { display: block; text-align: left !important; }
          .rejection-reason-text { width: 100%; min-height: 100px; padding: 5px; box-sizing: border-box; text-align: left !important; white-space: pre-wrap; border: 1px solid #dcdfe6; font-family: Arial, sans-serif; font-size: 14px; }
          .vertical-text { writing-mode: vertical-lr; text-orientation: upright; white-space: nowrap; }
          .signature-row td { text-align: left; padding: 8px; height: 200px; vertical-align: top; position: relative; }
          .signature-label { position: absolute; top: 8px; left: 8px; }
          .date-label { position: absolute; bottom: 8px; right: 8px; }
          .header-info { display: flex; justify-content: flex-start; margin-bottom: 10px; padding-left: 10px; }
          .header-info span { margin-right: 20px; }
          .required-star { color: red; }
          .jielun { height: 200px; }
          .table-container thead tr:nth-child(2) th { border: none; border-bottom: 1px solid #999999; }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  iframeDoc.close();

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
};

const fetchExpertInfo = async () => {
  try {
    const token = safeGetItem(localStorage, `token_${expertId.value}`);
    if (!token) {
      ElMessage.error('认证令牌丢失，请重新登录');
      router.push('/login');
      return;
    }

    const response = await axios.get('http://localhost:8080/expert/info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.data?.success) {
      expertName.value = response.data.data.username || '专家';
    } else {
      expertName.value = '专家';
    }
  } catch (error) {
    console.error('获取专家信息失败:', error);
    expertName.value = '专家';
  }
};

onMounted(async() => {
  expertId.value = safeGetItem(sessionStorage, 'currentExpertId');
  if (!expertId.value) {
    ElMessage.error('专家 ID 丢失，请重新登录');
    router.push('/login');
    return;
  }
  await fetchExpertInfo();

  const savedState = safeGetItem(sessionStorage, 'reviewState');
  console.log('组件挂载时从 sessionStorage 恢复状态:', savedState);

  if (savedState) {
    try {
      const reviewState = JSON.parse(savedState);

      currentAssignmentId.value = reviewState.currentAssignmentId || '';
      currentEnterpriseId.value = reviewState.currentEnterpriseId || '';
      currentExpertId.value = reviewState.currentExpertId || expertId.value; 
      files.value = reviewState.files || [];
      province.value = reviewState.province || '';
      company.value = reviewState.company || '';
      tableData.value = reviewState.tableData || []; 
      footerData.value = reviewState.footerData || { suggestion: null, rejectionReason: '' }; 
      isSubmitted.value = reviewState.isSubmitted || false; 
      expertName.value = reviewState.expertName || ''; 

      if (currentAssignmentId.value && tableData.value.length === 0 && !isSubmitted.value) {
        console.log('恢复状态时发现指标为空且任务未提交，尝试重新获取指标...');
        fetchIndicators(); 
      }
    } catch (e) {
      console.error("解析 sessionStorage 中的 reviewState 失败:", e);
      sessionStorage.removeItem('reviewState'); 
      currentAssignmentId.value = '';
      tableData.value = [];
    }
  } else {
    console.log('没有找到保存的评审状态。');
    currentAssignmentId.value = ''; 
    tableData.value = [];      
  }
});

onUnmounted(() => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    console.log('组件卸载，释放 Object URL:', currentObjectUrl);
    currentObjectUrl = null;
  }
});

// 深度监听 tableData 变化，当有指标被选为“不符合”时，自动将审核结论设为“建议不支持”
watch(tableData, () => {
  const hasNotMatchValue = tableData.value.some(item => item.selected === 'notMatch');
  hasNotMatch.value = hasNotMatchValue;
  if (hasNotMatchValue) {
    footerData.value.suggestion = 'notSupport';
  }
}, { deep: true });
</script>

<style scoped>
.info-container {
  display: flex;
  align-items: center;
  justify-content:space-between;
  margin:30px 50px 30px 30px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}
.left {
  display: flex;
  flex-direction:row;
  align-items: flex-start;
}

.right {
  display: flex;
  align-items: flex-end;
}
.info-container p {
  margin: 0;
  margin-right: 10px;
}
.button-container {
  display: flex;
}
.combined-container {
  display: flex;
  gap: 20px;
  padding: 20px;
}
.pdf-viewer {
  flex: 1;
  margin-top: 50px;
}
.table-review {
  flex: 1;
}
.indicator-content {
  text-align: left !important;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 8px;
}
.rejection-reason {
  margin-top: 10px;
}
.rejection-reason label {
  display: block;
  text-align: left !important;
  margin-bottom: 10px;
}
.rejection-reason textarea {
  width: 100%;
  height: 100px;
  padding: 5px;
  box-sizing: border-box;
  text-align: left !important;
  white-space: pre-wrap;
}
.jielun {
  height: 200px;
}
body {
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.print-container {
  width: 600px;
  height: 800px;
  box-sizing: border-box;
  overflow: auto;
}
.table-container {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #999999;
}
.table-container th,
.table-container td {
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #999999;
  background-color: white;
  text-align: center;
}
.table-container thead tr:nth-child(2) th:nth-child(1),
.table-container thead tr:nth-child(2) th:nth-child(2) {
  border-left: none;
  border-right: none;
  border-top: none;
}
.table-container thead tr:nth-child(2) th:nth-child(1) {
  border-bottom: 1px solid #999999;
}
.table-container thead tr:nth-child(2) th:nth-child(2) {
  border-bottom: 1px solid #999999;
}
.vertical-text {
  writing-mode: vertical-lr;
  text-orientation: upright;
  white-space: nowrap;
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
.table-review {
  margin-top: 50px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
}
@media print {
  body * {
    visibility: hidden;
  }
  .print-container,
  .print-container * {
    visibility: visible;
    position: static;
    -webkit-print-color-adjust: exact;
  }
  .print-container {
    width: 100%;
    height: auto;
    border: none;
    overflow: visible;
  }
  .table-container {
    border: 1px solid #999999 !important;
  }
  .table-container th,
  .table-container td {
    border: 1px solid #999999 !important;
  }
  .indicator-content {
    text-align: left !important;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .rejection-reason textarea {
    width: 100%;
    height: 100px;
    padding: 5px;
    box-sizing: border-box;
    text-align: left !important;
    white-space: pre-wrap;
    overflow: auto;
    border: 1px solid #dcdfe6;
    font-family: Arial, sans-serif;
    font-size: 14px;
  }
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
.required-star {
  color: red;
}
.pdf-area {
  position: relative;
}
</style>    