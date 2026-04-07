<template>
  <div class="register-container">
    <div class="bank-header">
      <h1 class="bank-name">银行柜面业务系统</h1>
    </div>

    <el-card class="register-card" shadow="always">
      <h2 class="card-title">柜员注册</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        size="large"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入真实姓名" clearable />
        </el-form-item>

        <el-form-item label="柜员工号" prop="tellerNo">
          <el-input
            v-model="form.tellerNo"
            placeholder="请输入柜员工号"
            clearable
            @blur="validateTellerNoUnique"
          >
            <template #suffix>
              <el-icon v-if="tellerNoChecking" class="is-loading"><Loading /></el-icon>
              <el-icon v-else-if="tellerNoExists === false" color="#67c23a"><CircleCheck /></el-icon>
              <el-icon v-else-if="tellerNoExists === true" color="#f56c6c"><CircleClose /></el-icon>
            </template>
          </el-input>
          <div v-if="tellerNoExists === true" class="field-error">该工号已被注册</div>
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="柜员" value="teller" />
            <el-option label="主管" value="supervisor" />
          </el-select>
        </el-form-item>

        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请设置登录密码（不少于6位）"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            :disabled="tellerNoExists === true"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <span>已有账号？</span>
        <el-button type="primary" link @click="$router.push('/login')">返回登录</el-button>
      </div>
    </el-card>

    <div class="register-footer">© {{ currentYear }} 银行柜面业务系统 版权所有</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register, checkTellerNo } from '../../api/auth'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const tellerNoChecking = ref(false)
const tellerNoExists = ref(null) // null=未检查 true=已存在 false=可用
const currentYear = computed(() => new Date().getFullYear())

const form = reactive({
  name: '',
  tellerNo: '',
  role: '',
  password: '',
  confirmPassword: '',
})

// 确认密码校验
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度为 2-20 位', trigger: 'blur' },
  ],
  tellerNo: [
    { required: true, message: '请输入柜员工号', trigger: 'blur' },
    { min: 3, max: 20, message: '工号长度为 3-20 位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请设置登录密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 工号失焦时校验唯一性
async function validateTellerNoUnique() {
  if (!form.tellerNo || form.tellerNo.length < 3) {
    tellerNoExists.value = null
    return
  }
  tellerNoChecking.value = true
  try {
    const res = await checkTellerNo(form.tellerNo)
    tellerNoExists.value = res.exists
  } finally {
    tellerNoChecking.value = false
  }
}

async function handleRegister() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (tellerNoExists.value === true) {
      ElMessage.error('该工号已被注册，请更换工号')
      return
    }
    loading.value = true
    try {
      await register({
        name: form.name,
        tellerNo: form.tellerNo,
        password: form.password,
        role: form.role,
      })
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a2463 0%, #1e4d8c 60%, #2d6fbd 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.bank-header {
  margin-bottom: 28px;
}

.bank-name {
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.register-card {
  width: 460px;
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

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #0a2463, #1e4d8c);
  border: none;
}

.register-btn:hover {
  background: linear-gradient(90deg, #1e4d8c, #2d6fbd);
}

.field-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

.form-footer {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 8px;
}

.register-footer {
  margin-top: 28px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}
</style>
