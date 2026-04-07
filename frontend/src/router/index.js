import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },

  // 登录/注册（无需布局）
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { guest: true },
  },

  // 主布局（需要登录）
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: '工作台' },
      },

      // 个人业务
      { path: 'personal/account', component: () => import('../views/personal/AccountView.vue'), meta: { title: '账户管理' } },
      { path: 'personal/deposit', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '存取款与转账' } },
      { path: 'personal/inquiry', component: () => import('../views/personal/InquiryView.vue'), meta: { title: '账户查询' } },
      { path: 'personal/card', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '银行卡业务' } },
      { path: 'personal/wealth', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '理财与贵金属' } },

      // 对公业务
      { path: 'corporate/account', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '单位账户管理' } },
      { path: 'corporate/settlement', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '对公结算' } },
      { path: 'corporate/batch', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '代发代扣' } },
      { path: 'corporate/deposit', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '单位存款' } },

      // 贷款与授信
      { path: 'loan/personal', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '个人贷款' } },
      { path: 'loan/corporate', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '对公贷款' } },
      { path: 'loan/collateral', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '抵质押物管理' } },

      // 支付结算
      { path: 'payment/cnaps', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '大小额支付' } },
      { path: 'payment/check', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '票据交换' } },
      { path: 'payment/instrument', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '票据业务' } },

      // 特殊业务
      { path: 'special/aml', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '反洗钱与风控' } },
      { path: 'special/forex', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '外汇业务' } },
      { path: 'special/social', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '社保卡/医保卡' } },
      { path: 'special/custody', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '第三方存管' } },

      // 内控与管理
      { path: 'management/teller', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '柜员管理' } },
      { path: 'management/auth', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '业务授权复核' } },
      { path: 'management/eod', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '日终轧账清算' } },

      // 公共辅助
      { path: 'auxiliary/print', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '凭证打印' } },
      { path: 'auxiliary/error', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '差错处理' } },
      { path: 'auxiliary/params', component: () => import('../views/placeholder/PlaceholderView.vue'), meta: { title: '系统参数维护' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) return next('/login')
  if (to.meta.guest && token) return next('/dashboard')
  next()
})

export default router
