<template>
    <div class="admin-home">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="welcome-card">
            <h2>欢迎管理员登录评审系统!</h2>
          </el-card>
        </el-col>
      </el-row>
  
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="system-card">
            <h3>系统概况</h3>
            <el-row>
              <el-col :span="12">
                <div class="stat-item">
                  <span>总专家数</span>
                  <h2>{{ totalExperts }}</h2>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-item">
                  <span>总企业数</span>
                  <h2>{{ totalEnterprises }}</h2>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
  
        <el-col :span="12">
          <el-card class="system-card">
            <h3>评审进度</h3>
            <el-progress
              :percentage="reviewProgress"
              :text-inside="true"
              stroke-width="24"
              color="#7367f0"
            ></el-progress>
            <div class="progress-detail">
              {{ completedReviews }} / {{ totalReviews }} 已完成
            </div>
          </el-card>
        </el-col>
      </el-row>
  
      <el-card>
        <h2>操作流程说明</h2>
        <ol>
          <li><el-button type="primary">上传企业材料</el-button><p>请管理员将企业文件材料上传至 D:\upload。格式按照省份-企业名称</p></li>
          <li><el-button type="info">清点企业材料文件列表</el-button><p>检查企业材料文件的数量和完整性</p></li>
          <li><el-button type="success">生成专家账号</el-button><p>生成在场数量的专家账号并打印。</p></li>
          
          <li><el-button type="warning">修改评审指标</el-button><p>根据实际情况修改评审指标，并保存指标。</p></li>
          <li><el-button type="danger">启动评审</el-button><p>确认所有准备工作完成后，启动评审流程。</p></li>
          <li><el-button>查看企业分配和评审进度</el-button><p>可随时查看企业分配情况以及专家的评审进度。</p></li>
        </ol>
      </el-card>
  
      <el-card>
        <h2>最近操作</h2>
        <el-table :data="recentLogs" border>
          <el-table-column label="时间" width="180">
            <template #default="scope">{{ scope.row.time }}</template>
          </el-table-column>
          <el-table-column label="操作内容">
            <template #default="scope">{{ scope.row.action }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { getReviewProgress, getTotalEnterprises, getExperts } from '@/api/reviewProgress.js';
  
  const experts = ref([]);
  const totalEnterprises = ref(0);
  const reviewProgress = ref(0);
  const completedReviews = ref(0);
  const totalReviews = ref(0);
  const recentLogs = ref([
    { time: '2025-03-24 14:30', action: '生成了3个专家账号' },
    { time: '2025-03-24 10:00', action: '启动了2025年度评审' },
  ]);
  
  const totalExperts = computed(() => experts.value.length);
  
  const fetchData = async () => {
    totalEnterprises.value = await getTotalEnterprises();
    experts.value = await getExperts();
  
    const progressList = await getReviewProgress();
    const totalCompleted = progressList.reduce((sum, item) => sum + Number(item.completed_count || 0), 0);
    const totalTarget = totalEnterprises.value * 7;
  
    completedReviews.value = totalCompleted;
    totalReviews.value = totalTarget;
    reviewProgress.value = totalTarget > 0 ? Math.floor((totalCompleted / totalTarget) * 100) : 0;
  };
  
  onMounted(fetchData);
  </script>
  
  <style scoped>
  .admin-home { padding: 20px; }
  .welcome-card { background: #f8f9fa; text-align: center; padding: 30px; margin-bottom: 20px; }
  .stat-item { text-align: center; padding: 15px; }
  .stat-item h2 { font-size: 24px; color: #7367f0; margin: 0; }
  .el-progress { margin: 20px 0; }
  .progress-detail { text-align: center; color: #666; }
  .el-table { margin-top: 20px; }
  ol li { margin-bottom: 20px; }
  .system-card { height: 200px; margin-bottom: 20px; }
  </style>
  