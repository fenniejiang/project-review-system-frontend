// src/api.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

const baseURL = 'http://localhost:8080/api';

export const getReviewProgress = async () => {
  try {
    const response = await axios.get(`${baseURL}/admin/review-progress`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.data.success) {
      return response.data.data;
    } else {
      ElMessage.error(response.data.message || '获取评审进度失败');
      return [];
    }
  } catch (error) {
    ElMessage.error('获取评审进度失败: ' + error.message);
    return [];
  }
};

export const getTotalEnterprises = async () => {
  try {
    const response = await axios.get(`${baseURL}/enterprises`);
    if (response.data.success) {
      return response.data.data.length;
    } else {
      ElMessage.error('获取企业总数失败: ' + response.data.message);
      return 0;
    }
  } catch (error) {
    ElMessage.error('请求失败: ' + error.message);
    return 0;
  }
};

export const getExperts = async () => {
  try {
    const response = await axios.get(`${baseURL}/admin/experts`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.data.success) {
      return response.data.data;
    } else {
      ElMessage.error(response.data.message || '获取专家列表失败');
      return [];
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态');
    return [];
  }
};
