<template>
  <div class="info-container">
    <div class="left">
      <p style="font-size: large; color: #e6a23c;">
        <i class="el-icon-edit"></i>
        正在修改 {{ company }} 的评审记录（ID: {{ route.params.id }}）
      </p>
      <el-button @click="goToReviewRecords">返回记录列表</el-button>
      <el-button type="warning" @click="cancelEdit">放弃修改</el-button>
    </div>
    <!-- <div class="right">
      <el-button @click="handleLogout">退出系统</el-button>
    </div> -->
  </div>

  <!-- 文件列表 -->
  <div v-if="files.length" style="padding: 0 20px;">
    <h3>企业文件材料</h3>
    <el-table :data="files" style="width: 100%">
      <el-table-column prop="name" label="文件名" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button @click="previewFile(row.name)" size="small">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
  <el-empty v-else description="暂无材料文件"></el-empty>

  <div class="combined-container">
    <!-- PDF 预览 -->
     <div class="pdf-viewer" >
<div v-if="pdfUrl">
      <embed :src="pdfUrl" 
      type="application/pdf"
       width="100%" 
       height="900px"
       style="transform-origin: center center;" />
    </div>
    <el-empty v-else description="请选择文件查看PDF"></el-empty>
     </div>
    

    <!-- 评审表格 -->
    <div class="table-review" v-loading="isLoading">
      <div class="button-container">
        <el-button type="success" :disabled="isSubmitting||!isModified" @click="submitTableHandler">
          {{ isSubmitting ? '提交中...' : '提交修改' }}
        </el-button>
      </div>
      <div class="print-container">
        <div class="print-area">
          <div class="header-info">
            <span>省份：{{ province }}</span>
            <span>企业：{{ company }}</span>
          </div>
          <table class="table-container">
            <tbody>
              <tr v-for="(item, idx) in tableData" :key="idx">
                <td v-if="idx===0" :rowspan="tableData.length" class="vertical-text">符合性审核</td>
                <td class="indicator-content">{{ item.indicator }}</td>
                <td>
                  <el-radio v-model="item.selected" label="match">符合</el-radio>
                  <el-radio v-model="item.selected" label="notMatch">不符合</el-radio>
                </td>
              </tr>
              <tr class="jielun">
                <td>审核结论</td>
                <td colspan="2">
                  <el-radio v-model="footerData.suggestion" label="support" :disabled="hasNotMatch">建议支持</el-radio>
                  <el-radio v-model="footerData.suggestion" label="notSupport">建议不支持</el-radio>
                  <div v-if="footerData.suggestion==='notSupport'" class="rejection-reason">
                    <label>* 不建议理由（至少20字）：</label>
                    <el-input type="textarea" v-model="footerData.rejectionReason" :rows="3" maxlength="500" show-word-limit/>
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
      </div>
    </div>
  </div>
  
 
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { getCurrentDate } from '@/utils/dateUtils';
const route = useRoute();
const router = useRouter();

const signatureData = ref({ dateLabel: getCurrentDate() });
const expertId = ref(sessionStorage.getItem('currentExpertId')||'');
if (!expertId.value && route.query.expertId) {
  expertId.value = route.query.expertId;
  sessionStorage.setItem('currentExpertId', expertId.value);
}

// axios 实例 + 拦截
const api = axios.create({ baseURL:'http://localhost:8080', timeout:10000 });
api.interceptors.request.use(cfg=>{
  if (!expertId.value) router.push('/login');
  const token = localStorage.getItem(`token_${expertId.value}`);
  if (!token) router.push('/login');
  cfg.headers = { ...cfg.headers, Authorization:`Bearer ${token}`, 'X-Expert-ID':expertId.value };
  cfg.params = { ...(cfg.params||{}), expert_id: expertId.value };
  return cfg;
});

const province = ref(''), company = ref(''), files = ref([]);
const tableData = ref([]), footerData = ref({ suggestion:null, rejectionReason:'' });
const isLoading = ref(false), isSubmitting=ref(false), isModified=ref(false);
const pdfUrl = ref('');let currentObjectUrl = null;

const hasNotMatch = computed(()=>tableData.value.some(i=>i.selected==='notMatch'));
watch([tableData, footerData], ()=>isModified.value=true,{ deep:true });

const loadDetail = async ()=>{
  isLoading.value = true;
  try {
    const { data } = await api.get(`/expert/review-records/${route.params.id}`);
    province.value = data.Province;
    company.value  = data.EnterpriseName;
    tableData.value = data.ReviewResults.map(r=>({ indicator:r.Indicator, selected:r.Selected }));
    footerData.value = { suggestion: data.SuggestSupport?'support':'notSupport', rejectionReason:data.RejectionReason||'' };
  } catch {
    ElMessage.error('加载详情失败'); router.push('/login');
  } finally { isLoading.value=false; }
};

const loadFiles = async ()=>{
  try {
    const res = await api.get(`/expert/review-files`, { params:{ assignmentId: route.params.id }});
    files.value = (res.data.files||[]).map(name=>({ name }));
  } catch {
    ElMessage.error('加载文件列表失败');
  }
};

const previewFile = async (name)=>{
  if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl=null; }
  isLoading.value = true;
  try {
    const resp = await api.get(`/expert/secure-files/review-material`, {
      params:{ assignmentId:route.params.id, filename:name },
      responseType:'blob'
    });
    const blob = new Blob([resp.data],{ type:resp.headers['content-type'] });
    currentObjectUrl = URL.createObjectURL(blob);
    pdfUrl.value = currentObjectUrl;
  } catch (err) {
    ElMessage.error('预览失败');
  } finally { isLoading.value=false; }
};

const submitTableHandler = async ()=>{
  if (tableData.value.some(i=>!i.selected)) { ElMessage.warning('请完成所有指标评审'); return; }
  if (footerData.value.suggestion==='notSupport'&&footerData.value.rejectionReason.trim().length<20){
    ElMessage.warning('不建议理由需至少20个字'); return;
  }
  isSubmitting.value=true;
  try {
    await api.put(`/expert/review-records/${route.params.id}`, {
      results:tableData.value.map(i=>({ indicator:i.indicator, selected:i.selected })),
      suggestSupport:footerData.value.suggestion==='support',
      rejectionReason:footerData.value.rejectionReason.trim()
    });
    ElMessage.success('提交成功'); router.push('/review-records');
  } catch {
    ElMessage.error('提交失败');
  } finally { isSubmitting.value=false; }
};

const cancelEdit = ()=>{
  if (!isModified.value) return router.back();
  ElMessageBox.confirm('未保存修改，放弃？','提示',{ type:'warning' })
    .then(()=>router.back());
};

const goToReviewRecords = ()=>router.back();
const handleLogout = ()=>{ sessionStorage.removeItem('currentExpertId'); router.push('/login'); };

onMounted(async ()=>{
  await loadDetail();
  await loadFiles();
});
</script>

<style scoped>
/* …保持之前的样式… */
</style>


<style scoped>
/* 其他样式保持不变 */

/* .pdf-viewer {
  flex: 1;
  min-width: 50%;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
} */


</style>


<style scoped>
.info-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 30px 50px 30px 30px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.left {
  display: flex;
  gap: 15px;
  align-items: center;
}

.right {
  display: flex;
  gap: 15px;
}

.combined-container {
  display: flex;
  gap: 20px;
  margin: 20px;
}




.button-container {
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.print-area {
  padding: 20px;
  background-color: #fff;
}


.table-container td {
  padding: 12px;
  border: 1px solid #ebeef5;
}

.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  text-align: center;
  min-width: 40px;
}

.jielun td {
  background-color: #f5f7fa;
  font-weight: bold;
}

.rejection-reason {
  margin-top: 15px;
}

.required-star {
  color: red;
  margin-right: 5px;
}

.word-count {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.hint-text {
  color: #909399;
  font-size: 12px;
}
</style>
<style scoped>
.info-container {
  display: flex;
  align-items: center;
  justify-content:space-between;
  margin:30px 50px 30px 30px;
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