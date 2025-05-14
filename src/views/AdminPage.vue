<template>
  <div class="admin-dashboard">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="navbar-header">
            <div class="nav navbar-nav flex-rownav-item me-auto">
                <a class="navbar-brand" href="/admin/admin-home">
                    <div class="brand-container">
                      <div width="40px" height="40px" > <img style="width: 40px;" src="@/assets/logo.png"></div>
                      <h1 class="brand-text mb-0">专家评审</h1>
                    </div>
                </a>
            </div>

    </div>
        <el-menu :default-active="activeMenu" @select="handleMenuSelect" >
          <el-menu-item class="item" index="/admin/admin-home">管理员首页</el-menu-item>
          <el-menu-item class="item" index="/admin/import-files">清点企业材料文件列表</el-menu-item>
          <el-menu-item class="item" index="/admin/generate-experts">生成专家账号</el-menu-item>
          
          <el-menu-item class="item" index="/admin/start-review">启动评审</el-menu-item>
          <el-menu-item class="item" index="/admin/assign-experts">企业分配情况</el-menu-item>
          <el-menu-item class="item" index="/admin/review-progress">专家评审进度</el-menu-item>
          <el-sub-menu index="summary-analysis">
            <template #title>
              <span>汇总分析</span>
            </template>
            <el-menu-item class="item"  index="/admin/review-expert">
              专家个人汇总
            </el-menu-item>
            <el-menu-item class="item"  index="/admin/enterprise-summary">
              企业汇总
            </el-menu-item>
            <el-menu-item class="item"  index="/admin/indicator-summary">
              指标不通过汇总
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item class="item" index="/admin/analysis">统计分析</el-menu-item>

        </el-menu>
      </el-aside>
      <!-- 路由出口 -->
      <el-main class="bg-f8f8f8">
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMenu, ElSubMenu, ElMenuItem } from 'element-plus';
// import { Shop } from '@element-plus/icons-vue';
// 获取当前路由路径
const route = useRoute();
const activeMenu = ref(route.path);
// 获取路由实例
const router = useRouter();

// 处理菜单点击
const handleMenuSelect = (index) => {
  activeMenu.value = index;
  router.push(index); // 跳转到对应路由
};
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  display: flex;
}

.sidebar {
  background-color: white;
  height: 100vh;
  color: white;
}

.el-menu {
  border-right: none;
}
.brand-container {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  gap: 10px; /* 图片和标题之间的间距 */
  margin-bottom: 10px;
}
::v-deep .item.is-active {
  background: linear-gradient(118deg, #7367f0, rgba(115, 103, 240, 0.7));
    box-shadow: 0 0 10px 1px rgba(115, 103, 240, 0.7);
    color: #fff;
    font-weight: 400;
    border-radius: 4px;
    margin: 10px;
}
/* 子菜单项样式 */
::v-deep .sub-menu-item {
  background-color: white;
  color: #333;
  padding: 8px 24px;
  margin: 0;
}
/* 禁用默认悬停效果 */
::v-deep .menu-item:hover {
  background-color: white;
  color: #333;
}
</style>