<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <!-- Logo 区域 -->
      <div class="sidebar-logo">
        <span v-if="!isCollapsed" class="logo-text">柜面业务系统</span>
        <span v-else class="logo-icon">柜</span>
      </div>

      <!-- 导航菜单 -->
      <el-scrollbar class="sidebar-scroll">
        <!-- 加载骨架屏 -->
        <div v-if="menuStore.loading" class="menu-skeleton">
          <el-skeleton :rows="8" animated />
        </div>

        <!-- 动态菜单 -->
        <el-menu
          v-else
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          background-color="#0a2463"
          text-color="rgba(255,255,255,0.75)"
          active-text-color="#ffffff"
          router
        >
          <template v-for="menu in menuStore.menuList" :key="menu.id">
            <!-- 有子菜单：渲染 el-sub-menu -->
            <el-sub-menu v-if="menu.children?.length" :index="String(menu.id)">
              <template #title>
                <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
                <span>{{ menu.title }}</span>
              </template>
              <el-menu-item
                v-for="child in menu.children"
                :key="child.id"
                :index="child.path"
              >
                {{ child.title }}
              </el-menu-item>
            </el-sub-menu>

            <!-- 无子菜单：渲染 el-menu-item -->
            <el-menu-item v-else :index="menu.path">
              <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
              <template #title>{{ menu.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <!-- 折叠按钮 -->
        <el-icon class="collapse-btn" @click="isCollapsed = !isCollapsed">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>

        <!-- 面包屑 -->
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">工作台</el-breadcrumb-item>
          <el-breadcrumb-item v-if="currentBreadcrumb">{{ currentBreadcrumb }}</el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 右侧用户信息 -->
        <div class="header-right">
          <el-tag :type="isSignedIn ? 'success' : 'danger'" size="small" class="sign-tag">
            {{ isSignedIn ? '已签到' : '未签到' }}
          </el-tag>
          <span class="system-time">{{ currentTime }}</span>

          <el-dropdown @command="handleCommand">
            <div class="user-avatar-wrap">
              <el-avatar :size="32" class="user-avatar">
                {{ userStore.user?.name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>工号：{{ userStore.user?.tellerNo }}</el-dropdown-item>
                <el-dropdown-item disabled>角色：{{ userStore.user?.role === 'supervisor' ? '主管' : '柜员' }}</el-dropdown-item>
                <el-dropdown-item divided command="signIn" v-if="!isSignedIn">
                  <el-icon><Check /></el-icon> 签到
                </el-dropdown-item>
                <el-dropdown-item command="signOut" v-if="isSignedIn">
                  <el-icon><SwitchButton /></el-icon> 签退
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><CircleClose /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 标签页导航 -->
      <div class="tab-bar" v-if="openedTabs.length">
        <el-tabs
          v-model="activeTab"
          type="card"
          closable
          @tab-click="handleTabClick"
          @tab-remove="handleTabRemove"
        >
          <el-tab-pane
            v-for="tab in openedTabs"
            :key="tab.path"
            :label="tab.title"
            :name="tab.path"
          />
        </el-tabs>
      </div>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import { useMenuStore } from '../store/menu'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()

// 页面挂载时，如果菜单为空（刷新页面场景）则重新拉取
onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  isSignedIn.value = sessionStorage.getItem('signedIn') === 'true'
  if (!menuStore.menuList.length) {
    await menuStore.fetchMenus()
  }
})

// 侧边栏折叠
const isCollapsed = ref(false)

// 签到状态
const isSignedIn = ref(false)

// 系统时间
const currentTime = ref('')
let timer = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', { hour12: false })
}

onUnmounted(() => clearInterval(timer))

// 当前激活菜单
const activeMenu = computed(() => route.path)

// 面包屑：从菜单数据动态生成
const breadcrumbMap = computed(() => {
  const map = {}
  function flatten(list) {
    list.forEach((item) => {
      if (item.path) map[item.path] = item.title
      if (item.children) flatten(item.children)
    })
  }
  flatten(menuStore.menuList)
  return map
})
const currentBreadcrumb = computed(() => breadcrumbMap.value[route.path] || '')

// 标签页
const openedTabs = ref([{ path: '/dashboard', title: '工作台' }])
const activeTab = ref('/dashboard')

watch(
  () => route.path,
  (path) => {
    activeTab.value = path
    if (path === '/dashboard') return
    const title = breadcrumbMap.value[path]
    if (title && !openedTabs.value.find((t) => t.path === path)) {
      openedTabs.value.push({ path, title })
    }
  }
)

function handleTabClick(tab) {
  router.push(tab.props.name)
}

function handleTabRemove(path) {
  const idx = openedTabs.value.findIndex((t) => t.path === path)
  openedTabs.value.splice(idx, 1)
  if (activeTab.value === path) {
    const next = openedTabs.value[idx] || openedTabs.value[idx - 1]
    if (next) router.push(next.path)
  }
}

// 用户操作
async function handleCommand(cmd) {
  if (cmd === 'signIn') {
    isSignedIn.value = true
    sessionStorage.setItem('signedIn', 'true')
    ElMessage.success('签到成功')
  } else if (cmd === 'signOut') {
    await ElMessageBox.confirm('确认签退？请确保尾箱已轧平。', '签退确认', { type: 'warning' })
    isSignedIn.value = false
    sessionStorage.removeItem('signedIn')
    ElMessage.success('签退成功')
  } else if (cmd === 'logout') {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #0a2463;
  transition: width 0.25s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #061747;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.sidebar-scroll {
  flex: 1;
}

.menu-skeleton {
  padding: 16px;
}

:deep(.menu-skeleton .el-skeleton__item) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title:hover),
:deep(.el-menu-item:hover) {
  background-color: #1e4d8c !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #2d6fbd !important;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  height: 56px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: #0a2463;
}

.breadcrumb {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.sign-tag {
  cursor: default;
}

.system-time {
  font-size: 13px;
  color: #606266;
  font-family: monospace;
}

.user-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #303133;
  font-size: 14px;
}

.user-avatar {
  background: #0a2463;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.tab-bar {
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  padding: 0 12px;
  flex-shrink: 0;
}

:deep(.tab-bar .el-tabs__header) {
  margin: 0;
}

:deep(.tab-bar .el-tabs__nav-wrap::after) {
  display: none;
}

.main-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  background: #f5f7fa;
  overflow-y: auto;
  padding: 20px;
}
</style>
