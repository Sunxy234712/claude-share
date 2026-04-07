const { eq, or, ilike, and, count, sql } = require('drizzle-orm')
const db = require('../db')
const { customers, accounts, cards } = require('../db/schema')

// 生成客户号 C + 8位随机数字
function genCustomerNo() {
  return 'C' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0')
}

// 生成账号 62 + 14位随机数字
function genAccountNo() {
  return '62' + String(Math.floor(Math.random() * 1e14)).padStart(14, '0')
}

// 生成卡号 6228 + 12位随机数字
function genCardNo() {
  return '6228' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0')
}

// 账户列表查询（支持关键字模糊搜索 + 分页）
async function getAccounts(req, res) {
  const { keyword = '', page = 1, pageSize = 10 } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)

  // 联表查询：账户 + 客户 + 卡
  const baseQuery = db
    .select({
      accountId: accounts.id,
      accountNo: accounts.accountNo,
      accountType: accounts.accountType,
      balance: accounts.balance,
      currency: accounts.currency,
      accountStatus: accounts.status,
      openDate: accounts.openDate,
      customerId: customers.id,
      customerNo: customers.customerNo,
      name: customers.name,
      idType: customers.idType,
      idNo: customers.idNo,
      phone: customers.phone,
      address: customers.address,
      cardId: cards.id,
      cardNo: cards.cardNo,
      cardStatus: cards.status,
    })
    .from(accounts)
    .leftJoin(customers, eq(accounts.customerId, customers.id))
    .leftJoin(cards, eq(cards.accountId, accounts.id))

  // 关键字过滤
  const whereClause = keyword
    ? or(
        ilike(customers.name, `%${keyword}%`),
        ilike(customers.idNo, `%${keyword}%`),
        ilike(accounts.accountNo, `%${keyword}%`)
      )
    : undefined

  const list = await (whereClause
    ? baseQuery.where(whereClause).limit(Number(pageSize)).offset(offset)
    : baseQuery.limit(Number(pageSize)).offset(offset))

  // 查询总数
  const totalResult = await db
    .select({ total: count() })
    .from(accounts)
    .leftJoin(customers, eq(accounts.customerId, customers.id))
    .where(whereClause || sql`1=1`)

  return res.json({ success: true, data: { list, total: Number(totalResult[0].total) } })
}

// 开户
async function openAccount(req, res) {
  const { name, idType, idNo, phone, address, accountType } = req.body
  if (!name || !idNo || !accountType) {
    return res.status(400).json({ success: false, message: '姓名、证件号、账户类型为必填项' })
  }

  // 查找是否已有客户
  let customer
  const existing = await db.select().from(customers).where(eq(customers.idNo, idNo))
  if (existing.length > 0) {
    customer = existing[0]
  } else {
    // 新建客户
    const inserted = await db
      .insert(customers)
      .values({ customerNo: genCustomerNo(), name, idType: idType || 'id_card', idNo, phone, address })
      .returning()
    customer = inserted[0]
  }

  // 新建账户
  const accountInserted = await db
    .insert(accounts)
    .values({ accountNo: genAccountNo(), customerId: customer.id, accountType })
    .returning()
  const account = accountInserted[0]

  // 新建银行卡
  const cardInserted = await db
    .insert(cards)
    .values({ cardNo: genCardNo(), accountId: account.id })
    .returning()
  const card = cardInserted[0]

  return res.status(201).json({ success: true, data: { customer, account, card } })
}

// 销户
async function cancelAccount(req, res) {
  const { accountId } = req.params

  const rows = await db.select().from(accounts).where(eq(accounts.id, Number(accountId)))
  if (!rows.length) return res.status(404).json({ success: false, message: '账户不存在' })

  const account = rows[0]
  if (Number(account.balance) !== 0) {
    return res.status(400).json({ success: false, message: '账户余额不为零，无法销户' })
  }
  if (account.status === 'cancelled') {
    return res.status(400).json({ success: false, message: '账户已销户' })
  }

  await db.update(accounts).set({ status: 'cancelled' }).where(eq(accounts.id, Number(accountId)))
  await db.update(cards).set({ status: 'frozen' }).where(eq(cards.accountId, Number(accountId)))

  return res.json({ success: true, message: '销户成功' })
}

// 挂失
async function freezeAccount(req, res) {
  const { accountId } = req.params

  const rows = await db.select().from(accounts).where(eq(accounts.id, Number(accountId)))
  if (!rows.length) return res.status(404).json({ success: false, message: '账户不存在' })
  if (rows[0].status === 'cancelled') {
    return res.status(400).json({ success: false, message: '已销户账户无法挂失' })
  }

  await db.update(accounts).set({ status: 'frozen' }).where(eq(accounts.id, Number(accountId)))
  await db.update(cards).set({ status: 'lost' }).where(eq(cards.accountId, Number(accountId)))

  return res.json({ success: true, message: '挂失成功' })
}

// 解挂
async function unfreezeAccount(req, res) {
  const { accountId } = req.params

  const rows = await db.select().from(accounts).where(eq(accounts.id, Number(accountId)))
  if (!rows.length) return res.status(404).json({ success: false, message: '账户不存在' })
  if (rows[0].status !== 'frozen') {
    return res.status(400).json({ success: false, message: '账户未处于冻结状态' })
  }

  await db.update(accounts).set({ status: 'normal' }).where(eq(accounts.id, Number(accountId)))
  await db.update(cards).set({ status: 'normal' }).where(eq(cards.accountId, Number(accountId)))

  return res.json({ success: true, message: '解挂成功' })
}

// 客户信息维护
async function updateCustomerInfo(req, res) {
  const { customerId } = req.params
  const { phone, address } = req.body

  const updateData = {}
  if (phone !== undefined) updateData.phone = phone
  if (address !== undefined) updateData.address = address

  if (!Object.keys(updateData).length) {
    return res.status(400).json({ success: false, message: '没有需要更新的字段' })
  }

  await db.update(customers).set(updateData).where(eq(customers.id, Number(customerId)))

  return res.json({ success: true, message: '信息更新成功' })
}

module.exports = { getAccounts, openAccount, cancelAccount, freezeAccount, unfreezeAccount, updateCustomerInfo }
