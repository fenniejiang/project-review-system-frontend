<template>
  <div class="container-xxl">
    <div class="authentication-wrapper authentication-basic container-p-y">
      <div class="authentication-inner py-6">
        <div class="card">
          <div class="card-body">
            <!-- Logo -->
            <div class="app-brand justify-content-center mb-6">
              <span class="app-brand-logo">
                <img src="@/assets/logo.png" style="width: 80px; height: 80px;">
              </span>
            </div>

            <h4 class="mb-1 text-center mb-6">用户登录评审系统</h4>

            <form class="mb-4" @keydown.enter="login">
              <div class="mb-6">
                <label for="input_name" class="form-label">用户名</label>
                <input
                  type="text"
                  class="form-control"
                  id="input_name"
                  v-model="loginForm.username"
                  placeholder="请输入您的用户名称"
                  autofocus />
              </div>
              
              <div class="mb-6 form-password-toggle">
                <label class="form-label" for="input_password">输入密码</label>
                <div class="password-input-wrapper">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    id="input_password"
                    class="form-control"
                    v-model="loginForm.password"
                    placeholder="请输入您的登录密码" />
                  
                  <!-- 小眼睛图标 SVG版 -->
                  <span class="password-toggle" @click="togglePassword">
                    <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#aaa" viewBox="0 0 24 24">
                      <path d="M12 5c-7.633 0-11 7-11 7s3.367 7 11 7 11-7 11-7-3.367-7-11-7zm0 12c-2.761 0-5-2.239-5-5s2.239-5 
                      5-5 5 2.239 5 5-2.239 5-5 5z"/>
                      <path d="M12 9c-1.654 0-3 1.346-3 3s1.346 3 3 3
                      3-1.346 3-3-1.346-3-3-3z"/>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#aaa" viewBox="0 0 24 24">
                      <path d="M1.393 4.21l2.278 2.278c-1.729 1.516-2.671 3.378-2.671 3.378s3.367 7 
                      11 7c1.852 0 3.432-.361 4.785-.957l2.206 2.206 1.414-1.414-18-18-1.414 1.414zm5.093 
                      5.093l1.292 1.292c-.242.433-.384.927-.384 1.405 0 1.654 1.346 3 
                      3 3 .478 0 .972-.142 1.405-.384l1.292 1.292c-.835.418-1.783.692-2.697.692-2.761 
                      0-5-2.239-5-5 0-.914.274-1.862.692-2.697zm4.514-3.187l2.513 
                      2.513c.653.287 1.243.677 1.766 1.164.751.693 1.346 1.493 1.794 
                      2.207-.446.713-1.042 1.514-1.794 2.207-.523.487-1.113.877-1.766 
                      1.164l1.435 1.435c.489-.293.946-.625 1.375-1.004 1.728-1.515 
                      2.67-3.377 2.67-3.377s-3.367-7-11-7c-.44 
                      0-.87.026-1.29.073z"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div class="mb-6">
                <button class="btn btn-primary d-grid w-100" type="button" @click="login" :disabled="isLoading">
                  {{ isLoading ? '正在登录...' : '登录' }}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const isLoading = ref(false);
const loginForm = ref({
  username: '',
  password: ''
});

const showPassword = ref(false);
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const login = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.error('请输入用户名和密码');
    return;
  }
  isLoading.value = true;
  try {
    const response = await axios.post(' http://localhost:8080/api/login', loginForm.value, {
      withCredentials: true
    });
    if (response.data.success) {
      if (response.data.user_type === 'admin') {
        window.location.href = '/admin/admin-home';
      } else {
        const { expert_id, token } = response.data;
        if (!expert_id) {
          ElMessage.error('登录失败：缺少专家 ID');
          return;
        }
        localStorage.setItem(`token_${expert_id}`, token);
        localStorage.setItem(`${expert_id}`, expert_id);
        sessionStorage.setItem('currentExpertId', expert_id);
        window.location.href = '/waiting-page'
      }
    } else {
      ElMessage.error(response.data.message || '用户名或密码错误');
    }
  } catch (error) {
    ElMessage.error('用户名或密码错误');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.btn-primary {
  background-color: #62ccde;
  border-color: #62ccde;
}
input {
  border-radius: 5px;
}
input:hover {
  border: solid 2px #7367f0;
}

/* 密码框小眼睛的位置 */
.password-input-wrapper {
  position: relative;
}
.password-input-wrapper input {
  padding-right: 40px; /* 给小眼睛留空间 */
}
.password-toggle {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.password-toggle:hover svg {
  fill: #7367f0;
}
</style>
