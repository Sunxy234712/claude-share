const { eq, and, gte, lte, inArray, desc, count } = require('drizzle-orm')
const db = require('../db')
const { customers, accounts, cards, transactions } = require('../db/schema')

// 账户查询：三个条件均可选，全为空时返回所有账户
async function searchAccount(req, res) {
  const accountNo = (req.query.accountNo || '').trim()
  const cardNo    = (req.query.cardNo    || '').trim()
  const idNo      = (req.query.idNo      || '').trim()

  const conditions = []
  if (accountNo) conditions.push(eq(accounts.accountNo, accountNo))
  if (cardNo)    conditions.push(eq(cards.cardNo, cardNo))
  if (idNo)      conditions.push(eq(customers.idNo, idNo))

  const whereClause = conditions.length ? and(...conditions) : undefined

  const rows = await db
    .select({
      accountId:     accounts.id,
      accountNo:     accounts.accountNo,
      accountType:   accounts.accountType,
      balance:       accounts.balance,
      currency:      accounts.currency,
      accountStatus: accounts.status,
      openDate:      accounts.openDate,
      customerId:    customers.id,
      customerNo:    customers.customerNo,
      name:          customers.name,
      idType:        customers.idType,
      idNo:          customers.idNo,
      phone:         customers.phone,
      address:       customers.address,
      cardId:        cards.id,
      cardNo:        cards.cardNo,
      cardStatus:    cards.status,
    })
    .from(accounts)
    .leftJoin(customers, eq(accounts.customerId, customers.id))
    .leftJoin(cards, eq(cards.accountId, accounts.id))
    .where(whereClause)

  return res.json({
    success: true,
    data: rows.map(row => ({
      customer: {
        id:         row.customerId,
        customerNo: row.customerNo,
        name:       row.name,
        idType:     row.idType,
        idNo:       row.idNo,
        phone:      row.phone,
        address:    row.address,
      },
      account: {
        id:          row.accountId,
        accountNo:   row.accountNo,
        accountType: row.accountType,
        balance:     row.balance,
        currency:    row.currency,
        status:      row.accountStatus,
        openDate:    row.openDate,
      },
      card: {
        id:     row.cardId,
        cardNo: row.cardNo,
        status: row.cardStatus,
      },
    })),
  })
}

// 交易明细查询
async function getTransactions(req, res) {
  const { accountId, startDate, endDate, transactionType, page = 1, pageSize = 10 } = req.query

  if (!accountId || isNaN(Number(accountId))) {
    return res.status(400).json({ success: false, message: 'accountId 为必填项' })
  }

  const conditions = [eq(transactions.accountId, Number(accountId))]

  if (startDate) {
    conditions.push(gte(transactions.transactionDate, new Date(startDate + 'T00:00:00')))
  }
  if (endDate) {
    conditions.push(lte(transactions.transactionDate, new Date(endDate + 'T23:59:59')))
  }
  if (transactionType && transactionType.trim()) {
    const types = transactionType.split(',').map(t => t.trim()).filter(Boolean)
    if (types.length) {
      conditions.push(inArray(transactions.transactionType, types))
    }
  }

  const whereClause = and(...conditions)
  const showAll = Number(pageSize) === 0
  const offset = showAll ? 0 : (Number(page) - 1) * Number(pageSize)

  let listQuery = db
    .select()
    .from(transactions)
    .where(whereClause)
    .orderBy(desc(transactions.transactionDate))

  if (!showAll) {
    listQuery = listQuery.limit(Number(pageSize)).offset(offset)
  }

  const [list, totalRows] = await Promise.all([
    listQuery,
    db.select({ total: count() }).from(transactions).where(whereClause),
  ])

  return res.json({
    success: true,
    data: {
      list,
      total: Number(totalRows[0]?.total ?? 0),
    },
  })
}

module.exports = { searchAccount, getTransactions }
