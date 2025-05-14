<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-upload
          action="#"
          :http-request="uploadOldFile"
          accept=".xlsx, .xls"
          :before-upload="beforeUpload"
          :disabled="uploading"
        >
          <el-button type="primary" :loading="uploading">上传往年数据</el-button>
        </el-upload>
        <AnalysisChart title="往年省份占比" api="/analysis/province/old" :key="oldProvinceKey" />
        <AnalysisChart title="往年行业占比" api="/analysis/industry/old" :key="oldIndustryKey" />
      </el-col>
      <el-col :span="12">
        <el-upload
          action="#"
          :http-request="uploadNewFile"
          accept=".xlsx, .xls"
          :before-upload="beforeUpload"
          :disabled="uploading"
        >
          <el-button type="primary" :loading="uploading">上传新数据</el-button>
        </el-upload>
        <AnalysisChart title="新数据省份占比" api="/analysis/province/new" :key="newProvinceKey" />
        <AnalysisChart title="新数据行业占比" api="/analysis/industry/new" :key="newIndustryKey" />
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <AnalysisChart title="合并省份占比" api="/analysis/province/all" :key="allProvinceKey" />
      </el-col>
      <el-col :span="12">
        <AnalysisChart title="合并行业占比" api="/analysis/industry/all" :key="allIndustryKey" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import AnalysisChart from '@/components/AnalysisChart.vue';

const uploading = ref(false);
const oldProvinceKey = ref(0);
const oldIndustryKey = ref(0);
const newProvinceKey = ref(0);
const newIndustryKey = ref(0);
const allProvinceKey = ref(0);
const allIndustryKey = ref(0);

const beforeUpload = (file) => {
  const isExcel =
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件！');
    return false;
  }
  return true;
};

const uploadFile = async (file, type) => {
  uploading.value = true;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`http://localhost:8080/upload/${type}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`上传请求失败，状态码: ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      ElMessage.success(data.message);
      // 更新图表
      if (type === 'old') {
        oldProvinceKey.value++;
        oldIndustryKey.value++;
      } else {
        newProvinceKey.value++;
        newIndustryKey.value++;
        allProvinceKey.value++;
        allIndustryKey.value++;
      }
    } else {
      ElMessage.error(data.message || '上传失败');
    }
  } catch (error) {
    ElMessage.error(`上传失败: ${error.message}`);
    console.error('上传错误:', error);
  } finally {
    uploading.value = false;
  }
};

const uploadOldFile = (options) => uploadFile(options.file, 'old');
const uploadNewFile = (options) => uploadFile(options.file, 'new');
</script>

<style scoped>
/* 可选样式 */
.el-row {
  margin-bottom: 20px;
}
</style>
