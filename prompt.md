# 银行柜面系统 — 功能开发提示词记录

每个功能模块对应一个提示词，按开发顺序排列。

---

## 00. 登录与注册

```
请基于以下技术栈，为银行柜面系统完整实现登录与注册功能：

技术栈：
- 前端：Vue 3 + Element Plus + Vue Router + Pinia + Axios（Vite 构建）
- 后端：Node.js + Express
- 数据库：Neon（Serverless PostgreSQL），使用 Drizzle ORM
- 认证：JWT（access token + refresh token）

项目结构：
/
├── frontend/
│   ├── src/
│   │   ├── views/auth/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── api/auth.js
│   │   ├── store/user.js（Pinia）
│   │   └── router/index.js
├── backend/
│   ├── db/
│   │   ├── index.js（Neon 连接）
│   │   └── schema.js（Drizzle schema）
│   ├── routes/auth.js
│   ├── controllers/authController.js
│   ├── middleware/auth.js（JWT 验证中间件）
│   └── index.js（Express 入口）
└── .env

功能要求：

登录页（LoginView.vue）
- 字段：工号（柜员号）、密码
- Element Plus 表单验证（非空、长度校验）
- 登录成功后 JWT 存入 localStorage，跳转至 /dashboard
- 失败显示错误提示（账号不存在 / 密码错误）
- 页面风格：银行系风格，深蓝色主色调，居中卡片布局

注册页（RegisterView.vue）
- 字段：姓名、工号、密码、确认密码、角色（柜员/主管，下拉选择）
- 表单验证：工号唯一性校验（实时接口验证）、两次密码一致性校验
- 注册成功后跳转登录页并提示

后端 API：
POST /api/auth/register
- 入参：name, tellerNo, password, role
- 工号唯一性校验，密码用 bcrypt 加密存储
- 返回：{ success, message }

POST /api/auth/login
- 入参：tellerNo, password
- 验证密码，签发 JWT（payload 包含 id, tellerNo, name, role）
- 返回：{ token, user: { id, tellerNo, name, role } }

GET /api/auth/check-teller-no/:tellerNo
- 返回：{ exists: true/false }

数据库（Drizzle Schema）tellers 表：
- id（serial primary key）
- teller_no（varchar, unique）— 柜员工号
- name（varchar）— 姓名
- password_hash（varchar）— bcrypt 加密密码
- role（enum: 'teller' | 'supervisor'）— 角色
- status（enum: 'active' | 'inactive'）— 账号状态
- created_at（timestamp）

其他要求：
- 后端统一错误处理，返回格式：{ success: false, message: '...' }
- 前端 axios 拦截器自动带 token，401 时跳转登录
- Vue Router 路由守卫：未登录访问 /dashboard 重定向到 /login
- 提供 .env.example
- 所有代码和注释使用中文
```

---

## 01. 主框架与导航布局

```
基于已有的 Vue3 + Element Plus 项目，实现银行柜面系统主框架与导航布局：

文件结构：
- frontend/src/layouts/MainLayout.vue  — 主布局（侧边栏 + 顶栏 + 内容区）
- frontend/src/views/DashboardView.vue — 工作台首页
- frontend/src/views/placeholder/PlaceholderView.vue — 未开发模块占位页
- frontend/src/router/index.js — 更新路由，业务页嵌套在 MainLayout 下

MainLayout 功能：
- 左侧深蓝色侧边栏（#0a2463），支持折叠，包含7大业务模块菜单（el-menu + el-sub-menu）
- 顶栏：折叠按钮、面包屑、签到状态标签、系统时间（实时）、用户头像下拉菜单
- 下拉菜单：显示工号/角色、签到/签退、退出登录
- 多标签页（el-tabs type="card"），点击菜单自动追加标签，可关闭
- 内容区使用 router-view + keep-alive

DashboardView 功能：
- 渐变欢迎卡片（含用户名、工号、角色、日期问候语）
- 快捷入口卡片（6个常用功能）
- 今日业务概览统计（4项，数据占位）
- 系统公告区域

路由结构：登录/注册为独立页，其余所有业务路由嵌套在 MainLayout 下，路由守卫保护
```

---

## 01-B. 动态菜单接口

```
将侧边栏硬编码菜单改造为后端接口动态控制：

后端新增：
- db/schema.js 追加 menus 表（id, parent_id, title, path, icon, sort, roles, is_visible）
- db/seed.js：初始化33条菜单数据，npm run db:seed 执行
- controllers/menuController.js：GET /api/menus，按 JWT 中 role 过滤，返回树形结构
- routes/menus.js：挂载路由，需要 authMiddleware

前端新增：
- api/menu.js：getMenus()
- store/menu.js（Pinia）：menuList, loading, fetchMenus(), clearMenus()
- store/user.js：setLogin 后调用 fetchMenus()，logout 后调用 clearMenus()
- layouts/MainLayout.vue：动态渲染菜单，用 component :is 加载图标，加载中显示骨架屏
  面包屑和标签页标题从 menuStore.menuList 动态生成，页面刷新时自动重新拉取菜单
```

## 02. 个人业务 — 账户管理

```
实现 /personal/account 账户管理页面：

数据库新增三张表（迁移）：
- customers（客户号C+8位、姓名、证件类型、证件号unique、手机号、地址）
- accounts（账号62+14位、customer_id、账户类型savings/current、余额numeric15,2、币种、状态normal/frozen/cancelled、开户日期）
- cards（卡号6228+12位、account_id、状态normal/lost/frozen）

后端接口（均需 authMiddleware）：
- GET /api/accounts?keyword&page&pageSize — 联表查询，关键字模糊匹配姓名/证件号/账号，返回分页列表
- POST /api/accounts/open — 开户，复用已有客户（idNo匹配），自动生成客户号/账号/卡号
- PUT /api/accounts/:id/cancel — 销户（余额必须为0）
- PUT /api/accounts/:id/freeze — 挂失
- PUT /api/accounts/:id/unfreeze — 解挂
- PUT /api/accounts/customers/:id/info — 更新手机号/地址

前端 AccountView.vue：
- 搜索栏（关键字查询）+ 右上角开户按钮
- el-table 展示客户号/姓名/证件号/手机/账号/类型/余额/账户状态/卡状态/开户日期/操作
- 操作列：挂失/解挂/销户（el-popconfirm二次确认）/维护，按状态控制禁用
- 开户 el-dialog（6个字段）+ 开户成功结果展示弹窗
- 信息维护 el-dialog（手机号+地址）
- el-tag 区分状态颜色，el-pagination 分页
```

---

## 03. 个人业务 — 存取款与转账

> 待补充

---

## 04. 个人业务 — 账户查询

```
实现 /personal/inquiry 账户查询页面，覆盖余额查询、明细查询、交易流水打印三项功能：

数据库新增一张表（迁移）：
- transactions（交易流水）：account_id(FK)、transaction_type(enum: deposit/withdrawal/
  transfer_in/transfer_out/interest/fee/other)、amount(numeric15,2)、balance_after(numeric15,2)、
  currency、description、channel_type(enum: counter/atm/online/batch)、related_account_no、
  teller_no（冗余存储，非FK）、reference_no(unique 流水号)、transaction_date、created_at
- 同步新增测试流水数据：node db/seedTransactions.js（18条，跨4个账户，覆盖全部交易类型）

后端接口（均需 authMiddleware）：
- GET /api/inquiry/account?accountNo&cardNo&idNo
  三个条件均可选，全为空时返回全部账户；
  联表查询 accounts + customers + cards，返回账户数组
- GET /api/inquiry/transactions?accountId&startDate&endDate&transactionType&page&pageSize
  accountId 必填；startDate/endDate/transactionType 可选；
  pageSize=0 表示不分页返回全部；
  按 transaction_date DESC 排序；返回 { list, total }

前端 InquiryView.vue（两段式布局）：

第一段——账户列表：
- 查询条件：账号、卡号、证件号三个独立输入框，均可为空，全为空时查询所有账户
- 页面加载时自动执行一次全量查询
- el-table 展示：客户号/姓名/证件号/手机/账号/卡号/账户类型/余额/账户状态/卡状态/操作列
- 操作列"查看明细"按钮，点击后在第二段展示该账户流水

第二段——交易明细（选中账户后展示）：
- 标题栏显示：客户姓名 | 账号 | 当前余额
- 筛选栏：日期范围（el-date-picker daterange）、交易类型下拉（可选全部）、查询/重置按钮
- el-table 展示：交易日期/交易类型(el-tag着色)/金额(±着色)/交易后余额/摘要/流水号/渠道/柜员号
- 分页控件：左侧下拉可选"全部/10条/20条/50条"，默认"全部"（pageSize=0）
- 打印按钮：window.print()，@media print 隐藏搜索栏/筛选栏/分页/账户列表，仅保留流水表

注意事项：
- axios 响应拦截器已返回 response.data，调用方直接取 res.data（不是 res.data.data）
- 金额着色：deposit/transfer_in/interest 为绿色正值，其余为红色负值
- endDate 过滤时后端补 T23:59:59，保证当天数据包含在内
```

---

## 05. 个人业务 — 银行卡业务

> 待补充

---

## 06. 个人业务 — 理财与贵金属

> 待补充

---

## 07. 对公业务 — 单位账户管理

> 待补充

---

## 08. 对公业务 — 对公结算

> 待补充

---

## 09. 对公业务 — 代发代扣

> 待补充

---

## 10. 对公业务 — 单位存款

> 待补充

---

## 11. 贷款与授信

> 待补充

---

## 12. 支付结算与票据

> 待补充

---

## 13. 特殊业务 — 反洗钱与风控

> 待补充

---

## 14. 特殊业务 — 外汇业务

> 待补充

---

## 15. 特殊业务 — 社保卡/医保卡

> 待补充

---

## 16. 特殊业务 — 第三方存管

> 待补充

---

## 17. 内控与管理 — 柜员管理

> 待补充

---

## 18. 内控与管理 — 业务授权复核

> 待补充

---

## 19. 内控与管理 — 日终轧账与清算

> 待补充

---

## 20. 公共辅助 — 凭证打印与回单

> 待补充

---

## 21. 公共辅助 — 差错处理与冲正

> 待补充

---

## 22. 公共辅助 — 系统参数维护

> 待补充
