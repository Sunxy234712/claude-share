<template>
  <div class="inquiry-view">
    <!-- 页头 -->
    <div class="page-header">
      <span class="page-title">账户查询</span>
    </div>

    <!-- 查询条件 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline label-width="70px">
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.accountNo"
            placeholder="请输入账号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="卡号">
          <el-input
            v-model="searchForm.cardNo"
            placeholder="请输入卡号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="证件号">
          <el-input
            v-model="searchForm.idNo"
            placeholder="请输入证件号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="accountList"
        v-loading="loading"
        stripe
        border
        highlight-current-row
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 600 }"
        @current-change="handleRowSelect"
      >
        <el-table-column label="客户号" prop="customer.customerNo" width="120" />
        <el-table-column label="客户姓名" prop="customer.name" width="100" />
        <el-table-column label="证件号" prop="customer.idNo" width="185" />
        <el-table-column label="手机号" prop="customer.phone" width="130" />
        <el-table-column label="账号" prop="account.accountNo" width="185" />
        <el-table-column label="卡号" prop="card.cardNo" width="185" />
        <el-table-column label="账户类型" prop="account.accountType" width="100" align="center">
          <template #default="{ row }">{{ acctTypeLabel(row.account.accountType) }}</template>
        </el-table-column>
        <el-table-column label="余额（元）" prop="account.balance" width="130" align="right">
          <template #default="{ row }">
            <span class="balance-text">{{ formatBalance(row.account.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" prop="account.status" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="acctStatusTag(row.account.status)" size="small" disable-transitions>
              {{ acctStatusLabel(row.account.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="卡状态" prop="card.status" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="cardStatusTag(row.card.status)" size="small" disable-transitions>
              {{ cardStatusLabel(row.card.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleRowSelect(row)">查看明细</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">共 {{ accountList.length }} 条记录</div>
    </el-card>

    <!-- 流水明细（选中账户后展示） -->
    <el-card v-if="selectedAccount" class="txn-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="txn-header-info">
            <span class="card-title">交易明细</span>
            <span class="account-tag">
              {{ selectedAccount.customer.name }} &nbsp;|&nbsp; {{ selectedAccount.account.accountNo }}
              &nbsp;|&nbsp; 余额：<b>{{ formatBalance(selectedAccount.account.balance) }}</b> 元
            </span>
          </div>
          <el-button :icon="Printer" @click="handlePrint" class="print-btn">打印流水</el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div class="txn-filter-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="handleDateChange"
        />
        <el-select v-model="txnFilter.transactionType" placeholder="全部类型" clearable style="width: 130px">
          <el-option label="存款"   value="deposit" />
          <el-option label="取款"   value="withdrawal" />
          <el-option label="转入"   value="transfer_in" />
          <el-option label="转出"   value="transfer_out" />
          <el-option label="利息"   value="interest" />
          <el-option label="手续费" value="fee" />
          <el-option label="其他"   value="other" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleTxnSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleTxnReset">重置</el-button>
      </div>

      <!-- 流水表格 -->
      <el-table
        :data="txnList"
        v-loading="txnLoading"
        stripe
        border
        style="width: 100%; margin-top: 12px"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 600 }"
      >
        <el-table-column label="交易日期" prop="transactionDate" width="170">
          <template #default="{ row }">{{ formatDateTime(row.transactionDate) }}</template>
        </el-table-column>
        <el-table-column label="交易类型" prop="transactionType" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="txnTypeTag(row.transactionType)" size="small" disable-transitions>
              {{ txnTypeLabel(row.transactionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额（元）" prop="amount" width="130" align="right">
          <template #default="{ row }">
            <span :class="amountClass(row)">{{ amountText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="余额（元）" prop="balanceAfter" width="130" align="right">
          <template #default="{ row }">{{ formatBalance(row.balanceAfter) }}</template>
        </el-table-column>
        <el-table-column label="摘要" prop="description" min-width="150" show-overflow-tooltip />
        <el-table-column label="流水号" prop="referenceNo" width="155">
          <template #default="{ row }"><span class="ref-no">{{ row.referenceNo }}</span></template>
        </el-table-column>
        <el-table-column label="渠道" prop="channelType" width="80" align="center">
          <template #default="{ row }">{{ channelLabel(row.channelType) }}</template>
        </el-table-column>
        <el-table-column label="柜员号" prop="tellerNo" width="90" align="center">
          <template #default="{ row }">{{ row.tellerNo || '—' }}</template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-select v-model="txnFilter.pageSize" style="width: 100px" @change="handlePageSizeChange">
          <el-option label="全部"    :value="0" />
          <el-option label="10 条/页" :value="10" />
          <el-option label="20 条/页" :value="20" />
          <el-option label="50 条/页" :value="50" />
        </el-select>
        <el-pagination
          v-if="txnFilter.pageSize !== 0"
          v-model:current-page="txnFilter.page"
          :page-size="txnFilter.pageSize"
          :total="txnTotal"
          layout="total, prev, pager, next, jumper"
          style="margin-left: 12px"
          @current-change="fetchTransactions"
        />
        <span v-else class="total-text">共 {{ txnTotal }} 条</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Printer } from '@element-plus/icons-vue'
import { searchAccount, getTransactions } from '../../api/inquiry'

// ─── 账户列表 ───────────────────────────────────────────
const searchForm = reactive({ accountNo: '', cardNo: '', idNo: '' })
const accountList = ref([])
const loading = ref(false)
const selectedAccount = ref(null)

async function fetchAccounts() {
  loading.value = true
  try {
    const params = {}
    if (searchForm.accountNo.trim()) params.accountNo = searchForm.accountNo.trim()
    if (searchForm.cardNo.trim())    params.cardNo    = searchForm.cardNo.trim()
    if (searchForm.idNo.trim())      params.idNo      = searchForm.idNo.trim()
    const res = await searchAccount(params)
    accountList.value = res.data
    // 若当前选中账户不在新结果中则清除
    if (selectedAccount.value) {
      const still = accountList.value.find(r => r.account.id === selectedAccount.value.account.id)
      if (!still) selectedAccount.value = null
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  selectedAccount.value = null
  fetchAccounts()
}

function handleReset() {
  searchForm.accountNo = ''
  searchForm.cardNo    = ''
  searchForm.idNo      = ''
  selectedAccount.value = null
  fetchAccounts()
}

function handleRowSelect(row) {
  if (!row) return
  selectedAccount.value = row
  resetTxnFilter()
  fetchTransactions()
}

// 页面初始化时加载全部账户
onMounted(fetchAccounts)

// ─── 流水明细 ───────────────────────────────────────────
const dateRange = ref(null)
const txnFilter = reactive({
  startDate: '',
  endDate: '',
  transactionType: '',
  page: 1,
  pageSize: 0,
})
const txnList = ref([])
const txnTotal = ref(0)
const txnLoading = ref(false)

function resetTxnFilter() {
  dateRange.value = null
  txnFilter.startDate = ''
  txnFilter.endDate = ''
  txnFilter.transactionType = ''
  txnFilter.page = 1
  txnFilter.pageSize = 0
  txnList.value = []
  txnTotal.value = 0
}

function handleDateChange(val) {
  txnFilter.startDate = val ? val[0] : ''
  txnFilter.endDate   = val ? val[1] : ''
}

async function fetchTransactions() {
  if (!selectedAccount.value) return
  txnLoading.value = true
  try {
    const params = {
      accountId: selectedAccount.value.account.id,
      page:      txnFilter.page,
      pageSize:  txnFilter.pageSize,
    }
    if (txnFilter.startDate)       params.startDate       = txnFilter.startDate
    if (txnFilter.endDate)         params.endDate         = txnFilter.endDate
    if (txnFilter.transactionType) params.transactionType = txnFilter.transactionType
    const res = await getTransactions(params)
    txnList.value  = res.data.list
    txnTotal.value = res.data.total
  } finally {
    txnLoading.value = false
  }
}

function handleTxnSearch() { txnFilter.page = 1; fetchTransactions() }
function handleTxnReset()  { resetTxnFilter(); fetchTransactions() }
function handlePageSizeChange() { txnFilter.page = 1; fetchTransactions() }
function handlePrint() { window.print() }

// ─── 辅助函数 ───────────────────────────────────────────
const acctTypeLabel   = t => ({ savings: '储蓄账户', current: '活期账户' }[t] || t)
const acctStatusLabel = s => ({ normal: '正常', frozen: '冻结', cancelled: '已销户' }[s] || s)
const acctStatusTag   = s => ({ normal: 'success', frozen: 'warning', cancelled: 'danger' }[s] || '')
const cardStatusLabel = s => ({ normal: '正常', lost: '挂失', frozen: '冻结' }[s] || s)
const cardStatusTag   = s => ({ normal: 'success', lost: 'danger', frozen: 'warning' }[s] || '')

const txnTypeLabel = t => ({
  deposit: '存款', withdrawal: '取款', transfer_in: '转入',
  transfer_out: '转出', interest: '利息', fee: '手续费', other: '其他',
}[t] || t)
const txnTypeTag = t => ({
  deposit: 'success', withdrawal: 'warning', transfer_in: 'primary',
  transfer_out: 'info', interest: 'success', fee: 'danger', other: '',
}[t] || '')
const channelLabel = c => ({ counter: '柜面', atm: 'ATM', online: '网银', batch: '批量' }[c] || c)

const POSITIVE_TYPES = ['deposit', 'transfer_in', 'interest']
const amountClass = row => POSITIVE_TYPES.includes(row.transactionType) ? 'amount-positive' : 'amount-negative'
const amountText  = row => {
  const n = Number(row.amount).toFixed(2)
  return POSITIVE_TYPES.includes(row.transactionType) ? `+${n}` : `-${n}`
}

const formatBalance  = val => Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate     = val => val ? new Date(val).toLocaleDateString('zh-CN') : '—'
const formatDateTime = val => {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN')
}
</script>

<style scoped>
.inquiry-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #0a2463;
}

.search-card :deep(.el-card__body) {
  padding: 16px 20px 4px;
}

.table-footer {
  margin-top: 12px;
  text-align: right;
  font-size: 13px;
  color: #909399;
}

.balance-text {
  font-weight: 600;
  color: #0a2463;
}

/* 流水卡片 */
.txn-card :deep(.el-card__header) {
  padding: 12px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.txn-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.account-tag {
  font-size: 13px;
  color: #606266;
}

.txn-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.amount-positive { color: #67c23a; font-weight: 600; }
.amount-negative { color: #f56c6c; font-weight: 600; }

.ref-no {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 16px;
}

.total-text {
  margin-left: 12px;
  font-size: 13px;
  color: #606266;
}

@media print {
  .search-card,
  .txn-filter-bar,
  .pagination-wrap,
  .page-header,
  .print-btn,
  .table-card {
    display: none !important;
  }
  .txn-card { box-shadow: none !important; border: none !important; }
}
</style>
