<template>
    <div>
      <el-upload v-bind="uploadOptions">
        <el-button type="primary">上传 Excel</el-button>
      </el-upload>

      <div v-if="provinceData.length" style="margin-top: 30px;">
        <v-chart :option="getPieOption(provinceData, '省份占比')" autoresize style="height: 600px;" />
      </div>

      <div v-if="industryData.length" style="margin-top: 20px;">
        <v-chart :option="getPieOption(industryData, '所属领域占比')" autoresize style="height: 600px;" />
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import VChart from 'vue-echarts';
import * as echarts from 'echarts'; 

import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
    PieChart,
    TooltipComponent,
    LegendComponent,
    CanvasRenderer
]);

const provinceData = ref([]);
const industryData = ref([]);

const getPieOption = (data, title) => ({
    title: {
        text: title,
        left: 'center',
    },
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
    },
    legend: {
        bottom: 10,
        left: 'center',
    },
    series: [
        {
            name: title,
            type: 'pie',
            radius: '50%',
            data,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
        },
    ],
});

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

const handleExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 3) {
        ElMessage.error('Excel 格式不正确，至少需要三行');
        return;
    }

    const headerRow = rows[1].map((cell, index) => {
        const secondRow = rows[2]?.[index] || '';
        return `${cell || ''}${secondRow || ''}`.trim();
    });

    const provinceIdx = headerRow.findIndex(h => h.includes('省份'));
    const industryIdx = headerRow.findIndex(h => h.includes('所属领域'));

    if (provinceIdx === -1 || industryIdx === -1) {
        ElMessage.error('找不到“省份”或“所属领域”列');
        return;
    }

    const provinceCount = {};
    const industryCount = {};

    rows.slice(3).forEach((row) => {
        const province = row[provinceIdx]?.toString().trim();
        const industry = row[industryIdx]?.toString().trim();
        if (province) provinceCount[province] = (provinceCount[province] || 0) + 1;
        if (industry) industryCount[industry] = (industryCount[industry] || 0) + 1;
    });

    provinceData.value = Object.entries(provinceCount).map(([name, value]) => ({ name, value }));

    // 对所属领域数据进行排序并筛选前 30 项
    const sortedIndustryData = Object.entries(industryCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    industryData.value = sortedIndustryData.slice(0, 30);

    ElMessage.success('数据分析完成');
};

const uploadOptions = {
    action: '#',
    beforeUpload,
    httpRequest({ file }) {
        handleExcel(file);
    },
};

onMounted(() => {
    // 可以在这里添加初始化操作
});
</script>