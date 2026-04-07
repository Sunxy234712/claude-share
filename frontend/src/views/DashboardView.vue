<template>
  <div class="dashboard">
    <!-- 欢迎语 -->
    <div class="welcome-card">
      <div class="welcome-left">
        <el-avatar :size="56" class="welcome-avatar">
          {{ userStore.user?.name?.charAt(0) }}
        </el-avatar>
        <div>
          <div class="welcome-title">
            {{ greeting }}，{{ userStore.user?.name }}
            <el-tag size="small" type="warning" style="margin-left:8px">
              {{ userStore.user?.role === 'supervisor' ? '主管' : '柜员' }}
            </el-tag>
          </div>
          <div class="welcome-sub">工号：{{ userStore.user?.tellerNo }} · {{ today }}</div>
        </div>
      </div>
      <div class="welcome-right">
        <el-statistic title="今日日期" :value="today" />
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section-title">快捷入口</div>
    <el-row :gutter="16" class="shortcut-row">
      <el-col :xs="12" :sm="8" :md="4" v-for="item in shortcuts" :key="item.path">
        <div class="shortcut-card" @click="$router.push(item.path)">
          <el-icon :size="28" :color="item.color"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 业务统计 -->
    <div class="section-title">今日业务概览</div>
    <el-row :gutter="16">
      <el-col :xs="12" :sm="12" :md="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统公告 -->
    <div class="section-title">系统公告</div>
    <el-card shadow="never" class="notice-card">
      <el-empty description="暂无公告" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/user'

const userStore = useUserStore()

const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const shortcuts = [
  { label: '账户管理', path: '/personal/account', icon: 'User', color: '#409eff' },
  { label: '存取款', path: '/personal/deposit', icon: 'Wallet', color: '#67c23a' },
  { label: '账户查询', path: '/personal/inquiry', icon: 'Search', color: '#e6a23c' },
  { label: '对公结算', path: '/corporate/settlement', icon: 'OfficeBuilding', color: '#9b59b6' },
  { label: '贷款业务', path: '/loan/personal', icon: 'Money', color: '#f56c6c' },
  { label: '柜员管理', path: '/management/teller', icon: 'Setting', color: '#00bcd4' },
]

const stats = [
  { label: '今日交易笔数', value: '—', color: '#409eff' },
  { label: '现金存款（元）', value: '—', color: '#67c23a' },
  { label: '现金取款（元）', value: '—', color: '#e6a23c' },
  { label: '转账汇款（元）', value: '—', color: '#f56c6c' },
]
</script>

<style scoped>
.dashboard {
  width: 100%;
  box-sizing: border-box;
}

.welcome-card {
  background: linear-gradient(135deg, #0a2463, #2d6fbd);
  border-radius: 12px;
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  color: #fff;
}

.welcome-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-avatar {
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.welcome-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.welcome-sub {
  font-size: 13px;
  opacity: 0.8;
}

:deep(.welcome-right .el-statistic__head),
:deep(.welcome-right .el-statistic__content) {
  color: rgba(255,255,255,0.85);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  padding-left: 8px;
  border-left: 3px solid #0a2463;
}

.shortcut-row {
  margin-bottom: 24px;
}

.shortcut-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.shortcut-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  color: #0a2463;
}

.stat-card {
  border-radius: 10px;
  text-align: center;
  padding: 8px 0;
  margin-bottom: 24px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.notice-card {
  border-radius: 10px;
}
</style>
