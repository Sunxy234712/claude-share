require('dotenv').config()
const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const { eq } = require('drizzle-orm')
const { accounts, transactions } = require('./schema')

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

// 18 条测试流水，分布在 4 个账户（张三/李四/孙七/冯十一），近 90 天
// transactionDate 用绝对日期，便于演示日期范围筛选
const txnData = [
  // 张三 62000000000000001 — 5 条
  { accountNo: '62000000000000001', transactionType: 'deposit',      amount: '5000.00',  balanceAfter: '5000.00',  description: '现金存款',       channelType: 'counter', tellerNo: 'T001', referenceNo: 'TXN20260108001', transactionDate: new Date('2026-01-08T09:15:00') },
  { accountNo: '62000000000000001', transactionType: 'withdrawal',   amount: '1000.00',  balanceAfter: '4000.00',  description: '现金取款',       channelType: 'counter', tellerNo: 'T001', referenceNo: 'TXN20260120001', transactionDate: new Date('2026-01-20T14:30:00') },
  { accountNo: '62000000000000001', transactionType: 'transfer_in',  amount: '2000.00',  balanceAfter: '6000.00',  description: '李四转入',       channelType: 'online',  tellerNo: null,   referenceNo: 'TXN20260205001', transactionDate: new Date('2026-02-05T10:00:00'), relatedAccountNo: '62000000000000002' },
  { accountNo: '62000000000000001', transactionType: 'withdrawal',   amount: '1000.00',  balanceAfter: '5000.00',  description: '现金取款',       channelType: 'atm',     tellerNo: null,   referenceNo: 'TXN20260310001', transactionDate: new Date('2026-03-10T16:45:00') },
  { accountNo: '62000000000000001', transactionType: 'interest',     amount: '12.50',    balanceAfter: '5012.50',  description: '活期利息结算',   channelType: 'batch',   tellerNo: null,   referenceNo: 'TXN20260401001', transactionDate: new Date('2026-04-01T00:05:00') },

  // 李四 62000000000000002 — 3 条
  { accountNo: '62000000000000002', transactionType: 'deposit',      amount: '10000.00', balanceAfter: '10000.00', description: '工资存入',       channelType: 'counter', tellerNo: 'T002', referenceNo: 'TXN20260115002', transactionDate: new Date('2026-01-15T09:00:00') },
  { accountNo: '62000000000000002', transactionType: 'transfer_out', amount: '2000.00',  balanceAfter: '8000.00',  description: '转账给张三',     channelType: 'online',  tellerNo: null,   referenceNo: 'TXN20260205002', transactionDate: new Date('2026-02-05T10:01:00'), relatedAccountNo: '62000000000000001' },
  { accountNo: '62000000000000002', transactionType: 'fee',          amount: '5.00',     balanceAfter: '7995.00',  description: '跨行转账手续费', channelType: 'online',  tellerNo: null,   referenceNo: 'TXN20260205003', transactionDate: new Date('2026-02-05T10:02:00') },

  // 孙七 62000000000000005 — 5 条
  { accountNo: '62000000000000005', transactionType: 'deposit',      amount: '50000.00', balanceAfter: '50000.00', description: '大额现金存款',   channelType: 'counter', tellerNo: 'T001', referenceNo: 'TXN20260110005', transactionDate: new Date('2026-01-10T10:30:00') },
  { accountNo: '62000000000000005', transactionType: 'deposit',      amount: '38888.88', balanceAfter: '88888.88', description: '转账存入',       channelType: 'counter', tellerNo: 'T002', referenceNo: 'TXN20260115005', transactionDate: new Date('2026-01-15T11:00:00') },
  { accountNo: '62000000000000005', transactionType: 'transfer_out', amount: '20000.00', balanceAfter: '68888.88', description: '境外汇款',       channelType: 'counter', tellerNo: 'T001', referenceNo: 'TXN20260210005', transactionDate: new Date('2026-02-10T14:00:00') },
  { accountNo: '62000000000000005', transactionType: 'fee',          amount: '100.00',   balanceAfter: '68788.88', description: '境外汇款手续费', channelType: 'counter', tellerNo: 'T001', referenceNo: 'TXN20260210006', transactionDate: new Date('2026-02-10T14:01:00') },
  { accountNo: '62000000000000005', transactionType: 'other',        amount: '100.00',   balanceAfter: '88888.88', description: '账务调整',       channelType: 'counter', tellerNo: 'T003', referenceNo: 'TXN20260320005', transactionDate: new Date('2026-03-20T09:00:00') },

  // 冯十一 62000000000000009 — 5 条
  { accountNo: '62000000000000009', transactionType: 'deposit',      amount: '30000.00', balanceAfter: '30000.00', description: '现金存款',       channelType: 'counter', tellerNo: 'T002', referenceNo: 'TXN20260112009', transactionDate: new Date('2026-01-12T09:30:00') },
  { accountNo: '62000000000000009', transactionType: 'deposit',      amount: '50000.00', balanceAfter: '80000.00', description: '转账存入',       channelType: 'online',  tellerNo: null,   referenceNo: 'TXN20260201009', transactionDate: new Date('2026-02-01T08:00:00') },
  { accountNo: '62000000000000009', transactionType: 'transfer_in',  amount: '19999.99', balanceAfter: '99999.99', description: '到账',           channelType: 'batch',   tellerNo: null,   referenceNo: 'TXN20260215009', transactionDate: new Date('2026-02-15T17:00:00') },
  { accountNo: '62000000000000009', transactionType: 'withdrawal',   amount: '10000.00', balanceAfter: '89999.99', description: '现金取款',       channelType: 'atm',     tellerNo: null,   referenceNo: 'TXN20260301009', transactionDate: new Date('2026-03-01T12:00:00') },
  { accountNo: '62000000000000009', transactionType: 'deposit',      amount: '10000.00', balanceAfter: '99999.99', description: '现金存款',       channelType: 'counter', tellerNo: 'T001', referenceNo: 'TXN20260315009', transactionDate: new Date('2026-03-15T10:00:00') },
]

async function seed() {
  console.log('开始插入测试流水数据...')

  for (const item of txnData) {
    // 查找 accountId
    const acctRows = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.accountNo, item.accountNo))

    if (!acctRows.length) {
      console.log(`  跳过：未找到账号 ${item.accountNo}，请先执行 seedAccounts.js`)
      continue
    }

    const accountId = acctRows[0].id
    const { accountNo, ...rest } = item

    await db
      .insert(transactions)
      .values({ ...rest, accountId })
      .onConflictDoNothing()

    console.log(`  ✓ 账号 ${accountNo} | ${item.transactionType.padEnd(12)} | ${item.amount.padStart(12)} | ${item.referenceNo}`)
  }

  console.log('\n流水数据插入完成！')
  process.exit(0)
}

seed().catch((err) => {
  console.error('插入失败:', err.message)
  process.exit(1)
})
