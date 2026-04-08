require('dotenv').config()
const db = require('./index')
const { wealthProducts, wealthOrders, funds, fundHoldings, preciousMetals, metalHoldings } = require('./schema')

async function seedWealth() {
  console.log('开始种子数据...')

  try {
    // 插入理财产品（6条）
    const wealthProds = await db
      .insert(wealthProducts)
      .values([
        {
          productCode: 'WLT202601',
          productName: '工银稳健增益365天理财',
          productType: 'fixed_income',
          expectedReturn: '3.50',
          minAmount: '10000.00',
          maxAmount: '1000000.00',
          termDays: 365,
          status: 'on_sale',
        },
        {
          productCode: 'WLT202602',
          productName: '招银进宝增强型结构性理财',
          productType: 'structured',
          expectedReturn: '4.20',
          minAmount: '50000.00',
          maxAmount: '5000000.00',
          termDays: 180,
          status: 'on_sale',
        },
        {
          productCode: 'WLT202603',
          productName: '中银日日鑫活期浮动理财',
          productType: 'floating_rate',
          expectedReturn: '3.80',
          minAmount: '5000.00',
          maxAmount: '500000.00',
          termDays: 90,
          status: 'on_sale',
        },
        {
          productCode: 'WLT202604',
          productName: '建银鑫誉两年期固定收益',
          productType: 'fixed_income',
          expectedReturn: '4.50',
          minAmount: '100000.00',
          maxAmount: '10000000.00',
          termDays: 730,
          status: 'off_sale',
        },
        {
          productCode: 'WLT202605',
          productName: '农行金钥匙年年盈理财',
          productType: 'fixed_income',
          expectedReturn: '3.20',
          minAmount: '10000.00',
          maxAmount: '500000.00',
          termDays: 365,
          status: 'matured',
        },
        {
          productCode: 'WLT202606',
          productName: '交行沃德智赢四个月结构性',
          productType: 'structured',
          expectedReturn: '3.95',
          minAmount: '20000.00',
          maxAmount: '2000000.00',
          termDays: 120,
          status: 'on_sale',
        },
      ])
      .returning()

    console.log(`✓ 创建了 ${wealthProds.length} 个理财产品`)

    // 插入理财订单（accountId=1 张三，defaultAccountId）
    const purchaseDate1 = new Date('2025-10-01T09:30:00')
    const maturityDate1 = new Date('2026-10-01T09:30:00')
    const purchaseDate2 = new Date('2026-01-10T14:00:00')
    const maturityDate2 = new Date('2026-04-10T14:00:00')
    const purchaseDate3 = new Date('2025-03-01T10:15:00')
    const maturityDate3 = new Date('2025-06-01T10:15:00')

    const orders = await db
      .insert(wealthOrders)
      .values([
        {
          accountId: 1,
          productId: wealthProds[2].id, // 中银日日鑫活期浮动（在售）
          orderNo: 'WLT20260110140001001',
          amount: '5000.00',
          purchaseDate: purchaseDate2,
          maturityDate: maturityDate2,
          expectedIncome: '47.18', // 5000 * 3.8% * 90/365
          actualIncome: '0',
          status: 'active',
          tellerNo: 'T001',
        },
        {
          accountId: 1,
          productId: wealthProds[4].id, // 农行金钥匙（已到期）
          orderNo: 'WLT20250301101501001',
          amount: '5000.00',
          purchaseDate: purchaseDate3,
          maturityDate: maturityDate3,
          expectedIncome: '39.45', // 5000 * 3.2% * 90/365
          actualIncome: '39.45',
          status: 'matured',
          tellerNo: 'T002',
        },
      ])
      .returning()

    console.log(`✓ 创建了 ${orders.length} 条理财订单（accountId=1）`)

    // 插入基金（8条）
    const fundList = await db
      .insert(funds)
      .values([
        {
          fundCode: '110022',
          fundName: '易方达消费行业股票',
          fundType: 'equity',
          nav: '2.1450',
          navDate: new Date(),
          performance1m: '2.34',
          performance1y: '12.56',
          manager: '王俊杰',
          status: 'on_sale',
        },
        {
          fundCode: '519674',
          fundName: '银河创新成长混合',
          fundType: 'equity',
          nav: '3.4560',
          navDate: new Date(),
          performance1m: '-1.23',
          performance1y: '8.45',
          manager: '傅鹏博',
          status: 'on_sale',
        },
        {
          fundCode: '163402',
          fundName: '兴全合润混合发起',
          fundType: 'bond',
          nav: '1.8920',
          navDate: new Date(),
          performance1m: '0.45',
          performance1y: '4.32',
          manager: '谢治宇',
          status: 'on_sale',
        },
        {
          fundCode: '161725',
          fundName: '招商中证白酒指数',
          fundType: 'bond',
          nav: '1.2345',
          navDate: new Date(),
          performance1m: '0.12',
          performance1y: '2.87',
          manager: '侯昊',
          status: 'on_sale',
        },
        {
          fundCode: '519005',
          fundName: '汇添富价值精选混合',
          fundType: 'mixed',
          nav: '2.5670',
          navDate: new Date(),
          performance1m: '1.23',
          performance1y: '6.78',
          manager: '劳杰男',
          status: 'on_sale',
        },
        {
          fundCode: '121001',
          fundName: '国泰金鑫股票',
          fundType: 'mixed',
          nav: '1.7890',
          navDate: new Date(),
          performance1m: '-0.56',
          performance1y: '3.45',
          manager: '程洲',
          status: 'on_sale',
        },
        {
          fundCode: '511800',
          fundName: '华夏上证50ETF联接(A)',
          fundType: 'money',
          nav: '1.0000',
          navDate: new Date(),
          performance1m: '0.08',
          performance1y: '1.50',
          manager: '张弘弢',
          status: 'on_sale',
        },
        {
          fundCode: '110038',
          fundName: '易方达货币市场基金(A)',
          fundType: 'money',
          nav: '1.0234',
          navDate: new Date(),
          performance1m: '0.05',
          performance1y: '1.20',
          manager: '林林',
          status: 'suspended',
        },
      ])
      .returning()

    console.log(`✓ 创建了 ${fundList.length} 个基金产品`)

    // 插入基金持仓（accountId=1 张三）
    const holdings = await db
      .insert(fundHoldings)
      .values([
        {
          accountId: 1,
          fundId: fundList[6].id, // 华夏上证50ETF联接(A)，货币型低风险
          shares: '1000.0000',    // 1000 / 1.0000
          purchasePrice: '1.0000',
          purchaseDate: new Date('2025-12-10T09:00:00'),
          tellerNo: 'T001',
        },
        {
          accountId: 1,
          fundId: fundList[2].id, // 兴全合润混合发起
          shares: '529.1005',     // 1000 / 1.8900 ≈ 529份
          purchasePrice: '1.8900',
          purchaseDate: new Date('2026-02-20T14:30:00'),
          tellerNo: 'T002',
        },
      ])
      .returning()

    console.log(`✓ 创建了 ${holdings.length} 条基金持仓`)

    // 插入贵金属（4条）
    const metalList = await db
      .insert(preciousMetals)
      .values([
        {
          metalType: 'gold',
          purity: 'Au9999',
          currentPrice: '708.50',
          priceUpdateTime: new Date(),
          dailyChange: '0.85',
          status: 'trading',
        },
        {
          metalType: 'silver',
          purity: 'Ag9999',
          currentPrice: '8.32',
          priceUpdateTime: new Date(),
          dailyChange: '-0.25',
          status: 'trading',
        },
        {
          metalType: 'platinum',
          purity: 'Pt9995',
          currentPrice: '210.75',
          priceUpdateTime: new Date(),
          dailyChange: '0.45',
          status: 'trading',
        },
        {
          metalType: 'copper',
          purity: 'Cu9999',
          currentPrice: '3.85',
          priceUpdateTime: new Date(),
          dailyChange: '-0.12',
          status: 'trading',
        },
      ])
      .returning()

    console.log(`✓ 创建了 ${metalList.length} 个贵金属产品`)

    // 插入贵金属持仓（accountId=1 张三）
    const metalHoldingList = await db
      .insert(metalHoldings)
      .values([
        {
          accountId: 1,
          metalId: metalList[0].id, // 黄金
          amount: '1.00',           // 1克
          averageCost: '690.00',    // 历史买入均价690元/克
          storageType: 'account',
          tellerNo: 'T001',
        },
        {
          accountId: 1,
          metalId: metalList[1].id, // 白银
          amount: '50.00',          // 50克
          averageCost: '7.80',      // 历史买入均价7.80元/克
          storageType: 'account',
          tellerNo: 'T001',
        },
      ])
      .returning()

    console.log(`✓ 创建了 ${metalHoldingList.length} 条贵金属持仓`)
    console.log('✓ 种子数据插入成功！')
    process.exit(0)
  } catch (error) {
    console.error('✗ 种子数据插入失败：', error.message)
    console.error('详细错误：', error)
    process.exit(1)
  }
}

seedWealth()
