<template>
    <el-card class="w-full">
      <h2 class="text-xl font-bold mb-4">评审未通过指标汇总</h2>
  
      <el-table :data="summaryList" style="width: 100%" border>
        <el-table-column prop="Indicator" label="指标名称" />
        <el-table-column prop="Count" label="不通过次数" />
      </el-table>
    </el-card>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  
  const summaryList = ref([])
  
  onMounted(async () => {
    try {
      const res = await axios.get('http://localhost:8080/analysis/rejection/summary')
  
      // 如果返回数据结构是 { data: [...] }，取 .data.data，否则直接取 .data
      if (res.data && Array.isArray(res.data)) {
        summaryList.value = res.data
      } else if (res.data && Array.isArray(res.data.data)) {
        summaryList.value = res.data.data
      } else {
        console.warn('返回数据格式不符合预期:', res.data)
      }
  
      console.log('加载数据成功:', summaryList.value)
    } catch (err) {
      console.error('加载汇总数据失败:', err)
    }
  })
  </script>
  
  <style scoped>
  /* 样式可根据需要扩展 */
  </style>
  