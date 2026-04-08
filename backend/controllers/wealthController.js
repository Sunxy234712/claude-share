const { eq, and, or, ilike, desc, lte, gte, count, sql } = require('drizzle-orm')
const db = require('../db')
const {
  wealthProducts, wealthOrders, funds, fundHoldings, preciousMetals, metalHoldings, accounts,
} = require('../db/schema')

// 生成理财订单号：WLT+YYYYMMDDhhmmss+3位随机
function generateWealthOrderNo() {
  const now = new Date()
  const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `WLT${dateStr}${random}`
}

// ==================== 理财产品接口 ====================

async function getWealthProducts(req, res) {
  try {
    const { status, productType, page = '1', pageSize = '10' } = req.query
    const pageNum = Number(page)
    const pageSz = Number(pageSize)
    const offset = (pageNum - 1) * pageSz

    let whereClause = []
    if (status) whereClause.push(eq(wealthProducts.status, status))
    if (productType) whereClause.push(eq(wealthProducts.productType, productType))

    const [list, countResult] = await Promise.all([
      db
        .select()
        .from(wealthProducts)
        .where(whereClause.length > 0 ? and(...whereClause) : undefined)
        .limit(pageSz)
        .offset(offset),
      db
        .select({ count: count() })
        .from(wealthProducts)
        .where(whereClause.length > 0 ? and(...whereClause) : undefined),
    ])

    const total = Number(countResult[0].count)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    console.error('[错误] GET /wealth/products:', error.message)
    res.status(500).json({ success: false, message: '查询理财产品失败' })
  }
}

async function purchaseWealth(req, res) {
  try {
    const { accountId, productId, amount } = req.body

    if (!accountId || !productId || !amount) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const purchaseAmount = Number(amount)
    if (purchaseAmount <= 0) {
      return res.status(400).json({ success: false, message: '购买金额必须大于0' })
    }

    // 查询账户和产品
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId))
    const [product] = await db.select().from(wealthProducts).where(eq(wealthProducts.id, productId))

    if (!account) {
      return res.status(404).json({ success: false, message: '账户不存在' })
    }
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' })
    }

    // 校验产品状态
    if (product.status !== 'on_sale') {
      return res.status(400).json({ success: false, message: '产品已下架' })
    }

    // 校验起购和上限
    const min = Number(product.minAmount)
    const max = Number(product.maxAmount)
    if (purchaseAmount < min || purchaseAmount > max) {
      return res.status(400).json({ success: false, message: `购买金额需在 ${min} - ${max} 之间` })
    }

    // 校验账户余额
    const balance = Number(account.balance)
    if (balance < purchaseAmount) {
      return res.status(400).json({ success: false, message: '账户余额不足' })
    }

    // 计算预期收益和到期日期
    const expectedIncome = (purchaseAmount * Number(product.expectedReturn)) / 100
    const maturityDate = new Date()
    maturityDate.setDate(maturityDate.getDate() + product.termDays)

    // 创建订单
    const orderNo = generateWealthOrderNo()
    const [order] = await db
      .insert(wealthOrders)
      .values({
        accountId,
        productId,
        orderNo,
        amount: purchaseAmount.toFixed(2),
        purchaseDate: new Date(),
        maturityDate,
        expectedIncome: expectedIncome.toFixed(2),
        actualIncome: '0',
        status: 'active',
        tellerNo: req.user.tellerNo,
      })
      .returning()

    // 扣减账户余额
    const newBalance = (balance - purchaseAmount).toFixed(2)
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId))

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.orderNo,
        productName: product.productName,
        amount: order.amount,
        expectedIncome: order.expectedIncome,
        maturityDate: order.maturityDate,
      },
    })
  } catch (error) {
    console.error('[错误] POST /wealth/orders:', error.message)
    res.status(500).json({ success: false, message: '购买理财产品失败' })
  }
}

async function getWealthOrders(req, res) {
  try {
    const { accountId, page = '1', pageSize = '10' } = req.query
    const pageNum = Number(page)
    const pageSz = Number(pageSize)
    const offset = (pageNum - 1) * pageSz

    if (!accountId) {
      return res.status(400).json({ success: false, message: 'accountId 必填' })
    }

    const [list, countResult] = await Promise.all([
      db
        .select({
          id: wealthOrders.id,
          orderNo: wealthOrders.orderNo,
          productName: wealthProducts.productName,
          amount: wealthOrders.amount,
          expectedIncome: wealthOrders.expectedIncome,
          purchaseDate: wealthOrders.purchaseDate,
          maturityDate: wealthOrders.maturityDate,
          status: wealthOrders.status,
        })
        .from(wealthOrders)
        .leftJoin(wealthProducts, eq(wealthOrders.productId, wealthProducts.id))
        .where(eq(wealthOrders.accountId, Number(accountId)))
        .limit(pageSz)
        .offset(offset),
      db
        .select({ count: count() })
        .from(wealthOrders)
        .where(eq(wealthOrders.accountId, Number(accountId))),
    ])

    const total = Number(countResult[0].count)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    console.error('[错误] GET /wealth/orders:', error.message)
    res.status(500).json({ success: false, message: '查询理财订单失败' })
  }
}

async function redeemWealth(req, res) {
  try {
    const { orderId } = req.params
    const { accountId } = req.body

    if (!orderId || !accountId) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const [order] = await db.select().from(wealthOrders).where(eq(wealthOrders.id, Number(orderId)))
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    if (order.status !== 'active') {
      return res.status(400).json({ success: false, message: '只有持仓订单才能赎回' })
    }

    // 计算应退本息
    const amount = Number(order.amount)
    const expectedIncome = Number(order.expectedIncome)
    const totalReturn = amount + expectedIncome

    // 更新订单状态
    await db
      .update(wealthOrders)
      .set({
        status: 'redeemed',
        redemptionDate: new Date(),
        actualIncome: expectedIncome.toFixed(2),
      })
      .where(eq(wealthOrders.id, Number(orderId)))

    // 返还本息至账户
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId))
    const newBalance = (Number(account.balance) + totalReturn).toFixed(2)
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId))

    res.json({
      success: true,
      message: '赎回成功',
      data: { totalReturn: totalReturn.toFixed(2) },
    })
  } catch (error) {
    console.error('[错误] PUT /wealth/:id/redeem:', error.message)
    res.status(500).json({ success: false, message: '赎回失败' })
  }
}

// ==================== 基金接口 ====================

async function getFunds(req, res) {
  try {
    const { fundType, keyword, page = '1', pageSize = '10' } = req.query
    const pageNum = Number(page)
    const pageSz = Number(pageSize)
    const offset = (pageNum - 1) * pageSz

    let whereClause = [eq(funds.status, 'on_sale')]
    if (fundType) whereClause.push(eq(funds.fundType, fundType))
    if (keyword) whereClause.push(or(ilike(funds.fundName, `%${keyword}%`), ilike(funds.fundCode, `%${keyword}%`)))

    const [list, countResult] = await Promise.all([
      db
        .select()
        .from(funds)
        .where(and(...whereClause))
        .orderBy(desc(funds.nav))
        .limit(pageSz)
        .offset(offset),
      db
        .select({ count: count() })
        .from(funds)
        .where(and(...whereClause)),
    ])

    const total = Number(countResult[0].count)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    console.error('[错误] GET /wealth/funds:', error.message)
    res.status(500).json({ success: false, message: '查询基金列表失败' })
  }
}

async function purchaseFund(req, res) {
  try {
    const { accountId, fundId, amount } = req.body

    if (!accountId || !fundId || !amount) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const purchaseAmount = Number(amount)
    if (purchaseAmount < 1000) {
      return res.status(400).json({ success: false, message: '基金申购最低 1000 元' })
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId))
    const [fund] = await db.select().from(funds).where(eq(funds.id, fundId))

    if (!account) {
      return res.status(404).json({ success: false, message: '账户不存在' })
    }
    if (!fund) {
      return res.status(404).json({ success: false, message: '基金不存在' })
    }

    const balance = Number(account.balance)
    if (balance < purchaseAmount) {
      return res.status(400).json({ success: false, message: '账户余额不足' })
    }

    // 计算申购份额 = 申购金额 / 净值
    const navPrice = Number(fund.nav)
    const shares = purchaseAmount / navPrice

    // 创建或累加持仓
    const [existingHolding] = await db
      .select()
      .from(fundHoldings)
      .where(and(eq(fundHoldings.accountId, accountId), eq(fundHoldings.fundId, fundId)))

    if (existingHolding) {
      const newShares = Number(existingHolding.shares) + shares
      await db
        .update(fundHoldings)
        .set({ shares: newShares.toFixed(4) })
        .where(eq(fundHoldings.id, existingHolding.id))
    } else {
      await db
        .insert(fundHoldings)
        .values({
          accountId,
          fundId,
          shares: shares.toFixed(4),
          purchasePrice: navPrice.toFixed(4),
          purchaseDate: new Date(),
          tellerNo: req.user.tellerNo,
        })
    }

    // 扣减账户余额
    const newBalance = (balance - purchaseAmount).toFixed(2)
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId))

    res.status(201).json({
      success: true,
      data: {
        fundName: fund.fundName,
        amount: purchaseAmount.toFixed(2),
        shares: shares.toFixed(4),
        nav: fund.nav,
        totalValue: purchaseAmount.toFixed(2),
      },
    })
  } catch (error) {
    console.error('[错误] POST /wealth/fund-holdings:', error.message)
    res.status(500).json({ success: false, message: '基金申购失败' })
  }
}

async function getFundHoldings(req, res) {
  try {
    const { accountId } = req.query

    if (!accountId) {
      return res.status(400).json({ success: false, message: 'accountId 必填' })
    }

    const list = await db
      .select({
        id: fundHoldings.id,
        fundName: funds.fundName,
        fundCode: funds.fundCode,
        shares: fundHoldings.shares,
        purchasePrice: fundHoldings.purchasePrice,
        currentNav: funds.nav,
        purchaseDate: fundHoldings.purchaseDate,
      })
      .from(fundHoldings)
      .leftJoin(funds, eq(fundHoldings.fundId, funds.id))
      .where(eq(fundHoldings.accountId, Number(accountId)))

    // 计算当前价值和盈亏
    const result = list.map((item) => {
      const shares = Number(item.shares)
      const currentNav = Number(item.currentNav)
      const purchasePrice = Number(item.purchasePrice)
      const currentValue = shares * currentNav
      const costValue = shares * purchasePrice
      const profitLoss = currentValue - costValue
      const profitLossRate = ((profitLoss / costValue) * 100).toFixed(2)

      return {
        ...item,
        currentValue: currentValue.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        profitLossRate,
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[错误] GET /wealth/fund-holdings:', error.message)
    res.status(500).json({ success: false, message: '查询基金持仓失败' })
  }
}

async function redeemFund(req, res) {
  try {
    const { holdingId } = req.params
    const { shares } = req.body

    if (!holdingId || !shares) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const redeemShares = Number(shares)
    if (redeemShares <= 0) {
      return res.status(400).json({ success: false, message: '赎回份额必须大于0' })
    }

    const [holding] = await db.select().from(fundHoldings).where(eq(fundHoldings.id, Number(holdingId)))
    if (!holding) {
      return res.status(404).json({ success: false, message: '持仓不存在' })
    }

    const currentShares = Number(holding.shares)
    if (redeemShares > currentShares) {
      return res.status(400).json({ success: false, message: '赎回份额超过持仓' })
    }

    // 获取当前基金价格
    const [fund] = await db.select().from(funds).where(eq(funds.id, holding.fundId))
    const currentNav = Number(fund.nav)
    const redeemAmount = redeemShares * currentNav

    // 更新持仓（完全赎回则删除，部分赎回则更新）
    if (redeemShares === currentShares) {
      await db.delete(fundHoldings).where(eq(fundHoldings.id, Number(holdingId)))
    } else {
      const remainingShares = (currentShares - redeemShares).toFixed(4)
      await db
        .update(fundHoldings)
        .set({ shares: remainingShares })
        .where(eq(fundHoldings.id, Number(holdingId)))
    }

    // 返还赎回金额至账户
    const [account] = await db.select().from(accounts).where(eq(accounts.id, holding.accountId))
    const newBalance = (Number(account.balance) + redeemAmount).toFixed(2)
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, holding.accountId))

    res.json({
      success: true,
      message: '赎回成功',
      data: { redeemAmount: redeemAmount.toFixed(2) },
    })
  } catch (error) {
    console.error('[错误] PUT /wealth/fund-holdings/:id/redeem:', error.message)
    res.status(500).json({ success: false, message: '基金赎回失败' })
  }
}

// ==================== 贵金属接口 ====================

async function getMetals(req, res) {
  try {
    const list = await db
      .select()
      .from(preciousMetals)
      .where(eq(preciousMetals.status, 'trading'))

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('[错误] GET /wealth/metals:', error.message)
    res.status(500).json({ success: false, message: '查询贵金属列表失败' })
  }
}

async function getMetalQuote(req, res) {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ success: false, message: '贵金属ID必填' })
    }

    const [metal] = await db.select().from(preciousMetals).where(eq(preciousMetals.id, Number(id)))

    if (!metal) {
      return res.status(404).json({ success: false, message: '贵金属不存在' })
    }

    res.json({
      success: true,
      data: {
        id: metal.id,
        metalType: metal.metalType,
        purity: metal.purity,
        currentPrice: metal.currentPrice,
        priceUpdateTime: metal.priceUpdateTime,
        dailyChange: metal.dailyChange,
        status: metal.status,
      },
    })
  } catch (error) {
    console.error('[错误] GET /wealth/metals/:id/quote:', error.message)
    res.status(500).json({ success: false, message: '查询贵金属行情失败' })
  }
}

async function purchaseMetal(req, res) {
  try {
    const { accountId, metalId, amount } = req.body

    if (!accountId || !metalId || !amount) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const metalAmount = Number(amount)
    if (metalAmount <= 0) {
      return res.status(400).json({ success: false, message: '购买克数必须大于0' })
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId))
    const [metal] = await db.select().from(preciousMetals).where(eq(preciousMetals.id, metalId))

    if (!account) {
      return res.status(404).json({ success: false, message: '账户不存在' })
    }
    if (!metal) {
      return res.status(404).json({ success: false, message: '贵金属不存在' })
    }

    if (metal.status !== 'trading') {
      return res.status(400).json({ success: false, message: '该贵金属暂停交易' })
    }

    // 计算总成本
    const price = Number(metal.currentPrice)
    const totalCost = metalAmount * price
    const balance = Number(account.balance)

    if (balance < totalCost) {
      return res.status(400).json({ success: false, message: '账户余额不足' })
    }

    // 创建或累加持仓
    const [existingHolding] = await db
      .select()
      .from(metalHoldings)
      .where(and(eq(metalHoldings.accountId, accountId), eq(metalHoldings.metalId, metalId)))

    if (existingHolding) {
      const existingAmount = Number(existingHolding.amount)
      const existingCost = Number(existingHolding.averageCost)
      const newAmount = existingAmount + metalAmount
      const newAverageCost = ((existingAmount * existingCost + metalAmount * price) / newAmount).toFixed(2)
      await db
        .update(metalHoldings)
        .set({ amount: newAmount.toFixed(2), averageCost: newAverageCost })
        .where(eq(metalHoldings.id, existingHolding.id))
    } else {
      await db
        .insert(metalHoldings)
        .values({
          accountId,
          metalId,
          amount: metalAmount.toFixed(2),
          averageCost: price.toFixed(2),
          storageType: 'account',
          tellerNo: req.user.tellerNo,
        })
    }

    // 扣减账户余额
    const newBalance = (balance - totalCost).toFixed(2)
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId))

    res.status(201).json({
      success: true,
      data: {
        metalType: metal.metalType,
        amount: metalAmount.toFixed(2),
        purchasePrice: price,
        totalCost: totalCost.toFixed(2),
      },
    })
  } catch (error) {
    console.error('[错误] POST /wealth/metal-holdings:', error.message)
    res.status(500).json({ success: false, message: '贵金属积存失败' })
  }
}

async function getMetalHoldings(req, res) {
  try {
    const { accountId } = req.query

    if (!accountId) {
      return res.status(400).json({ success: false, message: 'accountId 必填' })
    }

    const list = await db
      .select({
        id: metalHoldings.id,
        metalType: preciousMetals.metalType,
        purity: preciousMetals.purity,
        amount: metalHoldings.amount,
        averageCost: metalHoldings.averageCost,
        currentPrice: preciousMetals.currentPrice,
        storageType: metalHoldings.storageType,
      })
      .from(metalHoldings)
      .leftJoin(preciousMetals, eq(metalHoldings.metalId, preciousMetals.id))
      .where(eq(metalHoldings.accountId, Number(accountId)))

    // 计算当前价值和盈亏
    const result = list.map((item) => {
      const amount = Number(item.amount)
      const currentPrice = Number(item.currentPrice)
      const averageCost = Number(item.averageCost)
      const currentValue = amount * currentPrice
      const costValue = amount * averageCost
      const profitLoss = currentValue - costValue
      const profitLossRate = ((profitLoss / costValue) * 100).toFixed(2)

      return {
        ...item,
        currentValue: currentValue.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        profitLossRate,
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[错误] GET /wealth/metal-holdings:', error.message)
    res.status(500).json({ success: false, message: '查询贵金属持仓失败' })
  }
}

async function exchangeMetal(req, res) {
  try {
    const { holdingId } = req.params
    const { fromMetalId, toMetalId, amount } = req.body

    if (!holdingId || !fromMetalId || !toMetalId || !amount) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const exchangeAmount = Number(amount)
    if (exchangeAmount <= 0) {
      return res.status(400).json({ success: false, message: '兑换克数必须大于0' })
    }

    const [holding] = await db.select().from(metalHoldings).where(eq(metalHoldings.id, Number(holdingId)))
    const [fromMetal] = await db.select().from(preciousMetals).where(eq(preciousMetals.id, fromMetalId))
    const [toMetal] = await db.select().from(preciousMetals).where(eq(preciousMetals.id, toMetalId))

    if (!holding || !fromMetal || !toMetal) {
      return res.status(404).json({ success: false, message: '参数有误' })
    }

    const currentAmount = Number(holding.amount)
    if (exchangeAmount > currentAmount) {
      return res.status(400).json({ success: false, message: '兑换克数超过持仓' })
    }

    // 按当前价格卖出旧金属，买入新金属
    const sellAmount = exchangeAmount * Number(fromMetal.currentPrice)
    const buyAmount = sellAmount / Number(toMetal.currentPrice)

    // 更新旧金属持仓
    if (exchangeAmount === currentAmount) {
      await db.delete(metalHoldings).where(eq(metalHoldings.id, Number(holdingId)))
    } else {
      const remainingAmount = (currentAmount - exchangeAmount).toFixed(2)
      await db
        .update(metalHoldings)
        .set({ amount: remainingAmount })
        .where(eq(metalHoldings.id, Number(holdingId)))
    }

    // 创建或累加新金属持仓
    const [existingNewHolding] = await db
      .select()
      .from(metalHoldings)
      .where(and(eq(metalHoldings.accountId, holding.accountId), eq(metalHoldings.metalId, toMetalId)))

    if (existingNewHolding) {
      const newAmount = Number(existingNewHolding.amount) + buyAmount
      await db
        .update(metalHoldings)
        .set({ amount: newAmount.toFixed(2) })
        .where(eq(metalHoldings.id, existingNewHolding.id))
    } else {
      await db
        .insert(metalHoldings)
        .values({
          accountId: holding.accountId,
          metalId: toMetalId,
          amount: buyAmount.toFixed(2),
          averageCost: Number(toMetal.currentPrice).toFixed(2),
          storageType: 'account',
          tellerNo: req.user.tellerNo,
        })
    }

    res.json({
      success: true,
      message: '兑换成功',
      data: {
        sellAmount: sellAmount.toFixed(2),
        buyAmount: buyAmount.toFixed(2),
      },
    })
  } catch (error) {
    console.error('[错误] PUT /wealth/metal-holdings/:id/exchange:', error.message)
    res.status(500).json({ success: false, message: '贵金属兑换失败' })
  }
}

async function applyDelivery(req, res) {
  try {
    const { holdingId } = req.params
    const { amount } = req.body

    if (!holdingId || !amount) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const deliveryAmount = Number(amount)
    if (deliveryAmount <= 0) {
      return res.status(400).json({ success: false, message: '提取克数必须大于0' })
    }

    const [holding] = await db.select().from(metalHoldings).where(eq(metalHoldings.id, Number(holdingId)))

    if (!holding) {
      return res.status(404).json({ success: false, message: '持仓不存在' })
    }

    const currentAmount = Number(holding.amount)
    if (deliveryAmount > currentAmount) {
      return res.status(400).json({ success: false, message: '提取克数超过持仓' })
    }

    // 更新存储类型为待提取
    await db
      .update(metalHoldings)
      .set({ storageType: 'pending_delivery' })
      .where(eq(metalHoldings.id, Number(holdingId)))

    res.json({
      success: true,
      message: '实物提取申请已提交，请等待审核',
      data: {
        deliveryNo: `DEL${Date.now()}`,
        estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    })
  } catch (error) {
    console.error('[错误] PUT /wealth/metal-holdings/:id/delivery:', error.message)
    res.status(500).json({ success: false, message: '实物提取申请失败' })
  }
}

module.exports = {
  getWealthProducts,
  purchaseWealth,
  getWealthOrders,
  redeemWealth,
  getFunds,
  purchaseFund,
  getFundHoldings,
  redeemFund,
  getMetals,
  getMetalQuote,
  purchaseMetal,
  getMetalHoldings,
  exchangeMetal,
  applyDelivery,
}
