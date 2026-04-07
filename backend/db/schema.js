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

module.exports = {
  tellers, menus, customers, accounts, cards, transactions,
  roleEnum, statusEnum, transactionTypeEnum, channelTypeEnum,
}
