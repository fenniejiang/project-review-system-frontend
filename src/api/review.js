import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 10000,
});

// 初始化评审 (unchanged)
export const initReview = () => instance.post('/init-review');

// 请求评审
export const requestReview = (expertId) => {
    if (!expertId) {
        throw new Error('缺少 expertId 参数');
    }
    const token = localStorage.getItem(`token_${expertId}`);
    if (!token) {
        throw new Error('未找到专家的 Token: ' + expertId);
    }
    return instance.get('/expert/request-review', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        params: { expert_id: expertId },
    });
};

// 提交表格数据
export const submitTable = (expertId, data) => {
    if (!expertId) {
        throw new Error('缺少 expertId 参数');
    }
    const token = localStorage.getItem(`token_${expertId}`);
    if (!token) {
        throw new Error('未找到专家的 Token: ' + expertId);
    }
    return instance.post('/expert/submit-review', data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        params: { expert_id: expertId }
    }).then(response => {
        console.log('提交成功，返回数据:', response.data);
        return response;
    }).catch(error => {
        console.error('提交失败:', error.response?.data || error.message);
        throw error;
    });
};

export default instance;
