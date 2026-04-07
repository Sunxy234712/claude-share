<template>
  <div class="account-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="page-title">账户管理</span>
      <el-button type="primary" :icon="Plus" @click="openDialog = true">开户</el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form inline :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名 / 证件号 / 账号"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账户列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="customerNo" label="客户号" width="130" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="idNo" label="证件号" width="185" />
        <el-table-column prop="phone" label="手机号" width="125" />
        <el-table-column prop="accountNo" label="账号" width="185" />
        <el-table-column prop="accountType" label="账户类型" width="90">
          <template #default="{ row }">
            {{ row.accountType === 'savings' ? '储蓄' : '活期' }}
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额（元）" width="120" align="right">
          <template #default="{ row }">
            {{ Number(row.balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
          </template>
        </el-table-column>
        <el-table-column label="账户状态" width="95">
          <template #default="{ row }">
            <el-tag :type="accountStatusTag(row.accountStatus)" size="small">
              {{ accountStatusLabel(row.accountStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="卡状态" width="85">
          <template #default="{ row }">
            <el-tag :type="cardStatusTag(row.cardStatus)" size="small">
              {{ cardStatusLabel(row.cardStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="openDate" label="开户日期" width="115">
          <template #default="{ row }">
            {{ row.openDate ? new Date(row.openDate).toLocaleDateString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="290">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button size="small" type="warning"
                :disabled="row.accountStatus !== 'normal'"
                @click="handleCommand('freeze', row)">挂失</el-button>
              <el-button size="small" type="success"
                :disabled="row.accountStatus !== 'frozen'"
                @click="handleCommand('unfreeze', row)">解挂</el-button>
              <el-button size="small" type="danger"
                :disabled="row.accountStatus === 'cancelled'"
                @click="handleCommand('cancel', row)">销户</el-button>
              <el-button size="small"
                @click="openInfoDialog(row)">信息维护</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </el-card>

    <!-- 开户对话框 -->
    <el-dialog v-model="openDialog" title="开户" width="520px" @close="resetOpenForm">
      <el-form ref="openFormRef" :model="openForm" :rules="openRules" label-width="90px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="openForm.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="证件类型" prop="idType">
          <el-select v-model="openForm.idType" style="width: 100%">
            <el-option label="居民身份证" value="id_card" />
            <el-option label="护照" value="passport" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号码" prop="idNo">
          <el-input v-model="openForm.idNo" placeholder="请输入证件号码" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="openForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="openForm.address" placeholder="请输入联系地址" />
        </el-form-item>
        <el-form-item label="账户类型" prop="accountType">
          <el-select v-model="openForm.accountType" style="width: 100%">
            <el-option label="储蓄账户" value="savings" />
            <el-option label="活期账户" value="current" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="openDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleOpen">确认开户</el-button>
      </template>
    </el-dialog>

    <!-- 开户结果对话框 -->
    <el-dialog v-model="resultDialog" title="开户成功" width="420px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="客户号">{{ openResult.customerNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ openResult.name }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ openResult.accountNo }}</el-descriptions-item>
        <el-descriptions-item label="卡号">{{ openResult.cardNo }}</el-descriptions-item>
        <el-descriptions-item label="账户类型">
          {{ openResult.accountType === 'savings' ? '储蓄账户' : '活期账户' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="resultDialog = false">确认</el-button>
      </template>
    </el-dialog>

    <!-- 信息维护对话框 -->
    <el-dialog v-model="infoDialog" title="客户信息维护" width="420px">
      <el-form ref="infoFormRef" :model="infoForm" label-width="80px">
        <el-form-item label="手机号">
          <el-input v-model="infoForm.phone" placeholder="请输入新手机号" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="infoForm.address" placeholder="请输入新地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="infoDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdateInfo">确认更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import {
  getAccounts,
  openAccount,
  cancelAccount,
  freezeAccount,
  unfreezeAccount,
  updateCustomerInfo,
} from '../../api/account'

// 列表数据
const tableData = ref([])
const loading = ref(false)
const submitting = ref(false)

// 搜索
const searchForm = reactive({ keyword: '' })

// 分页
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// 对话框
const openDialog = ref(false)
const resultDialog = ref(false)
const infoDialog = ref(false)

// 开户表单
const openFormRef = ref(null)
const openForm = reactive({ name: '', idType: 'id_card', idNo: '', phone: '', address: '', accountType: 'savings' })
const openRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  idType: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
  idNo: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
  accountType: [{ required: true, message: '请选择账户类型', trigger: 'change' }],
}

// 开户结果
const openResult = reactive({ customerNo: '', name: '', accountNo: '', cardNo: '', accountType: '' })

// 信息维护表单
const infoFormRef = ref(null)
const infoForm = reactive({ phone: '', address: '' })
const currentCustomerId = ref(null)

// 状态标签
const accountStatusLabel = (s) => ({ normal: '正常', frozen: '冻结', cancelled: '已销户' }[s] || s)
const accountStatusTag = (s) => ({ normal: 'success', frozen: 'warning', cancelled: 'danger' }[s] || '')
const cardStatusLabel = (s) => ({ normal: '正常', lost: '挂失', frozen: '冻结' }[s] || s)
const cardStatusTag = (s) => ({ normal: 'success', lost: 'danger', frozen: 'warning' }[s] || '')

// 加载数据
async function fetchData() {
  loading.value = true
  try {
    const res = await getAccounts({ keyword: searchForm.keyword, page: pagination.page, pageSize: pagination.pageSize })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  searchForm.keyword = ''
  pagination.page = 1
  fetchData()
}

// 开户
function resetOpenForm() {
  openForm.name = ''
  openForm.idType = 'id_card'
  openForm.idNo = ''
  openForm.phone = ''
  openForm.address = ''
  openForm.accountType = 'savings'
  openFormRef.value?.resetFields()
}

async function handleOpen() {
  await openFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const res = await openAccount({ ...openForm })
      openDialog.value = false
      openResult.customerNo = res.data.customer.customerNo
      openResult.name = res.data.customer.name
      openResult.accountNo = res.data.account.accountNo
      openResult.cardNo = res.data.card.cardNo
      openResult.accountType = res.data.account.accountType
      resultDialog.value = true
      fetchData()
    } finally {
      submitting.value = false
    }
  })
}

// 更多操作统一入口
async function handleCommand(cmd, row) {
  const configs = {
    freeze:   { msg: '确认对该账户进行挂失操作？', fn: () => freezeAccount(row.accountId),   success: '挂失成功' },
    unfreeze: { msg: '确认对该账户进行解挂操作？', fn: () => unfreezeAccount(row.accountId), success: '解挂成功' },
    cancel:   { msg: '销户后不可恢复，确认操作？', fn: () => cancelAccount(row.accountId),   success: '销户成功' },
  }
  const { msg, fn, success } = configs[cmd]
  await ElMessageBox.confirm(msg, '操作确认', { type: 'warning' })
  await fn()
  ElMessage.success(success)
  fetchData()
}

// 信息维护
function openInfoDialog(row) {
  currentCustomerId.value = row.customerId
  infoForm.phone = row.phone || ''
  infoForm.address = row.address || ''
  infoDialog.value = true
}

async function handleUpdateInfo() {
  submitting.value = true
  try {
    await updateCustomerInfo(currentCustomerId.value, { phone: infoForm.phone, address: infoForm.address })
    ElMessage.success('信息更新成功')
    infoDialog.value = false
    fetchData()
  } finally {
    submitting.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.account-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #0a2463;
}

.search-card :deep(.el-card__body) {
  padding: 16px 20px 0;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-card :deep(.el-table) {
  border-radius: 0;
}

.action-btns {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
}
</style>
