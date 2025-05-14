<template>
  <div class="container">
    <!-- 指标编辑区域 -->
    <h3>评审指标设置</h3>
    <el-table :data="indicators" style="width: 100%">
      <el-table-column label="指标名称">
        <template #default="scope">
          <el-input
            type="textarea"
            v-model="scope.row.indicator"
            placeholder="请输入指标名称"
            :rows="2"
            resize="none"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button type="danger" @click="removeIndicator(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="button-group">
      <el-button type="primary" class="add-button" @click="addIndicator">添加指标</el-button>
      <el-button type="primary" class="add-button" @click="saveIndicators">保存指标</el-button>
      <el-button type="primary" class="add-button" @click="openReview" :disabled="!isIndicatorsSaved">启动评审</el-button>
    </div>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
const message = ref('');
const indicators = ref([]); // 指标列表
const isIndicatorsSaved = ref(false); // 是否已保存指标

// 获取指标列表
const fetchIndicators = async () => {
  try {
    const response = await axios.get('http://localhost:8080/indicators');
    indicators.value = response.data.data.map(item => ({
      id: item.id,
      indicator: item.indicator
    }));
    isIndicatorsSaved.value = indicators.value.length > 0; // 如果有指标，视为已保存
  } catch (error) {
    message.value = '获取指标失败';
    indicators.value = [
      { id: null, indicator: '指标 1' },
      { id: null, indicator: '指标 2' },
      { id: null, indicator: '指标 3' },
      { id: null, indicator: '指标 4' },
      { id: null, indicator: '指标 5' },
      { id: null, indicator: '不存在其他不适宜推进情况' },
    ]; // 本地默认值（仅在请求失败时使用）
  }
};

// 添加新指标
const addIndicator = () => {
  indicators.value.push({ id: null, indicator: '' });
};

// 删除指标
const removeIndicator = (index) => {
  indicators.value.splice(index, 1);
};

// 保存指标
const saveIndicators = async () => {
  // 1. 检查是否有空指标
  const emptyIndex = indicators.value.findIndex(item => !item.indicator || item.indicator.trim() === '');
  if (emptyIndex !== -1) {
    ElMessage.error(`第 ${emptyIndex + 1} 个指标不能为空`);
    return;
  }
  try {
    await axios.put('http://localhost:8080/indicators', indicators.value);
    message.value = '指标保存成功';
    isIndicatorsSaved.value = true;
  } catch (error) {
    message.value = '保存指标失败';
  }
};

// 启动评审
const openReview = async () => {
  if (!isIndicatorsSaved.value) {
    message.value = '请先保存评审指标';
    return;
  }
  try {
    message.value = '正在初始化...';
    const response = await axios.post('http://localhost:8080/review/init');
    message.value = response.data.message;
  } catch (error) {
    message.value = error.response?.data?.message || '初始化失败';
  }
};

// 页面加载时获取指标
onMounted(() => {
  fetchIndicators();
});
</script>

<style scoped>
.container {
  padding: 20px;
}

.add-button {
  background-color: #7367f0;
}
::v-deep .el-button:hover {
  background-color: #7367f0;
}
.button-group {
  display: flex;
  gap: 10px; /* 按钮之间的间距 */
  margin-top: 20px;
}

.el-table .cell {
  padding: 0; /* 调整单元格内边距 */
}

.el-textarea__inner {
  font-family: inherit; /* 保持字体一致 */
}
</style>
