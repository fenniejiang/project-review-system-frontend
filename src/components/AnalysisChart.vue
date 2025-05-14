<template>
  <div>
    <h3>{{ title }}</h3>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="!chartData.length" class="no-data">暂无数据</div>
    <div v-else ref="chartRef" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  api: {
    type: String,
    required: true,
  },
});

const chartRef = ref(null);
const chartData = ref([]);
const loading = ref(false);
const error = ref(null);
let chartInstance = null;

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  chartData.value = []; // 重置数据
  try {
    const response = await fetch(`http://localhost:8080${props.api}`);
    if (!response.ok) {
      throw new Error(`请求失败，状态码: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      // 确保 data.data 是数组，即使后端返回空也要处理
      chartData.value = Array.isArray(data.data) ? data.data : [];
    } else {
      throw new Error(data.message || '数据获取失败');
    }
  } catch (err) {
    error.value = err.message;
    console.error('获取数据失败:', err);
  } finally {
    loading.value = false;
  }
};

const renderChart = () => {
  if (!chartRef.value || !chartData.value.length) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    // 自适应窗口大小
    window.addEventListener('resize', () => chartInstance.resize());
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: props.title,
        type: 'pie',
        radius: ['40%', '70%'], // 环形图
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        data: chartData.value.map((item) => ({
          name: item.name || '未知',
          value: item.count || 0,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  chartInstance.setOption(option, true);
};

onMounted(() => {
  fetchData();
});

watch(() => props.api, () => {
  fetchData();
});

watch(chartData, () => {
  renderChart();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.loading,
.error-message,
.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}
.error-message {
  color: red;
}
</style>
