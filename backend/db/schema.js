const { pgTable, serial, varchar, timestamp, integer, boolean, numeric, pgEnum } = require('drizzle-orm/pg-core')

// 角色枚举：柜员 / 主管
const roleEnum = pgEnum('role', ['teller', 'supervisor'])

// 账号状态枚举：启用 / 禁用
const statusEnum = pgEnum('status', ['active', 'inactive'])

// 柜员表
const tellers = pgTable('tellers', {
  id: serial('id').primaryKey(),
  tellerNo: varchar('teller_no', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('teller'),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 菜单表
const menus = pgTable('menus', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id'),
  title: varchar('title', { length: 50 }).notNull(),
  path: varchar('path', { length: 100 }),
  icon: varchar('icon', { length: 50 }),
  sort: integer('sort').notNull().default(0),
  roles: varchar('roles', { length: 100 }).notNull().default('teller,supervisor'),
  isVisible: boolean('is_visible').notNull().default(true),
})

// 客户表
const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  customerNo: varchar('customer_no', { length: 20 }).notNull().unique(), // 客户号，C+8位数字
  name: varchar('name', { length: 50 }).notNull(),                       // 姓名
  idType: varchar('id_type', { length: 20 }).notNull().default('id_card'), // 证件类型
  idNo: varchar('id_no', { length: 30 }).notNull().unique(),             // 证件号
  phone: varchar('phone', { length: 20 }),                               // 手机号
  address: varchar('address', { length: 200 }),                          // 地址
  createdAt: timestamp('created_at').defaultNow(),
})

// 账户表
const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  accountNo: varchar('account_no', { length: 25 }).notNull().unique(),   // 账号，62+14位
  customerId: integer('customer_id').notNull(),                           // 关联客户
  accountType: varchar('account_type', { length: 20 }).notNull().default('savings'), // savings/current
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  currency: varchar('currency', { length: 10 }).notNull().default('CNY'),
  status: varchar('status', { length: 20 }).notNull().default('normal'), // normal/frozen/cancelled
  openDate: timestamp('open_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
})

// 银行卡表
const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  cardNo: varchar('card_no', { length: 25 }).notNull().unique(),         // 卡号，6228+12位
  accountId: integer('account_id').notNull(),                            // 关联账户
  status: varchar('status', { length: 20 }).notNull().default('normal'), // normal/lost/frozen
  issuedAt: timestamp('issued_at').defaultNow(),
})

// 交易类型枚举
const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',      // 存款
  'withdrawal',   // 取款
  'transfer_in',  // 转入
  'transfer_out', // 转出
  'interest',     // 利息
  'fee',          // 手续费
  'other',        // 其他
])

// 交易渠道枚举
const channelTypeEnum = pgEnum('channel_type', [
  'counter', // 柜面
  'atm',     // ATM
  'online',  // 网银/手机银行
  'batch',   // 批量
])

// 交易流水表
const transactions = pgTable('transactions', {
  id:               serial('id').primaryKey(),
  accountId:        integer('account_id').notNull(),
  transactionType:  transactionTypeEnum('transaction_type').notNull(),
  amount:           numeric('amount', { precision: 15, scale: 2 }).notNull(),
  balanceAfter:     numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  currency:         varchar('currency', { length: 10 }).notNull().default('CNY'),
  description:      varchar('description', { length: 200 }),
  channelType:      channelTypeEnum('channel_type').notNull().default('counter'),
  relatedAccountNo: varchar('related_account_no', { length: 25 }),
  tellerNo:         varchar('teller_no', { length: 20 }),
  referenceNo:      varchar('reference_no', { length: 32 }).notNull().unique(),
  transactionDate:  timestamp('transaction_date').notNull().defaultNow(),
  createdAt:        timestamp('created_at').defaultNow(),
})

// 理财产品类型枚举
const wealthProductTypeEnum = pgEnum('wealth_product_type', ['fixed_income', 'structured', 'floating_rate'])

// 理财产品状态枚举
const wealthStatusEnum = pgEnum('wealth_status', ['on_sale', 'off_sale', 'matured'])

// 理财产品表
const wealthProducts = pgTable('wealth_products', {
  id: serial('id').primaryKey(),
  productCode: varchar('product_code', { length: 20 }).notNull().unique(),
  productName: varchar('product_name', { length: 100 }).notNull(),
  productType: wealthProductTypeEnum('product_type').notNull().default('fixed_income'),
  expectedReturn: numeric('expected_return', { precision: 5, scale: 2 }).notNull(), // 年化收益率%
  minAmount: numeric('min_amount', { precision: 15, scale: 2 }).notNull(),
  maxAmount: numeric('max_amount', { precision: 15, scale: 2 }).notNull(),
  termDays: integer('term_days').notNull(),
  status: wealthStatusEnum('status').notNull().default('on_sale'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 理财订单状态枚举
const wealthOrderStatusEnum = pgEnum('wealth_order_status', ['active', 'redeemed', 'matured'])

// 理财订单表
const wealthOrders = pgTable('wealth_orders', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  productId: integer('product_id').notNull(),
  orderNo: varchar('order_no', { length: 30 }).notNull().unique(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  purchaseDate: timestamp('purchase_date').notNull().defaultNow(),
  maturityDate: timestamp('maturity_date').notNull(),
  expectedIncome: numeric('expected_income', { precision: 15, scale: 2 }).notNull(),
  actualIncome: numeric('actual_income', { precision: 15, scale: 2 }).default('0'),
  status: wealthOrderStatusEnum('status').notNull().default('active'),
  redemptionDate: timestamp('redemption_date'),
  tellerNo: varchar('teller_no', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
})

// 基金类型枚举
const fundTypeEnum = pgEnum('fund_type', ['equity', 'bond', 'mixed', 'money'])

// 基金状态枚举
const fundStatusEnum = pgEnum('fund_status', ['on_sale', 'suspended'])

// 基金表
const funds = pgTable('funds', {
  id: serial('id').primaryKey(),
  fundCode: varchar('fund_code', { length: 10 }).notNull().unique(),
  fundName: varchar('fund_name', { length: 100 }).notNull(),
  fundType: fundTypeEnum('fund_type').notNull().default('equity'),
  nav: numeric('nav', { precision: 10, scale: 4 }).notNull(), // 净值
  navDate: timestamp('nav_date').notNull().defaultNow(),
  performance1m: numeric('performance_1m', { precision: 5, scale: 2 }).default('0'), // 1月收益率%
  performance1y: numeric('performance_1y', { precision: 5, scale: 2 }).default('0'), // 1年收益率%
  manager: varchar('manager', { length: 50 }),
  status: fundStatusEnum('status').notNull().default('on_sale'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 基金持仓表
const fundHoldings = pgTable('fund_holdings', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  fundId: integer('fund_id').notNull(),
  shares: numeric('shares', { precision: 15, scale: 4 }).notNull(), // 持仓份额
  purchasePrice: numeric('purchase_price', { precision: 10, scale: 4 }).notNull(),
  purchaseDate: timestamp('purchase_date').notNull().defaultNow(),
  tellerNo: varchar('teller_no', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
})

// 贵金属类型枚举
const metalTypeEnum = pgEnum('metal_type', ['gold', 'silver', 'platinum', 'copper'])

// 贵金属交易状态枚举
const metalStatusEnum = pgEnum('metal_status', ['trading', 'suspension'])

// 贵金属表
const preciousMetals = pgTable('precious_metals', {
  id: serial('id').primaryKey(),
  metalType: metalTypeEnum('metal_type').notNull(),
  purity: varchar('purity', { length: 20 }).notNull(), // 如 Au9999
  currentPrice: numeric('current_price', { precision: 12, scale: 2 }).notNull(), // 克/元
  priceUpdateTime: timestamp('price_update_time').notNull().defaultNow(),
  dailyChange: numeric('daily_change', { precision: 5, scale: 2 }).default('0'), // 当日涨跌%
  status: metalStatusEnum('status').notNull().default('trading'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 贵金属存储方式枚举
const metalStorageTypeEnum = pgEnum('metal_storage_type', ['account', 'pending_delivery'])

// 贵金属持仓表
const metalHoldings = pgTable('metal_holdings', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  metalId: integer('metal_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // 克数
  averageCost: numeric('average_cost', { precision: 12, scale: 2 }).notNull(),
  storageType: metalStorageTypeEnum('storage_type').notNull().default('account'),
  tellerNo: varchar('teller_no', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
})

module.exports = {
  tellers, menus, customers, accounts, cards, transactions,
  wealthProducts, wealthOrders, funds, fundHoldings, preciousMetals, metalHoldings,
  roleEnum, statusEnum, transactionTypeEnum, channelTypeEnum,
  wealthProductTypeEnum, wealthStatusEnum, wealthOrderStatusEnum,
  fundTypeEnum, fundStatusEnum,
  metalTypeEnum, metalStatusEnum, metalStorageTypeEnum,
}
