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

```
实现 /personal/wealth 理财与贵金属页面，覆盖理财产品、基金、贵金属三大页签。

数据库新增六张表（迁移文件：0004_optimal_moira_mactaggert.sql）：

1. wealth_products（理财产品）
   - product_code(varchar unique)、product_name、product_type(enum: fixed_income/structured/floating_rate)
   - expected_return(numeric5,2, 年化收益率%)、min_amount/max_amount(numeric15,2)
   - term_days(int)、status(enum: on_sale/off_sale/matured)

2. wealth_orders（理财订单）
   - account_id、product_id、order_no(unique, 格式WLT+YYYYMMDDhhmmss+3位随机数)
   - amount、purchase_date、maturity_date、expected_income、actual_income
   - status(enum: active/redeemed/matured)、redemption_date、teller_no

3. funds（基金）
   - fund_code(varchar unique, 如110022)、fund_name、fund_type(enum: equity/bond/mixed/money)
   - nav(numeric10,4)、nav_date、performance_1m/performance_1y(numeric5,2, %)、manager
   - status(enum: on_sale/suspended)

4. fund_holdings（基金持仓）
   - account_id、fund_id、shares(numeric15,4, 持仓份额)、purchase_price(numeric10,4)
   - purchase_date、teller_no
   - currentValue/profitLoss 为接口实时计算，不存库

5. precious_metals（贵金属）
   - metal_type(enum: gold/silver/platinum/copper)、purity(如Au9999)
   - current_price(numeric12,2, 元/克)、price_update_time、daily_change(numeric5,2, %)
   - status(enum: trading/suspension)

6. metal_holdings（贵金属持仓）
   - account_id、metal_id、amount(numeric12,2, 克数)、average_cost(numeric12,2)
   - storage_type(enum: account/pending_delivery)、teller_no

种子数据（db/resetWealth.js，可重复执行，执行前清空旧数据）：
- 理财产品6条：工银稳健增益365天、招银进宝结构性、中银日日鑫浮动等真实命名
- 基金8条：易方达消费行业(110022)、兴全合润(163402)、汇添富价值精选(519005)等，含真实基金经理
- 贵金属4条：黄金Au9999(¥708.50/克)、白银Ag9999(¥8.32/克)、铂金Pt9995、铜Cu9999
- 理财订单3条(accountId=1)、基金持仓3条(accountId=1)、贵金属持仓3条(accountId=1)
- 同步将 accounts.id=1 余额更新为 100,000.00 以便演示购买

后端接口（均需 authMiddleware，路由前缀 /api/wealth）：

【理财产品】
- GET  /products?status&productType&page&pageSize — 分页查询，支持状态/类型过滤
- POST /orders — 购买，入参：{accountId, productId, amount}
  校验余额 >= amount；扣减账户余额；计算预期收益 = amount × expectedReturn/100；
  计算到期日 = 今天 + termDays；返回 orderNo
- GET  /orders?accountId&page&pageSize — 订单列表，关联查询产品名称
- PUT  /orders/:id/redeem — 赎回（仅 active 状态），返还本息，更新 actualIncome

【基金】
- GET  /funds?fundType&keyword&page&pageSize — 仅返回 on_sale 状态
- POST /fund-holdings — 申购，入参：{accountId, fundId, amount}
  最低1000元；份额 = amount/nav；支持累加持仓（同账户同基金合并）
- GET  /fund-holdings?accountId — 持仓列表，实时计算 currentNav/currentValue/profitLoss/profitLossRate
- PUT  /fund-holdings/:id/redeem — 按 shares 赎回，按当前净值计算退款金额

【贵金属】
- GET  /metals — 全部贵金属行情
- GET  /metals/:id/quote — 单品行情详情
- POST /metal-holdings — 积存，入参：{accountId, metalId, amount}（amount为克数）
  totalCost = amount × currentPrice；支持累加持仓（更新 averageCost）
- GET  /metal-holdings?accountId — 持仓列表，实时计算 currentValue/profitLoss
- PUT  /metal-holdings/:id/exchange — 兑换，卖出原金属 → 买入目标金属，支持部分兑换
- PUT  /metal-holdings/:id/delivery — 申请实物提取，更新 storage_type=pending_delivery
  返回 deliveryNo(DEL+时间戳)、预计5天后交付

账户余额接口（在 /api/accounts 路由下）：
- GET  /api/accounts/:accountId — 返回单个账户余额（用于购买弹窗展示）

前端 WealthView.vue（三大页签）：

【理财产品页签】
上区（产品列表）：
  - 产品状态/类型下拉筛选 + 刷新按钮
  - el-table：产品代码/产品名称/产品类型(el-tag)/预期收益/最低起购/期限/状态/购买按钮
  - off_sale/matured 状态的购买按钮禁用
下区（我的订单）：
  - el-table：订单号/产品名称/购买金额/预期收益/购买日期/到期日期/状态/赎回按钮
  - 仅 active 状态可赎回，点击弹出 ElMessageBox 二次确认

购买弹窗：产品名/最低起购/最高上限/账户余额（实时从接口加载）/购买金额输入

【基金页签】
上区（基金列表）：
  - 关键字搜索 + 基金类型筛选
  - el-table：基金代码/名称/类型/净值/1月收益/1年收益(±着色)/基金经理/状态/申购按钮
下区（基金持仓）：
  - 汇总统计卡片：总投入/当前价值/总盈亏
  - el-table：基金名称/持仓份额/持仓均价/当前净值/当前价值/盈亏/盈亏率/赎回按钮

申购弹窗：基金名/当前净值/预计份额（实时计算）/余额/申购金额输入
赎回弹窗：持仓份额/当前净值/赎回份额输入/预计金额实时计算

【贵金属页签】
上区（行情卡片）：
  - 4个金属行情卡片（黄金/白银/铂金/铜），每60秒自动刷新
  - 显示：名称/纯度/当前价/当日涨跌%（正绿负红）/更新时间
下区（贵金属持仓）：
  - card-header：标题"贵金属持仓" + 金属类型下拉筛选（同行展示，el-select固定150px宽）
  - el-table（width:100%，列用min-width自适应）：
    金属类型/纯度/持仓克数/平均成本/当前价值/盈亏
  - 操作列（width:210px）：积存/兑换/提取三个按钮，flex行内不换行

积存弹窗：选择金属/输入克数/显示当前价格和总成本/确认
兑换弹窗：当前金属/选择目标金属/输入兑换克数/确认
实物提取弹窗：输入提取克数/收货地址/确认

通用工程要求：
- axios 响应拦截器（request.js）：非401错误仅将后端 message 写入 error.message，
  不弹 ElMessage，避免与组件 catch 块重复提示
- 所有弹窗确认按钮绑定 :loading="submitting"，取消按钮绑定 :disabled="submitting"
  submitting 在请求前设 true，finally 中设 false
- 操作成功后刷新相关列表，购买/申购/积存后同步刷新账户余额
- 页面 onMounted 并发加载所有数据（Promise.all），列表加载态用 el-skeleton
- 金额显示统一用 toLocaleString('zh-CN', {minimumFractionDigits:2}) 格式化
- 盈亏正数绿色(.is-profit)，负数红色(.is-loss)
- 所有代码和注释使用中文
```

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
