<template>
  <div class="login-container">
    <!-- 顶部银行标识 -->
    <div class="bank-header">
      <h1 class="bank-name">银行柜面业务系统</h1>
    </div>

    <!-- 登录卡片 -->
    <el-card class="login-card" shadow="always">
      <h2 class="card-title">柜员登录</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="柜员工号" prop="tellerNo">
          <el-input
            v-model="form.tellerNo"
            placeholder="请输入柜员工号"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入登录密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <span>还没有账号？</span>
        <el-button type="primary" link @click="$router.push('/register')">立即注册</el-button>
      </div>
    </el-card>

    <div class="login-footer">© {{ currentYear }} 银行柜面业务系统 版权所有</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/user'
import { login } from '../../api/auth'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const currentYear = computed(() => new Date().getFullYear())

const form = reactive({
  tellerNo: '',
  password: '',
})

const rules = {
  tellerNo: [
    { required: true, message: '请输入柜员工号', trigger: 'blur' },
    { min: 3, max: 20, message: '工号长度为 3-20 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await login({ tellerNo: form.tellerNo, password: form.password })
      userStore.setLogin(res.token, res.user)
      ElMessage.success(`欢迎回来，${res.user.name}`)
      router.push('/dashboard')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a2463 0%, #1e4d8c 60%, #2d6fbd 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.bank-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.bank-name {
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.login-card {
  width: 420px;
  border-radius: 12px;
  padding: 12px 8px;
}

.card-title {
  text-align: center;
  color: #0a2463;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 28px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #0a2463, #1e4d8c);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(90deg, #1e4d8c, #2d6fbd);
}

.form-footer {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 8px;
}

.login-footer {
  margin-top: 32px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}
</style>
