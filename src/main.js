import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as echarts from 'echarts';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'  // <<<<<< 新加这一行

import './css/style.css';

const app = createApp(App);

// 这里统一注册所有 Element Plus 的图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

const observerErr = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed')) {
    return;
  }
  observerErr(...args);
};

app.use(router);
app.use(ElementPlus);
app.mount('#app');
app.provide('echarts', echarts);
